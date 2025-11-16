<?php
/**
 * API Backend for Estoque Gemini
 * PHP Version for cPanel/Apache deployment
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load database configuration
require_once __DIR__ . '/config.php';

// Database connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

$conn->set_charset('utf8mb4');

// Enable autocommit to ensure changes are saved immediately
$conn->autocommit(TRUE);

// Get request details
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove api.php from path and get the resource path
// Examples:
// /estoque/api.php/auth/login -> auth/login
// /EstoqueGemini/api.php/products -> products
// /api.php/users/1 -> users/1
$path = preg_replace('#^.*/api\.php/?#', '', $path);

// If path is empty, check query string for backward compatibility
if (empty($path) && isset($_GET['path'])) {
    $path = $_GET['path'];
}

$path_parts = explode('/', trim($path, '/'));

$resource = $path_parts[0] ?? '';
$id = $path_parts[1] ?? null;

// DEBUG: Log path parsing
error_log("API Request - Method: $method | URI: $request_uri | Path: $path | Resource: $resource | ID: " . ($id ?? 'null'));

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

// Session management for user authentication
session_start();

// Helper function to get current user from session/header
function getCurrentUser($conn) {
    // For now, use simple token in Authorization header
    // Format: Bearer {user_id}
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $_SESSION['user_id'] ?? null;
    
    if ($auth) {
        // Extract user ID from Bearer token or session
        $userId = is_numeric($auth) ? (int)$auth : null;
        if (strpos($auth, 'Bearer ') === 0) {
            $userId = (int)substr($auth, 7);
        }
        
        if ($userId) {
            $stmt = $conn->prepare("SELECT id, company_id, role FROM users WHERE id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                return [
                    'id' => (int)$row['id'],
                    'company_id' => (int)$row['company_id'],
                    'role' => $row['role']
                ];
            }
        }
    }
    
    return null;
}

// Helper to check if user can access resource
function checkCompanyAccess($currentUser, $resourceCompanyId) {
    if (!$currentUser) return false;
    
    // Super Admin can access everything
    if ($currentUser['role'] === 'Super Admin') {
        return true;
    }
    
    // Others can only access their own company
    return $currentUser['company_id'] === (int)$resourceCompanyId;
}

// Helper function to log activities
function logActivity($conn, $currentUser, $action, $entityType, $entityId, $oldData = null, $newData = null) {
    if (!$currentUser) return;
    
    $userId = $currentUser['id'];
    $companyId = $currentUser['company_id'];
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    // Truncate user agent if too long
    if ($userAgent && strlen($userAgent) > 255) {
        $userAgent = substr($userAgent, 0, 255);
    }
    
    $oldDataJson = $oldData ? json_encode($oldData, JSON_UNESCAPED_UNICODE) : null;
    $newDataJson = $newData ? json_encode($newData, JSON_UNESCAPED_UNICODE) : null;
    
    $stmt = $conn->prepare(
        "INSERT INTO activity_log (user_id, company_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    
    $stmt->bind_param(
        "iississss",
        $userId,
        $companyId,
        $action,
        $entityType,
        $entityId,
        $oldDataJson,
        $newDataJson,
        $ipAddress,
        $userAgent
    );
    
    $stmt->execute();
    $stmt->close();
}

// Helper function to convert product data types
function formatProduct($product) {
    if (!$product) return null;
    return [
        'id' => (int)$product['id'],
        'name' => $product['name'],
        'sku' => $product['sku'],
        'categoryId' => (int)$product['category_id'],
        'supplierId' => (int)$product['supplier_id'],
        'price' => (float)$product['price'],
        'stock' => (int)$product['stock'],
        'minStock' => (int)$product['min_stock'],
        'imageUrl' => $product['image_url'],
        'companyId' => (int)$product['company_id']
    ];
}

// Helper function to convert category data types
function formatCategory($category) {
    if (!$category) return null;
    return [
        'id' => (int)$category['id'],
        'name' => $category['name'],
        'description' => $category['description'] ?? '',
        'companyId' => (int)$category['company_id']
    ];
}

// Helper function to convert supplier data types
function formatSupplier($supplier) {
    if (!$supplier) return null;
    return [
        'id' => (int)$supplier['id'],
        'name' => $supplier['name'],
        'contact' => $supplier['contact'] ?? '',
        'email' => $supplier['email'] ?? '',
        'phone' => $supplier['phone'] ?? '',
        'companyId' => (int)$supplier['company_id']
    ];
}

// Helper function to convert user data types
function formatUser($user) {
    if (!$user) return null;
    return [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'companyId' => (int)$user['company_id'],
        'avatar' => $user['avatar'] ?? ''
    ];
}

// Helper function to convert company data types
function formatCompany($company) {
    if (!$company) return null;
    return [
        'id' => (int)$company['id'],
        'name' => $company['name'],
        'cnpj' => $company['cnpj'] ?? '',
        'address' => $company['address'] ?? ''
    ];
}

// Helper function to convert stock movement data types
function formatStockMovement($movement) {
    if (!$movement) return null;
    return [
        'id' => (int)$movement['id'],
        'productId' => (int)$movement['product_id'],
        'userId' => (int)$movement['user_id'],
        'type' => $movement['type'],
        'quantity' => (int)$movement['quantity'],
        'reason' => $movement['reason'] ?? '',
        'date' => $movement['date']
    ];
}

// Router
try {
    switch ($resource) {
        case 'debug':
            // Debug endpoint - shows all request info
            echo json_encode([
                'method' => $method,
                'request_uri' => $request_uri,
                'path' => $path,
                'path_parts' => $path_parts,
                'resource' => $resource,
                'id' => $id,
                'input' => $input,
                'server' => [
                    'REQUEST_URI' => $_SERVER['REQUEST_URI'],
                    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'],
                    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? null,
                    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? null
                ]
            ]);
            break;
            
        case 'health':
            echo json_encode(['status' => 'ok', 'message' => 'Server is running']);
            break;
            
        case 'auth':
            handleAuth($conn, $path_parts, $input);
            break;
            
        case 'products':
            handleProducts($conn, $method, $id, $input);
            break;
            
        case 'products-import':
            handleProductsImport($conn, $method, $input);
            break;
            
        case 'categories':
            handleCategories($conn, $method, $id, $input);
            break;
            
        case 'categories-import':
            handleCategoriesImport($conn, $method, $input);
            break;
            
        case 'suppliers':
            handleSuppliers($conn, $method, $id, $input);
            break;
            
        case 'suppliers-import':
            handleSuppliersImport($conn, $method, $input);
            break;
            
        case 'users':
            handleUsers($conn, $method, $id, $input);
            break;
            
        case 'companies':
            handleCompanies($conn, $method, $id, $input);
            break;
            
        case 'stock-movements':
            handleStockMovements($conn, $method, $id, $input);
            break;
            
        case 'bulk-operations':
            handleBulkOperations($conn, $method, $input);
            break;
            
        case 'activity-log':
            handleActivityLog($conn, $method, $id, $input);
            break;
            
        case 'dashboard':
            handleDashboard($conn);
            break;
            
        case 'settings':
            handleSettings($conn, $method, $input);
            break;
            
        case 'company-settings':
            handleCompanySettings($conn, $method, $input);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();

// ============== HANDLERS ==============

function handleAuth($conn, $path_parts, $input) {
    if ($path_parts[1] === 'login') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        
        // Buscar usuário por email com company_id
        $stmt = $conn->prepare("SELECT id, name, email, password, role, company_id, avatar FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            // Verificar senha usando password_verify
            if (password_verify($password, $row['password'])) {
                error_log("Login SUCCESS for: " . $email);
                
                // Salvar na sessão
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['company_id'] = $row['company_id'];
                $_SESSION['role'] = $row['role'];
                
                // Remover password do retorno
                unset($row['password']);
                
                // Converter tipos
                $user = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'role' => $row['role'],
                    'companyId' => (int)$row['company_id'],
                    'avatar' => $row['avatar']
                ];
                
                echo json_encode($user);
            } else {
                error_log("Login FAILED - Password mismatch for: " . $email);
                http_response_code(401);
                echo json_encode(['error' => 'Email ou senha inválidos']);
            }
        } else {
            error_log("Login FAILED - Email not found: " . $email);
            http_response_code(401);
            echo json_encode(['error' => 'Email ou senha inválidos']);
        }
        
        $stmt->close();
    }
}

function handleProducts($conn, $method, $id, $input) {
    $currentUser = getCurrentUser($conn);
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // Verificar se o produto pertence à empresa do usuário
                $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND company_id = ?");
                $stmt->bind_param("ii", $id, $currentUser['company_id']);
                $stmt->execute();
                $result = $stmt->get_result();
                $product = $result->fetch_assoc();
                
                if (!$product && $currentUser['role'] !== 'Super Admin') {
                    http_response_code(403);
                    echo json_encode(['error' => 'Acesso negado']);
                    return;
                }
                
                echo json_encode(formatProduct($product));
                $stmt->close();
            } else {
                // Listar apenas produtos da empresa do usuário
                if ($currentUser['role'] === 'Super Admin') {
                    $result = $conn->query("SELECT * FROM products ORDER BY id DESC");
                } else {
                    $stmt = $conn->prepare("SELECT * FROM products WHERE company_id = ? ORDER BY id DESC");
                    $stmt->bind_param("i", $currentUser['company_id']);
                    $stmt->execute();
                    $result = $stmt->get_result();
                }
                
                $products = [];
                while ($row = $result->fetch_assoc()) {
                    $products[] = formatProduct($row);
                }
                echo json_encode($products);
                
                if (isset($stmt)) $stmt->close();
            }
            break;
            
        case 'POST':
            // Criar produto na empresa do usuário
            $imageUrl = 'https://picsum.photos/seed/' . time() . '/400';
            $stmt = $conn->prepare("INSERT INTO products (name, sku, category_id, supplier_id, price, stock, min_stock, image_url, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssiidiisi", 
                $input['name'], 
                $input['sku'], 
                $input['categoryId'], 
                $input['supplierId'], 
                $input['price'], 
                $input['stock'], 
                $input['minStock'], 
                $imageUrl,
                $currentUser['company_id']
            );
            $stmt->execute();
            $newId = $conn->insert_id;
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $result = $stmt->get_result();
            $product = $result->fetch_assoc();
            
            // Log activity
            logActivity($conn, $currentUser, 'INSERT', 'products', $newId, null, formatProduct($product));
            
            http_response_code(201);
            echo json_encode(formatProduct($product));
            $stmt->close();
            break;
            
        case 'PUT':
            // Verificar se o produto pertence à empresa do usuário
            $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $currentProduct = $result->fetch_assoc();
            $stmt->close();
            
            if (!$currentProduct) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado ou produto não encontrado']);
                return;
            }
            
            // Salvar dados antigos para log
            $oldData = formatProduct($currentProduct);
            
            // Mesclar dados atuais com dados enviados
            $name = isset($input['name']) ? $input['name'] : $currentProduct['name'];
            $sku = isset($input['sku']) ? $input['sku'] : $currentProduct['sku'];
            $categoryId = isset($input['categoryId']) ? $input['categoryId'] : $currentProduct['category_id'];
            $supplierId = isset($input['supplierId']) ? $input['supplierId'] : $currentProduct['supplier_id'];
            $price = isset($input['price']) ? $input['price'] : $currentProduct['price'];
            $stock = isset($input['stock']) ? $input['stock'] : $currentProduct['stock'];
            $minStock = isset($input['minStock']) ? $input['minStock'] : $currentProduct['min_stock'];
            $imageUrl = isset($input['imageUrl']) ? $input['imageUrl'] : $currentProduct['image_url'];
            
            $stmt = $conn->prepare("UPDATE products SET name = ?, sku = ?, category_id = ?, supplier_id = ?, price = ?, stock = ?, min_stock = ?, image_url = ? WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ssiidiisii", 
                $name, 
                $sku, 
                $categoryId, 
                $supplierId, 
                $price, 
                $stock, 
                $minStock,
                $imageUrl,
                $id,
                $currentUser['company_id']
            );
            
            if (!$stmt->execute()) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao atualizar produto: ' . $stmt->error]);
                $stmt->close();
                return;
            }
            
            $affectedRows = $stmt->affected_rows;
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $product = $result->fetch_assoc();
            $newData = formatProduct($product);
            
            // Log activity
            logActivity($conn, $currentUser, 'UPDATE', 'products', $id, $oldData, $newData);
            
            echo json_encode($newData);
            $stmt->close();
            break;
            
        case 'DELETE':
            // Buscar dados antes de deletar para o log
            $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $productToDelete = $result->fetch_assoc();
            $stmt->close();
            
            if (!$productToDelete) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado ou produto não encontrado']);
                return;
            }
            
            $oldData = formatProduct($productToDelete);
            
            // Deletar produto
            $stmt = $conn->prepare("DELETE FROM products WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $stmt->close();
            
            // Log activity
            logActivity($conn, $currentUser, 'DELETE', 'products', $id, $oldData, null);
            
            echo json_encode(['success' => true]);
            break;
    }
}

function handleCategories($conn, $method, $id, $input) {
    $currentUser = getCurrentUser($conn);
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            // Listar apenas categorias da empresa do usuário
            if ($currentUser['role'] === 'Super Admin') {
                $result = $conn->query("SELECT * FROM categories ORDER BY id DESC");
            } else {
                $stmt = $conn->prepare("SELECT * FROM categories WHERE company_id = ? ORDER BY id DESC");
                $stmt->bind_param("i", $currentUser['company_id']);
                $stmt->execute();
                $result = $stmt->get_result();
            }
            
            $categories = [];
            while ($row = $result->fetch_assoc()) {
                $categories[] = formatCategory($row);
            }
            echo json_encode($categories);
            
            if (isset($stmt)) $stmt->close();
            break;
            
        case 'POST':
            $stmt = $conn->prepare("INSERT INTO categories (name, description, company_id) VALUES (?, ?, ?)");
            $description = $input['description'] ?? '';
            $stmt->bind_param("ssi", $input['name'], $description, $currentUser['company_id']);
            $stmt->execute();
            $newId = $conn->insert_id;
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $result = $stmt->get_result();
            $category = $result->fetch_assoc();
            
            // Log activity
            logActivity($conn, $currentUser, 'INSERT', 'categories', $newId, null, formatCategory($category));
            
            http_response_code(201);
            echo json_encode(formatCategory($category));
            $stmt->close();
            break;
            
        case 'PUT':
            // Buscar dados antigos
            $stmt = $conn->prepare("SELECT * FROM categories WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $oldCategory = $result->fetch_assoc();
            $stmt->close();
            
            if (!$oldCategory) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado']);
                return;
            }
            
            $oldData = formatCategory($oldCategory);
            
            // Atualizar
            $stmt = $conn->prepare("UPDATE categories SET name = ?, description = ? WHERE id = ? AND company_id = ?");
            $description = $input['description'] ?? '';
            $stmt->bind_param("ssii", $input['name'], $description, $id, $currentUser['company_id']);
            $stmt->execute();
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $category = $result->fetch_assoc();
            $newData = formatCategory($category);
            
            // Log activity
            logActivity($conn, $currentUser, 'UPDATE', 'categories', $id, $oldData, $newData);
            
            echo json_encode($newData);
            $stmt->close();
            break;
            
        case 'DELETE':
            // Buscar dados antes de deletar
            $stmt = $conn->prepare("SELECT * FROM categories WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $categoryToDelete = $result->fetch_assoc();
            $stmt->close();
            
            if (!$categoryToDelete) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado']);
                return;
            }
            
            $oldData = formatCategory($categoryToDelete);
            
            $stmt = $conn->prepare("DELETE FROM categories WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $stmt->close();
            
            // Log activity
            logActivity($conn, $currentUser, 'DELETE', 'categories', $id, $oldData, null);
            
            echo json_encode(['success' => true]);
            break;
    }
}

function handleSuppliers($conn, $method, $id, $input) {
    $currentUser = getCurrentUser($conn);
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            // Listar apenas fornecedores da empresa do usuário
            if ($currentUser['role'] === 'Super Admin') {
                $result = $conn->query("SELECT * FROM suppliers ORDER BY id DESC");
            } else {
                $stmt = $conn->prepare("SELECT * FROM suppliers WHERE company_id = ? ORDER BY id DESC");
                $stmt->bind_param("i", $currentUser['company_id']);
                $stmt->execute();
                $result = $stmt->get_result();
            }
            
            $suppliers = [];
            while ($row = $result->fetch_assoc()) {
                $suppliers[] = formatSupplier($row);
            }
            echo json_encode($suppliers);
            
            if (isset($stmt)) $stmt->close();
            break;
            
        case 'POST':
            $stmt = $conn->prepare("INSERT INTO suppliers (name, contact_person, email, phone, company_id) VALUES (?, ?, ?, ?, ?)");
            $contactPerson = $input['contactPerson'] ?? '';
            $email = $input['email'] ?? '';
            $phone = $input['phone'] ?? '';
            $stmt->bind_param("ssssi", $input['name'], $contactPerson, $email, $phone, $currentUser['company_id']);
            $stmt->execute();
            $newId = $conn->insert_id;
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM suppliers WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $result = $stmt->get_result();
            $supplier = $result->fetch_assoc();
            
            // Log activity
            logActivity($conn, $currentUser, 'INSERT', 'suppliers', $newId, null, formatSupplier($supplier));
            
            http_response_code(201);
            echo json_encode(formatSupplier($supplier));
            $stmt->close();
            break;
            
        case 'PUT':
            // Buscar dados antigos
            $stmt = $conn->prepare("SELECT * FROM suppliers WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $oldSupplier = $result->fetch_assoc();
            $stmt->close();
            
            if (!$oldSupplier) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado']);
                return;
            }
            
            $oldData = formatSupplier($oldSupplier);
            
            // Atualizar
            $stmt = $conn->prepare("UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ? WHERE id = ? AND company_id = ?");
            $contactPerson = $input['contactPerson'] ?? '';
            $email = $input['email'] ?? '';
            $phone = $input['phone'] ?? '';
            $stmt->bind_param("ssssii", $input['name'], $contactPerson, $email, $phone, $id, $currentUser['company_id']);
            $stmt->execute();
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM suppliers WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $supplier = $result->fetch_assoc();
            $newData = formatSupplier($supplier);
            
            // Log activity
            logActivity($conn, $currentUser, 'UPDATE', 'suppliers', $id, $oldData, $newData);
            
            echo json_encode($newData);
            $stmt->close();
            break;
            
        case 'DELETE':
            // Buscar dados antes de deletar
            $stmt = $conn->prepare("SELECT * FROM suppliers WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $supplierToDelete = $result->fetch_assoc();
            $stmt->close();
            
            if (!$supplierToDelete) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado']);
                return;
            }
            
            $oldData = formatSupplier($supplierToDelete);
            
            $stmt = $conn->prepare("DELETE FROM suppliers WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $currentUser['company_id']);
            $stmt->execute();
            $stmt->close();
            
            // Log activity
            logActivity($conn, $currentUser, 'DELETE', 'suppliers', $id, $oldData, null);
            
            echo json_encode(['success' => true]);
            break;
    }
}

function handleUsers($conn, $method, $id, $input) {
    $currentUser = getCurrentUser($conn);
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            // Listar apenas usuários da mesma empresa (exceto Super Admin vê todos)
            if ($currentUser['role'] === 'Super Admin') {
                $result = $conn->query("SELECT id, name, email, role, company_id, avatar FROM users ORDER BY id DESC");
            } else {
                $stmt = $conn->prepare("SELECT id, name, email, role, company_id, avatar FROM users WHERE company_id = ? ORDER BY id DESC");
                $stmt->bind_param("i", $currentUser['company_id']);
                $stmt->execute();
                $result = $stmt->get_result();
            }
            
            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = formatUser($row);
            }
            echo json_encode($users);
            
            if (isset($stmt)) $stmt->close();
            break;
            
        case 'POST':
            $avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($input['name']);
            $password = isset($input['password']) && !empty($input['password']) ? password_hash($input['password'], PASSWORD_DEFAULT) : password_hash('123456', PASSWORD_DEFAULT);
            
            // Se não for Super Admin, forçar usar a empresa do usuário logado
            $companyId = ($currentUser['role'] === 'Super Admin' && isset($input['companyId'])) ? $input['companyId'] : $currentUser['company_id'];
            
            $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, company_id, avatar) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssis", $input['name'], $input['email'], $password, $input['role'], $companyId, $avatar);
            $stmt->execute();
            $newId = $conn->insert_id;
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT id, name, email, role, company_id, avatar FROM users WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            http_response_code(201);
            echo json_encode(formatUser($user));
            $stmt->close();
            break;
            
        case 'PUT':
            // Verificar se pode editar este usuário (mesma empresa ou Super Admin)
            $stmt = $conn->prepare("SELECT company_id FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $targetUser = $result->fetch_assoc();
            $stmt->close();
            
            if (!$targetUser) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuário não encontrado']);
                return;
            }
            
            // Verificar permissão
            if ($currentUser['role'] !== 'Super Admin' && $targetUser['company_id'] !== $currentUser['company_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado']);
                return;
            }
            
            // Se não for Super Admin, não pode mudar a empresa
            $companyId = ($currentUser['role'] === 'Super Admin' && isset($input['companyId'])) ? $input['companyId'] : $targetUser['company_id'];
            
            // Check if password is being updated
            if (isset($input['password']) && !empty($input['password'])) {
                $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, password = ?, role = ?, company_id = ? WHERE id = ?");
                $stmt->bind_param("ssssii", $input['name'], $input['email'], $passwordHash, $input['role'], $companyId, $id);
            } else {
                $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, role = ?, company_id = ? WHERE id = ?");
                $stmt->bind_param("sssii", $input['name'], $input['email'], $input['role'], $companyId, $id);
            }
            $stmt->execute();
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT id, name, email, role, company_id, avatar FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            echo json_encode(formatUser($user));
            $stmt->close();
            break;
            
        case 'DELETE':
            // Verificar se pode deletar (mesma empresa ou Super Admin)
            $stmt = $conn->prepare("SELECT company_id FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $targetUser = $result->fetch_assoc();
            $stmt->close();
            
            if (!$targetUser) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuário não encontrado']);
                return;
            }
            
            if ($currentUser['role'] !== 'Super Admin' && $targetUser['company_id'] !== $currentUser['company_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado']);
                return;
            }
            
            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(['success' => true]);
            break;
    }
}

function handleCompanies($conn, $method, $id, $input) {
    switch ($method) {
        case 'GET':
            $result = $conn->query("SELECT * FROM companies ORDER BY id DESC");
            $companies = [];
            while ($row = $result->fetch_assoc()) {
                $companies[] = formatCompany($row);
            }
            echo json_encode($companies);
            break;
            
        case 'POST':
            $stmt = $conn->prepare("INSERT INTO companies (name) VALUES (?)");
            $stmt->bind_param("s", $input['name']);
            $stmt->execute();
            $newId = $conn->insert_id;
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM companies WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $result = $stmt->get_result();
            $company = $result->fetch_assoc();
            http_response_code(201);
            echo json_encode(formatCompany($company));
            $stmt->close();
            break;
            
        case 'PUT':
            $stmt = $conn->prepare("UPDATE companies SET name = ? WHERE id = ?");
            $stmt->bind_param("si", $input['name'], $id);
            $stmt->execute();
            $stmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM companies WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $company = $result->fetch_assoc();
            echo json_encode(formatCompany($company));
            $stmt->close();
            break;
            
        case 'DELETE':
            $stmt = $conn->prepare("DELETE FROM companies WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(['success' => true]);
            break;
    }
}

function handleStockMovements($conn, $method, $id, $input) {
    $currentUser = getCurrentUser($conn);
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autenticado']);
        return;
    }
    
    $companyId = $currentUser['company_id'];
    
    switch ($method) {
        case 'GET':
            // Filter stock movements by company through products table, including product and user names
            $stmt = $conn->prepare("
                SELECT 
                    sm.*,
                    p.name as product_name,
                    u.name as user_name
                FROM stock_movements sm
                INNER JOIN products p ON sm.product_id = p.id
                LEFT JOIN users u ON sm.user_id = u.id
                WHERE p.company_id = ?
                ORDER BY sm.date DESC
            ");
            $stmt->bind_param("i", $companyId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $movements = [];
            while ($row = $result->fetch_assoc()) {
                $movement = formatStockMovement($row);
                // Add product and user names to the movement
                $movement['productName'] = $row['product_name'];
                $movement['userName'] = $row['user_name'] ?? 'Sistema';
                $movements[] = $movement;
            }
            $stmt->close();
            echo json_encode($movements);
            break;
            
        case 'POST':
            // Validar dados obrigatórios
            if (!isset($input['productId']) || !isset($input['type']) || !isset($input['quantity']) || !isset($input['userId'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Campos obrigatórios faltando: productId, type, quantity, userId']);
                return;
            }
            
            // Verificar se o produto pertence à empresa do usuário
            $checkStmt = $conn->prepare("SELECT id FROM products WHERE id = ? AND company_id = ?");
            $checkStmt->bind_param("ii", $input['productId'], $companyId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows === 0) {
                http_response_code(403);
                echo json_encode(['error' => 'Produto não pertence à sua empresa']);
                $checkStmt->close();
                return;
            }
            $checkStmt->close();
            
            // Se não vier a data, usar a data/hora atual
            $date = isset($input['date']) ? $input['date'] : date('Y-m-d H:i:s');
            
            $stmt = $conn->prepare("INSERT INTO stock_movements (product_id, type, quantity, reason, date, user_id) VALUES (?, ?, ?, ?, ?, ?)");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao preparar statement: ' . $conn->error]);
                return;
            }
            
            $stmt->bind_param("isissi", 
                $input['productId'], 
                $input['type'], 
                $input['quantity'], 
                $input['reason'], 
                $date, 
                $input['userId']
            );
            
            if (!$stmt->execute()) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao inserir movimentação: ' . $stmt->error]);
                $stmt->close();
                return;
            }
            
            $newId = $conn->insert_id;
            $stmt->close();
            
            // Atualizar o estoque do produto
            // Aceita tanto valores em português ('Entrada'/'Saída') quanto em inglês ('in'/'out')
            $isIncoming = (
                $input['type'] === 'in' || 
                $input['type'] === 'Entrada' || 
                strtolower($input['type']) === 'entrada'
            );
            
            $quantityChange = $isIncoming ? $input['quantity'] : -$input['quantity'];
            
            $updateStmt = $conn->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
            if (!$updateStmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao preparar atualização de estoque: ' . $conn->error]);
                return;
            }
            
            $updateStmt->bind_param("ii", $quantityChange, $input['productId']);
            if (!$updateStmt->execute()) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao atualizar estoque do produto: ' . $updateStmt->error]);
                $updateStmt->close();
                return;
            }
            $updateStmt->close();
            
            $stmt = $conn->prepare("SELECT * FROM stock_movements WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $result = $stmt->get_result();
            $movement = $result->fetch_assoc();
            
            // Log activity
            $currentUser = getCurrentUser($conn);
            if ($currentUser) {
                logActivity($conn, $currentUser, 'INSERT', 'stock_movements', $newId, null, formatStockMovement($movement));
            }
            
            http_response_code(201);
            echo json_encode(formatStockMovement($movement));
            $stmt->close();
            break;
    }
}

function handleActivityLog($conn, $method, $id, $input) {
    $currentUser = getCurrentUser($conn);
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            // Query base
            $query = "SELECT 
                        al.id,
                        al.user_id,
                        al.company_id,
                        al.action,
                        al.entity_type,
                        al.entity_id,
                        al.old_data,
                        al.new_data,
                        al.ip_address,
                        al.user_agent,
                        al.created_at,
                        u.name as user_name,
                        u.email as user_email,
                        c.name as company_name
                      FROM activity_log al
                      LEFT JOIN users u ON al.user_id = u.id
                      LEFT JOIN companies c ON al.company_id = c.id";
            
            $conditions = [];
            
            // Filtrar por empresa (exceto Super Admin)
            if ($currentUser['role'] !== 'Super Admin') {
                $conditions[] = "al.company_id = " . (int)$currentUser['company_id'];
            }
            
            // Filtros do relatório de atividades críticas (apenas para Super Admin)
            if ($currentUser['role'] === 'Super Admin') {
                // Filtro de data inicial
                if (isset($_GET['start_date']) && !empty($_GET['start_date'])) {
                    $startDate = $conn->real_escape_string($_GET['start_date']);
                    $conditions[] = "DATE(al.created_at) >= '$startDate'";
                }
                
                // Filtro de data final
                if (isset($_GET['end_date']) && !empty($_GET['end_date'])) {
                    $endDate = $conn->real_escape_string($_GET['end_date']);
                    $conditions[] = "DATE(al.created_at) <= '$endDate'";
                }
                
                // Filtro de usuário
                if (isset($_GET['user_id']) && !empty($_GET['user_id'])) {
                    $userId = (int)$_GET['user_id'];
                    $conditions[] = "al.user_id = $userId";
                }
                
                // Filtro de empresa
                if (isset($_GET['company_id']) && !empty($_GET['company_id'])) {
                    $companyId = (int)$_GET['company_id'];
                    $conditions[] = "al.company_id = $companyId";
                }
                
                // Filtro de tipo de ação
                if (isset($_GET['action_type']) && !empty($_GET['action_type'])) {
                    $actionType = $conn->real_escape_string($_GET['action_type']);
                    $conditions[] = "al.action = '$actionType'";
                }
                
                // Filtro de tabela
                if (isset($_GET['table_name']) && !empty($_GET['table_name'])) {
                    $tableName = $conn->real_escape_string($_GET['table_name']);
                    $conditions[] = "al.entity_type = '$tableName'";
                }
            }
            
            // Adicionar condições à query
            if (count($conditions) > 0) {
                $query .= " WHERE " . implode(" AND ", $conditions);
            }
            
            $query .= " ORDER BY al.created_at DESC LIMIT 1000";
            
            $result = $conn->query($query);
            $logs = [];
            
            while ($row = $result->fetch_assoc()) {
                $logs[] = [
                    'id' => (int)$row['id'],
                    'userId' => (int)$row['user_id'],
                    'userName' => $row['user_name'] ?? 'Usuário Desconhecido',
                    'userEmail' => $row['user_email'] ?? '',
                    'companyId' => (int)$row['company_id'],
                    'companyName' => $row['company_name'] ?? 'Empresa Desconhecida',
                    'action' => $row['action'], // INSERT, UPDATE, DELETE
                    'entityType' => $row['entity_type'], // products, users, etc
                    'entityId' => (int)$row['entity_id'],
                    'oldData' => $row['old_data'] ? json_decode($row['old_data'], true) : null,
                    'newData' => $row['new_data'] ? json_decode($row['new_data'], true) : null,
                    'ipAddress' => $row['ip_address'] ?? '',
                    'userAgent' => $row['user_agent'] ?? '',
                    'createdAt' => $row['created_at']
                ];
            }
            
            echo json_encode($logs);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
    }
}

function handleDashboard($conn) {
    $currentUser = getCurrentUser($conn);
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        return;
    }
    
    $data = [];
    $companyFilter = "";
    $companyId = $currentUser['company_id'];
    
    // Super Admin vê tudo, outros apenas da sua empresa
    if ($currentUser['role'] !== 'Super Admin') {
        $companyFilter = " WHERE company_id = $companyId";
    }
    
    // Total products
    $result = $conn->query("SELECT COUNT(*) as count FROM products" . $companyFilter);
    $data['totalProducts'] = $result->fetch_assoc()['count'];
    
    // Low stock products
    $result = $conn->query("SELECT COUNT(*) as count FROM products" . $companyFilter . ($companyFilter ? " AND" : " WHERE") . " stock < min_stock");
    $data['lowStockProducts'] = $result->fetch_assoc()['count'];
    
    // Recent movements - filtrar por produtos da empresa
    if ($currentUser['role'] === 'Super Admin') {
        $result = $conn->query("SELECT COUNT(*) as count FROM stock_movements WHERE type = 'Entrada' ORDER BY date DESC LIMIT 5");
        $data['recentMovementsIn'] = $result->fetch_assoc()['count'];
        
        $result = $conn->query("SELECT COUNT(*) as count FROM stock_movements WHERE type = 'Saída' ORDER BY date DESC LIMIT 5");
        $data['recentMovementsOut'] = $result->fetch_assoc()['count'];
    } else {
        $result = $conn->query("
            SELECT COUNT(*) as count 
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE p.company_id = $companyId AND sm.type = 'Entrada'
            ORDER BY sm.date DESC LIMIT 5
        ");
        $data['recentMovementsIn'] = $result->fetch_assoc()['count'];
        
        $result = $conn->query("
            SELECT COUNT(*) as count 
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE p.company_id = $companyId AND sm.type = 'Saída'
            ORDER BY sm.date DESC LIMIT 5
        ");
        $data['recentMovementsOut'] = $result->fetch_assoc()['count'];
    }
    
    // Stock by category - apenas categorias e produtos da empresa
    if ($currentUser['role'] === 'Super Admin') {
        $result = $conn->query("
            SELECT c.name, SUM(p.stock) as estoque
            FROM products p
            JOIN categories c ON p.category_id = c.id
            GROUP BY c.id, c.name
        ");
    } else {
        $result = $conn->query("
            SELECT c.name, SUM(p.stock) as estoque
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.company_id = $companyId
            GROUP BY c.id, c.name
        ");
    }
    
    $stockByCategory = [];
    while ($row = $result->fetch_assoc()) {
        $stockByCategory[] = $row;
    }
    $data['stockByCategoryData'] = $stockByCategory;
    
    echo json_encode($data);
}

function handleProductsImport($conn, $method, $input) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        return;
    }
    
    $currentUser = getCurrentUser($conn);
    if (!$currentUser || ($currentUser['role'] !== 'Admin' && $currentUser['role'] !== 'Super Admin')) {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas administradores podem importar dados']);
        return;
    }
    
    if (!isset($input['products']) || !is_array($input['products'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos']);
        return;
    }
    
    $importIds = isset($input['options']['importIds']) ? $input['options']['importIds'] : false;
    $replaceExisting = isset($input['options']['replaceExisting']) ? $input['options']['replaceExisting'] : false;
    
    $imported = 0;
    $updated = 0;
    $errors = [];
    
    foreach ($input['products'] as $index => $product) {
        try {
            $imageUrl = 'https://picsum.photos/seed/' . time() . $index . '/400';
            
            // Se importar IDs
            if ($importIds && isset($product['id'])) {
                // Verificar se já existe
                $checkStmt = $conn->prepare("SELECT id FROM products WHERE id = ? AND company_id = ?");
                $checkStmt->bind_param("ii", $product['id'], $currentUser['company_id']);
                $checkStmt->execute();
                $exists = $checkStmt->get_result()->num_rows > 0;
                $checkStmt->close();
                
                if ($exists) {
                    if ($replaceExisting) {
                        // Atualizar registro existente
                        $stmt = $conn->prepare("UPDATE products SET name=?, sku=?, category_id=?, supplier_id=?, price=?, stock=?, min_stock=?, image_url=? WHERE id=? AND company_id=?");
                        $stmt->bind_param("ssiidiisii",
                            $product['name'],
                            $product['sku'],
                            $product['categoryId'],
                            $product['supplierId'],
                            $product['price'],
                            $product['stock'],
                            $product['minStock'],
                            $imageUrl,
                            $product['id'],
                            $currentUser['company_id']
                        );
                        
                        if ($stmt->execute()) {
                            $updated++;
                            logActivity($conn, $currentUser, 'UPDATE', 'products', $product['id'], null, $product);
                        }
                        $stmt->close();
                    } else {
                        // Ignorar registro existente
                        $errors[] = "Linha " . ($index + 1) . ": ID " . $product['id'] . " já existe (ignorado)";
                    }
                } else {
                    // Criar novo registro com ID específico
                    $stmt = $conn->prepare("INSERT INTO products (id, name, sku, category_id, supplier_id, price, stock, min_stock, image_url, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->bind_param("issiidiisi",
                        $product['id'],
                        $product['name'],
                        $product['sku'],
                        $product['categoryId'],
                        $product['supplierId'],
                        $product['price'],
                        $product['stock'],
                        $product['minStock'],
                        $imageUrl,
                        $currentUser['company_id']
                    );
                    
                    if ($stmt->execute()) {
                        $imported++;
                        logActivity($conn, $currentUser, 'INSERT', 'products', $product['id'], null, $product);
                    } else {
                        $errors[] = "Linha " . ($index + 1) . ": " . $stmt->error;
                    }
                    $stmt->close();
                }
            } else {
                // INSERT normal (sem ID)
                $stmt = $conn->prepare("INSERT INTO products (name, sku, category_id, supplier_id, price, stock, min_stock, image_url, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssiidiisi",
                    $product['name'],
                    $product['sku'],
                    $product['categoryId'],
                    $product['supplierId'],
                    $product['price'],
                    $product['stock'],
                    $product['minStock'],
                    $imageUrl,
                    $currentUser['company_id']
                );
                
                if ($stmt->execute()) {
                    $imported++;
                    $newId = $conn->insert_id;
                    
                    // Log activity
                    $newData = [
                        'id' => $newId,
                        'name' => $product['name'],
                        'sku' => $product['sku'],
                        'categoryId' => $product['categoryId'],
                        'supplierId' => $product['supplierId'],
                        'price' => $product['price'],
                        'stock' => $product['stock'],
                        'minStock' => $product['minStock']
                    ];
                    logActivity($conn, $currentUser, 'INSERT', 'products', $newId, null, $newData);
                } else {
                    $errors[] = "Linha " . ($index + 1) . ": " . $stmt->error;
                }
                $stmt->close();
            }
        } catch (Exception $e) {
            $errors[] = "Linha " . ($index + 1) . ": " . $e->getMessage();
        }
    }
    
    echo json_encode([
        'success' => true,
        'imported' => $imported,
        'updated' => $updated,
        'total' => count($input['products']),
        'errors' => $errors
    ]);
}

function handleCategoriesImport($conn, $method, $input) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        return;
    }
    
    $currentUser = getCurrentUser($conn);
    if (!$currentUser || ($currentUser['role'] !== 'Admin' && $currentUser['role'] !== 'Super Admin')) {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas administradores podem importar dados']);
        return;
    }
    
    if (!isset($input['categories']) || !is_array($input['categories'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos']);
        return;
    }
    
    $importIds = isset($input['options']['importIds']) ? $input['options']['importIds'] : false;
    $replaceExisting = isset($input['options']['replaceExisting']) ? $input['options']['replaceExisting'] : false;
    
    $imported = 0;
    $updated = 0;
    $errors = [];
    
    foreach ($input['categories'] as $index => $category) {
        try {
            $description = $category['description'] ?? '';
            
            if ($importIds && isset($category['id'])) {
                $checkStmt = $conn->prepare("SELECT id FROM categories WHERE id = ? AND company_id = ?");
                $checkStmt->bind_param("ii", $category['id'], $currentUser['company_id']);
                $checkStmt->execute();
                $exists = $checkStmt->get_result()->num_rows > 0;
                $checkStmt->close();
                
                if ($exists) {
                    if ($replaceExisting) {
                        // Atualizar registro existente
                        $stmt = $conn->prepare("UPDATE categories SET name=?, description=? WHERE id=? AND company_id=?");
                        $stmt->bind_param("ssii", $category['name'], $description, $category['id'], $currentUser['company_id']);
                        if ($stmt->execute()) {
                            $updated++;
                            logActivity($conn, $currentUser, 'UPDATE', 'categories', $category['id'], null, $category);
                        }
                        $stmt->close();
                    } else {
                        // Ignorar registro existente
                        $errors[] = "Linha " . ($index + 1) . ": ID " . $category['id'] . " já existe (ignorado)";
                    }
                } else {
                    // Criar novo registro com ID específico
                    $stmt = $conn->prepare("INSERT INTO categories (id, name, description, company_id) VALUES (?, ?, ?, ?)");
                    $stmt->bind_param("issi", $category['id'], $category['name'], $description, $currentUser['company_id']);
                    if ($stmt->execute()) {
                        $imported++;
                        logActivity($conn, $currentUser, 'INSERT', 'categories', $category['id'], null, $category);
                    } else {
                        $errors[] = "Linha " . ($index + 1) . ": " . $stmt->error;
                    }
                    $stmt->close();
                }
            } else {
                $stmt = $conn->prepare("INSERT INTO categories (name, description, company_id) VALUES (?, ?, ?)");
                $stmt->bind_param("ssi", $category['name'], $description, $currentUser['company_id']);
                
                if ($stmt->execute()) {
                    $imported++;
                    $newId = $conn->insert_id;
                    
                    // Log activity
                    logActivity($conn, $currentUser, 'INSERT', 'categories', $newId, null, [
                        'id' => $newId,
                        'name' => $category['name'],
                        'description' => $description
                    ]);
                } else {
                    $errors[] = "Linha " . ($index + 1) . ": " . $stmt->error;
                }
                $stmt->close();
            }
        } catch (Exception $e) {
            $errors[] = "Linha " . ($index + 1) . ": " . $e->getMessage();
        }
    }
    
    echo json_encode([
        'success' => true,
        'imported' => $imported,
        'updated' => $updated,
        'total' => count($input['categories']),
        'errors' => $errors
    ]);
}

function handleSuppliersImport($conn, $method, $input) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        return;
    }
    
    $currentUser = getCurrentUser($conn);
    if (!$currentUser || ($currentUser['role'] !== 'Admin' && $currentUser['role'] !== 'Super Admin')) {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas administradores podem importar dados']);
        return;
    }
    
    if (!isset($input['suppliers']) || !is_array($input['suppliers'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos']);
        return;
    }
    
    $importIds = isset($input['options']['importIds']) ? $input['options']['importIds'] : false;
    $replaceExisting = isset($input['options']['replaceExisting']) ? $input['options']['replaceExisting'] : false;
    
    $imported = 0;
    $updated = 0;
    $errors = [];
    
    foreach ($input['suppliers'] as $index => $supplier) {
        try {
            $contactPerson = $supplier['contactPerson'] ?? '';
            $email = $supplier['email'] ?? '';
            $phone = $supplier['phone'] ?? '';
            
            if ($importIds && isset($supplier['id'])) {
                $checkStmt = $conn->prepare("SELECT id FROM suppliers WHERE id = ? AND company_id = ?");
                $checkStmt->bind_param("ii", $supplier['id'], $currentUser['company_id']);
                $checkStmt->execute();
                $exists = $checkStmt->get_result()->num_rows > 0;
                $checkStmt->close();
                
                if ($exists) {
                    if ($replaceExisting) {
                        // Atualizar registro existente
                        $stmt = $conn->prepare("UPDATE suppliers SET name=?, contact_person=?, email=?, phone=? WHERE id=? AND company_id=?");
                        $stmt->bind_param("ssssii", $supplier['name'], $contactPerson, $email, $phone, $supplier['id'], $currentUser['company_id']);
                        if ($stmt->execute()) {
                            $updated++;
                            logActivity($conn, $currentUser, 'UPDATE', 'suppliers', $supplier['id'], null, $supplier);
                        }
                        $stmt->close();
                    } else {
                        // Ignorar registro existente
                        $errors[] = "Linha " . ($index + 1) . ": ID " . $supplier['id'] . " já existe (ignorado)";
                    }
                } else {
                    // Criar novo registro com ID específico
                    $stmt = $conn->prepare("INSERT INTO suppliers (id, name, contact_person, email, phone, company_id) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->bind_param("issssi", $supplier['id'], $supplier['name'], $contactPerson, $email, $phone, $currentUser['company_id']);
                    if ($stmt->execute()) {
                        $imported++;
                        logActivity($conn, $currentUser, 'INSERT', 'suppliers', $supplier['id'], null, $supplier);
                    } else {
                        $errors[] = "Linha " . ($index + 1) . ": " . $stmt->error;
                    }
                    $stmt->close();
                }
            } else {
                $stmt = $conn->prepare("INSERT INTO suppliers (name, contact_person, email, phone, company_id) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssi", $supplier['name'], $contactPerson, $email, $phone, $currentUser['company_id']);
                
                if ($stmt->execute()) {
                    $imported++;
                    $newId = $conn->insert_id;
                    
                    // Log activity
                    logActivity($conn, $currentUser, 'INSERT', 'suppliers', $newId, null, [
                        'id' => $newId,
                        'name' => $supplier['name'],
                        'contactPerson' => $contactPerson,
                        'email' => $email,
                        'phone' => $phone
                    ]);
                } else {
                    $errors[] = "Linha " . ($index + 1) . ": " . $stmt->error;
                }
                $stmt->close();
            }
        } catch (Exception $e) {
            $errors[] = "Linha " . ($index + 1) . ": " . $e->getMessage();
        }
    }
    
    echo json_encode([
        'success' => true,
        'imported' => $imported,
        'updated' => $updated,
        'total' => count($input['suppliers']),
        'errors' => $errors
    ]);
}

// ============== SETTINGS HANDLER ==============

function handleSettings($conn, $method, $input) {
    $currentUser = getCurrentUser($conn);
    
    // All authenticated users can READ settings, only Super Admin can WRITE
    if (!$currentUser) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado. Usuário não autenticado.']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            // Get all settings (accessible to all authenticated users)
            $result = $conn->query("SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key");
            $settings = [];
            
            while ($row = $result->fetch_assoc()) {
                $settings[$row['setting_key']] = [
                    'value' => $row['setting_value'],
                    'description' => $row['description']
                ];
            }
            
            echo json_encode($settings);
            break;
            
        case 'PUT':
            // Update settings (only Super Admin can edit)
            if ($currentUser['role'] !== 'Super Admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado. Apenas Super Admin pode editar configurações.']);
                return;
            }
            
            if (!$input || !is_array($input)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                return;
            }
            
            $updated = 0;
            $errors = [];
            
            foreach ($input as $key => $value) {
                // Validate setting key exists
                $stmt = $conn->prepare("SELECT id FROM system_settings WHERE setting_key = ?");
                $stmt->bind_param("s", $key);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    // Update setting
                    $stmt = $conn->prepare("UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?");
                    $stmt->bind_param("sis", $value, $currentUser['id'], $key);
                    
                    if ($stmt->execute()) {
                        $updated++;
                        
                        // Log activity
                        logActivity($conn, $currentUser, 'UPDATE', 'settings', 0, null, [
                            'setting_key' => $key,
                            'new_value' => $value
                        ]);
                    } else {
                        $errors[] = "Erro ao atualizar $key: " . $stmt->error;
                    }
                } else {
                    $errors[] = "Configuração não encontrada: $key";
                }
                $stmt->close();
            }
            
            echo json_encode([
                'success' => true,
                'updated' => $updated,
                'errors' => $errors
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
    }
}

// Bulk Operations Handler
function handleBulkOperations($conn, $method, $input) {
    // Debug log
    error_log("handleBulkOperations called - Method: $method");
    error_log("Input: " . json_encode($input));
    
    // Check authentication
    $currentUser = getCurrentUser($conn);
    error_log("Current user: " . json_encode($currentUser));
    
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autenticado']);
        return;
    }

    // Only POST allowed for bulk operations
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        return;
    }

    // Check if user is Admin or Super Admin (case-insensitive and trimmed)
    $userRole = trim($currentUser['role']);
    $isAdmin = (strcasecmp($userRole, 'Admin') === 0 || strcasecmp($userRole, 'Super Admin') === 0);
    
    if (!$isAdmin) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado. Apenas administradores podem executar operações em massa.']);
        return;
    }

    $action = $input['action'] ?? '';
    $categoryIds = $input['categoryIds'] ?? [];
    $companyId = $currentUser['company_id'];
    
    error_log("Action: $action");
    error_log("Category IDs: " . json_encode($categoryIds));
    error_log("Company ID: $companyId");

    // Validate categoryIds only for actions that use them (not for 'change-category')
    if ($action !== 'change-category' && (empty($categoryIds) || !is_array($categoryIds))) {
        http_response_code(400);
        echo json_encode(['error' => 'É necessário selecionar pelo menos uma categoria']);
        return;
    }

    // Create placeholders for IN clause
    $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
    
    try {
        switch ($action) {
            case 'zero-stock':
                // Update stock to 0 for all products in selected categories
                $sql = "UPDATE products 
                        SET stock = 0 
                        WHERE company_id = ? 
                        AND category_id IN ($placeholders)";
                
                $stmt = $conn->prepare($sql);
                $types = 'i' . str_repeat('i', count($categoryIds));
                $params = array_merge([$companyId], $categoryIds);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $affected = $stmt->affected_rows;
                $stmt->close();

                // Log activity
                logActivity($conn, $currentUser, 'UPDATE', 'products', 0, null, [
                    'action' => 'bulk_zero_stock',
                    'category_ids' => $categoryIds,
                    'affected_rows' => $affected
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Estoque zerado com sucesso',
                    'affected' => $affected
                ]);
                break;

            case 'clear-movements':
                // Delete all stock movements for products in selected categories
                $sql = "DELETE sm FROM stock_movements sm
                        INNER JOIN products p ON sm.product_id = p.id
                        WHERE p.company_id = ? 
                        AND p.category_id IN ($placeholders)";
                
                $stmt = $conn->prepare($sql);
                $types = 'i' . str_repeat('i', count($categoryIds));
                $params = array_merge([$companyId], $categoryIds);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $affected = $stmt->affected_rows;
                $stmt->close();

                // Log activity
                logActivity($conn, $currentUser, 'DELETE', 'stock_movements', 0, null, [
                    'action' => 'bulk_clear_movements',
                    'category_ids' => $categoryIds,
                    'affected_rows' => $affected
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Movimentações apagadas com sucesso',
                    'affected' => $affected
                ]);
                break;

            case 'delete-products':
                // First delete all stock movements for these products
                $sql1 = "DELETE sm FROM stock_movements sm
                         INNER JOIN products p ON sm.product_id = p.id
                         WHERE p.company_id = ? 
                         AND p.category_id IN ($placeholders)";
                
                $stmt1 = $conn->prepare($sql1);
                $types = 'i' . str_repeat('i', count($categoryIds));
                $params = array_merge([$companyId], $categoryIds);
                $stmt1->bind_param($types, ...$params);
                $stmt1->execute();
                $movementsDeleted = $stmt1->affected_rows;
                $stmt1->close();

                // Then delete the products
                $sql2 = "DELETE FROM products 
                         WHERE company_id = ? 
                         AND category_id IN ($placeholders)";
                
                $stmt2 = $conn->prepare($sql2);
                $stmt2->bind_param($types, ...$params);
                $stmt2->execute();
                $affected = $stmt2->affected_rows;
                $stmt2->close();

                // Log activity
                logActivity($conn, $currentUser, 'DELETE', 'products', 0, null, [
                    'action' => 'bulk_delete_products',
                    'category_ids' => $categoryIds,
                    'products_deleted' => $affected,
                    'movements_deleted' => $movementsDeleted
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Produtos apagados com sucesso',
                    'affected' => $affected,
                    'movements_deleted' => $movementsDeleted
                ]);
                break;

            case 'update-images':
                // Log para debug
                error_log("=== UPDATE IMAGES DEBUG ===");
                error_log("Company ID: " . $companyId);
                error_log("Category IDs: " . json_encode($categoryIds));
                error_log("Placeholders: " . $placeholders);
                
                // Get all products in selected categories
                $sql = "SELECT id, name, image_url FROM products 
                        WHERE company_id = ? 
                        AND category_id IN ($placeholders)";
                
                error_log("SQL Query: " . $sql);
                
                $stmt = $conn->prepare($sql);
                $types = 'i' . str_repeat('i', count($categoryIds));
                $params = array_merge([$companyId], $categoryIds);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $updated = 0;
                $skipped = 0;
                $products = [];
                
                while ($row = $result->fetch_assoc()) {
                    $products[] = $row;
                }
                $stmt->close();
                
                error_log("Total products found: " . count($products));
                
                error_log("Total products found: " . count($products));
                
                // Update images for each product
                foreach ($products as $product) {
                    error_log("Processing product: " . $product['name'] . " (ID: " . $product['id'] . ")");
                    error_log("Current image URL: " . ($product['image_url'] ?? 'NULL'));
                    
                    $imageUrl = searchProductImage($product['name'], $conn, $companyId);
                    
                    error_log("Found image URL: " . ($imageUrl ?? 'NULL'));
                    
                    if ($imageUrl) {
                        $updateStmt = $conn->prepare("UPDATE products SET image_url = ? WHERE id = ?");
                        $updateStmt->bind_param("si", $imageUrl, $product['id']);
                        
                        if ($updateStmt->execute()) {
                            $updated++;
                            error_log("✓ Updated product #" . $product['id']);
                        } else {
                            error_log("✗ Failed to update product #" . $product['id'] . ": " . $updateStmt->error);
                        }
                        $updateStmt->close();
                    } else {
                        $skipped++;
                        error_log("✗ Skipped product #" . $product['id'] . " - no image found");
                    }
                }
                
                error_log("=== RESULTS: Updated=$updated, Skipped=$skipped ===");

                // Log activity
                logActivity($conn, $currentUser, 'UPDATE', 'products', 0, null, [
                    'action' => 'bulk_update_images',
                    'category_ids' => $categoryIds,
                    'updated' => $updated,
                    'skipped' => $skipped
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Imagens atualizadas com sucesso',
                    'updated' => $updated,
                    'skipped' => $skipped
                ]);
                break;

            case 'change-category':
                // Change category for selected products
                $productIds = $input['productIds'] ?? [];
                $targetCategoryId = $input['targetCategoryId'] ?? null;
                
                error_log("Product IDs: " . json_encode($productIds));
                error_log("Target Category ID: " . $targetCategoryId);
                
                if (empty($productIds) || !is_array($productIds)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'É necessário selecionar pelo menos um produto']);
                    return;
                }
                
                if (!$targetCategoryId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'É necessário selecionar a categoria de destino']);
                    return;
                }
                
                // Verify that target category exists and belongs to current company
                $checkCategoryStmt = $conn->prepare("SELECT id FROM categories WHERE id = ? AND company_id = ?");
                $checkCategoryStmt->bind_param("ii", $targetCategoryId, $companyId);
                $checkCategoryStmt->execute();
                $categoryResult = $checkCategoryStmt->get_result();
                
                if ($categoryResult->num_rows === 0) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Categoria de destino inválida']);
                    return;
                }
                $checkCategoryStmt->close();
                
                // Update category_id for selected products (only products belonging to current company)
                $productPlaceholders = implode(',', array_fill(0, count($productIds), '?'));
                $sql = "UPDATE products 
                        SET category_id = ? 
                        WHERE company_id = ? 
                        AND id IN ($productPlaceholders)";
                
                $stmt = $conn->prepare($sql);
                $types = 'ii' . str_repeat('i', count($productIds));
                $params = array_merge([$targetCategoryId, $companyId], $productIds);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $affected = $stmt->affected_rows;
                $stmt->close();

                // Log activity
                logActivity($conn, $currentUser, 'UPDATE', 'products', 0, null, [
                    'action' => 'bulk_change_category',
                    'product_ids' => $productIds,
                    'target_category_id' => $targetCategoryId,
                    'affected_rows' => $affected
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Categoria alterada com sucesso',
                    'affected' => $affected
                ]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['error' => 'Ação inválida']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao executar operação: ' . $e->getMessage()]);
    }
}

// ============== IMAGE SEARCH FUNCTION ==============

function searchProductImage($productName, $conn = null, $companyId = null) {
    error_log("=== SEARCH IMAGE FOR: " . $productName . " ===");
    
    // Passo 1: Limpeza básica do nome
    $cleanName = $productName;
    $cleanName = preg_replace('/REF\./i', '', $cleanName);
    $cleanName = preg_replace('/\d+(ML|L|G|KG|MG|UN|CX|PCT|PACOTE|UNIDADE)/i', '', $cleanName);
    $cleanName = preg_replace('/(PACOTE|UNIDADE|UN\.|CX\.|PCT\.|LATA|GARRAFA|FRASCO)/i', '', $cleanName);
    $cleanName = preg_replace('/\d+X\d+/i', '', $cleanName); // Remove "12X350"
    $cleanName = trim($cleanName);
    
    // Passo 2: Extrair apenas as primeiras 1-3 palavras significativas
    $words = explode(' ', $cleanName);
    $keywords = [];
    
    foreach ($words as $word) {
        $word = trim($word);
        // Ignorar palavras muito curtas ou números
        if (strlen($word) > 2 && !is_numeric($word)) {
            $keywords[] = $word;
        }
        // Pegar no máximo 3 palavras-chave
        if (count($keywords) >= 3) break;
    }
    
    // Se não achou palavras, usar nome limpo original
    if (empty($keywords)) {
        $keywords = [$cleanName];
    }
    
    $searchTerm = implode(' ', $keywords);
    
    error_log("Cleaned name: " . $cleanName);
    error_log("Search keywords: " . $searchTerm);
    
    // Get Pixabay API key from company settings
    $apiKey = '46737899-b38ce8e1a26a3f4110dae3156'; // Default key
    
    if ($conn && $companyId) {
        $stmt = $conn->prepare("SELECT setting_value FROM company_settings WHERE company_id = ? AND setting_key = 'pixabay_api_key'");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            if (!empty($row['setting_value'])) {
                $apiKey = $row['setting_value'];
                error_log("Using custom API key from company settings");
            }
        }
        $stmt->close();
    }
    
    error_log("API Key: " . substr($apiKey, 0, 10) . "...");
    
    // Passo 3: Buscar com filtros mais rigorosos
    $url = 'https://pixabay.com/api/?key=' . $apiKey . 
           '&q=' . urlencode($searchTerm) . 
           '&image_type=photo' .
           '&per_page=10' .  // Buscar mais opções
           '&safesearch=true' .
           '&order=popular' .  // Imagens mais populares primeiro
           '&orientation=all' .
           '&category=food,nature,health,industry'; // Categorias relevantes para produtos
    
    error_log("Pixabay URL: " . $url);
    
    try {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        error_log("HTTP Code: " . $httpCode);
        
        curl_close($ch);
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            
            if (isset($data['hits']) && count($data['hits']) > 0) {
                // Passo 4: Validar relevância da imagem
                $bestImage = null;
                $bestScore = 0;
                
                foreach ($data['hits'] as $hit) {
                    $score = 0;
                    
                    // Dar pontos se as tags contêm as palavras-chave
                    $tags = strtolower($hit['tags'] ?? '');
                    foreach ($keywords as $keyword) {
                        if (stripos($tags, strtolower($keyword)) !== false) {
                            $score += 10;
                        }
                    }
                    
                    // Preferir imagens com mais curtidas (qualidade)
                    $score += min($hit['likes'] ?? 0, 100) / 10;
                    
                    // Preferir imagens com boa resolução
                    if (($hit['imageWidth'] ?? 0) > 800 && ($hit['imageHeight'] ?? 0) > 600) {
                        $score += 5;
                    }
                    
                    error_log("Image score for '" . ($hit['tags'] ?? 'no tags') . "': " . $score);
                    
                    if ($score > $bestScore) {
                        $bestScore = $score;
                        $bestImage = $hit;
                    }
                }
                
                // Só aceitar se o score for razoável (pelo menos 5 pontos)
                if ($bestScore >= 5 && $bestImage) {
                    $imageUrl = $bestImage['webformatURL'];
                    error_log("✓ Found image: " . $imageUrl . " (score: " . $bestScore . ")");
                    return $imageUrl;
                } else {
                    error_log("✗ No relevant images found (best score: " . $bestScore . ")");
                }
            } else {
                error_log("✗ No hits found in API response");
            }
        } else {
            error_log("✗ HTTP error or empty response");
        }
    } catch (Exception $e) {
        error_log('✗ Error searching image: ' . $e->getMessage());
    }
    
    error_log("=== NO IMAGE FOUND ===");
    return null;
}

// ============== COMPANY SETTINGS HANDLER ==============

function handleCompanySettings($conn, $method, $input) {
    $currentUser = getCurrentUser($conn);
    
    // Only authenticated users
    if (!$currentUser) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado. Usuário não autenticado.']);
        return;
    }
    
    $companyId = $currentUser['company_id'];
    
    switch ($method) {
        case 'GET':
            // Get all settings for the user's company (accessible to all authenticated users of the company)
            $stmt = $conn->prepare("SELECT setting_key, setting_value, description FROM company_settings WHERE company_id = ? ORDER BY setting_key");
            $stmt->bind_param("i", $companyId);
            $stmt->execute();
            $result = $stmt->get_result();
            $settings = [];
            
            while ($row = $result->fetch_assoc()) {
                $settings[$row['setting_key']] = [
                    'value' => $row['setting_value'],
                    'description' => $row['description']
                ];
            }
            
            echo json_encode($settings);
            break;
            
        case 'PUT':
            // Update settings (only Admin and Super Admin can edit)
            if ($currentUser['role'] !== 'Admin' && $currentUser['role'] !== 'Super Admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso negado. Apenas Admin pode editar configurações da empresa.']);
                return;
            }
            
            if (!$input || !is_array($input)) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                return;
            }
            
            $updated = 0;
            $errors = [];
            
            foreach ($input as $key => $value) {
                // Check if setting exists for this company
                $stmt = $conn->prepare("SELECT id FROM company_settings WHERE company_id = ? AND setting_key = ?");
                $stmt->bind_param("is", $companyId, $key);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    // Update setting
                    $stmt = $conn->prepare("UPDATE company_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE company_id = ? AND setting_key = ?");
                    $stmt->bind_param("siis", $value, $currentUser['id'], $companyId, $key);
                    
                    if ($stmt->execute()) {
                        $updated++;
                        
                        // Log activity
                        logActivity($conn, $currentUser, 'UPDATE', 'company_settings', 0, null, [
                            'setting_key' => $key,
                            'new_value' => $value
                        ]);
                    } else {
                        $errors[] = "Erro ao atualizar $key: " . $stmt->error;
                    }
                } else {
                    // Insert new setting for this company
                    $stmt = $conn->prepare("INSERT INTO company_settings (company_id, setting_key, setting_value, updated_by) VALUES (?, ?, ?, ?)");
                    $stmt->bind_param("issi", $companyId, $key, $value, $currentUser['id']);
                    
                    if ($stmt->execute()) {
                        $updated++;
                        
                        // Log activity
                        logActivity($conn, $currentUser, 'CREATE', 'company_settings', 0, null, [
                            'setting_key' => $key,
                            'value' => $value
                        ]);
                    } else {
                        $errors[] = "Erro ao criar $key: " . $stmt->error;
                    }
                }
                $stmt->close();
            }
            
            echo json_encode([
                'success' => true,
                'updated' => $updated,
                'errors' => $errors
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
    }
}
