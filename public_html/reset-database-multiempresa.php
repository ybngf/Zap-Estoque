<?php
/**
 * Reset completo do banco de dados COM MULTI-EMPRESA
 * ATENÇÃO: Este script deleta TUDO e recria do zero!
 */

header('Content-Type: text/plain; charset=UTF-8');

require_once 'config.php';

echo "=== RESET BANCO DE DADOS - SISTEMA MULTI-EMPRESA ===\n\n";

// Conectar sem selecionar database
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

if ($conn->connect_error) {
    die("❌ Erro de conexão: " . $conn->connect_error . "\n");
}

// Deletar e recriar banco
$conn->query("DROP DATABASE IF EXISTS " . DB_NAME);
echo "✅ Banco deletado (se existia)\n";

$conn->query("CREATE DATABASE " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
echo "✅ Banco criado: " . DB_NAME . "\n\n";

$conn->select_db(DB_NAME);

// Criar tabelas
echo "Criando tabelas...\n";

// 1. companies
$conn->query("
CREATE TABLE companies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    address TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
echo "  ✅ companies\n";

// 2. users
$conn->query("
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Super Admin', 'Admin', 'Manager', 'Employee') NOT NULL,
    company_id INT UNSIGNED NOT NULL,
    avatar VARCHAR(500),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
echo "  ✅ users\n";

// 3. categories
$conn->query("
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
echo "  ✅ categories\n";

// 4. suppliers
$conn->query("
CREATE TABLE suppliers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    company_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
echo "  ✅ suppliers\n";

// 5. products
$conn->query("
CREATE TABLE products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category_id INT UNSIGNED NOT NULL,
    supplier_id INT UNSIGNED NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    image_url VARCHAR(500),
    company_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
echo "  ✅ products\n";

// 6. stock_movements
$conn->query("
CREATE TABLE stock_movements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    type ENUM('Entrada', 'Saída', 'Ajuste') NOT NULL,
    quantity INT NOT NULL,
    reason TEXT,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
echo "  ✅ stock_movements\n\n";

// ===== POPULAR DADOS =====

echo "Inserindo dados...\n\n";

// 1. EMPRESAS (3 empresas diferentes)
$companies = [
    ['Loja Central', '12.345.678/0001-90', 'Av. Principal, 1000 - Centro'],
    ['Filial Shopping', '12.345.678/0002-71', 'Shopping Mall - Loja 205'],
    ['Depósito Atacado', '98.765.432/0001-10', 'Rod. BR-101, KM 50 - Galpão 3']
];

$stmt = $conn->prepare("INSERT INTO companies (name, cnpj, address) VALUES (?, ?, ?)");
foreach ($companies as $company) {
    $stmt->bind_param("sss", $company[0], $company[1], $company[2]);
    $stmt->execute();
}
$stmt->close();
echo "✅ 3 empresas criadas\n\n";

// 2. USUÁRIOS (distribuídos entre as empresas)
$users = [
    // Super Admin - vê tudo
    ['Super Admin', 'superadmin@sistema.com', 'admin123', 'Super Admin', 1],
    
    // Empresa 1 - Loja Central
    ['João Silva', 'joao@lojacentral.com', 'joao123', 'Admin', 1],
    ['Maria Santos', 'maria@lojacentral.com', 'maria123', 'Manager', 1],
    ['Pedro Costa', 'pedro@lojacentral.com', 'pedro123', 'Employee', 1],
    
    // Empresa 2 - Filial Shopping
    ['Ana Oliveira', 'ana@filial.com', 'ana123', 'Admin', 2],
    ['Carlos Souza', 'carlos@filial.com', 'carlos123', 'Manager', 2],
    ['Julia Lima', 'julia@filial.com', 'julia123', 'Employee', 2],
    
    // Empresa 3 - Depósito Atacado
    ['Roberto Alves', 'roberto@deposito.com', 'roberto123', 'Admin', 3],
    ['Fernanda Rocha', 'fernanda@deposito.com', 'fernanda123', 'Employee', 3]
];

$stmt = $conn->prepare("INSERT INTO users (name, email, password, role, company_id, avatar) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($users as $user) {
    $password_hash = password_hash($user[2], PASSWORD_DEFAULT);
    $avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($user[0]);
    $stmt->bind_param("ssssis", $user[0], $user[1], $password_hash, $user[3], $user[4], $avatar);
    $stmt->execute();
}
$stmt->close();
echo "✅ " . count($users) . " usuários criados\n\n";

// 3. CATEGORIAS (cada empresa tem suas categorias)
$categories = [
    // Empresa 1
    ['Eletrônicos', 'Produtos eletrônicos e acessórios', 1],
    ['Informática', 'Computadores e periféricos', 1],
    ['Celulares', 'Smartphones e acessórios', 1],
    
    // Empresa 2
    ['Moda Feminina', 'Roupas e acessórios femininos', 2],
    ['Moda Masculina', 'Roupas e acessórios masculinos', 2],
    ['Calçados', 'Tênis, sapatos e sandálias', 2],
    
    // Empresa 3
    ['Alimentos', 'Produtos alimentícios não perecíveis', 3],
    ['Bebidas', 'Refrigerantes, sucos e águas', 3],
    ['Limpeza', 'Produtos de limpeza em geral', 3]
];

$stmt = $conn->prepare("INSERT INTO categories (name, description, company_id) VALUES (?, ?, ?)");
foreach ($categories as $cat) {
    $stmt->bind_param("ssi", $cat[0], $cat[1], $cat[2]);
    $stmt->execute();
}
$stmt->close();
echo "✅ " . count($categories) . " categorias criadas\n\n";

// 4. FORNECEDORES (cada empresa tem seus fornecedores)
$suppliers = [
    // Empresa 1
    ['Tech Distribuidor', 'Carlos Tech', 'contato@techdist.com', '(11) 3333-1111', 1],
    ['Info Atacado', 'Ana Info', 'vendas@infoatacado.com', '(11) 3333-2222', 1],
    
    // Empresa 2
    ['Moda Brasil', 'Julia Moda', 'comercial@modabrasil.com', '(21) 4444-1111', 2],
    ['Fashion Import', 'Pedro Fashion', 'import@fashion.com', '(21) 4444-2222', 2],
    
    // Empresa 3
    ['Alimentos SA', 'Roberto Alimentos', 'vendas@alimentossa.com', '(85) 5555-1111', 3],
    ['Bebidas Ltda', 'Fernanda Bebidas', 'comercial@bebidas.com', '(85) 5555-2222', 3]
];

$stmt = $conn->prepare("INSERT INTO suppliers (name, contact_person, email, phone, company_id) VALUES (?, ?, ?, ?, ?)");
foreach ($suppliers as $sup) {
    $stmt->bind_param("ssssi", $sup[0], $sup[1], $sup[2], $sup[3], $sup[4]);
    $stmt->execute();
}
$stmt->close();
echo "✅ " . count($suppliers) . " fornecedores criados\n\n";

// 5. PRODUTOS (cada empresa tem seus produtos)
$products = [
    // Empresa 1 - Eletrônicos
    ['Notebook Dell', 'DELL-001', 1, 1, 3500.00, 15, 5, 1],
    ['Mouse Logitech', 'LOG-M100', 1, 1, 45.00, 50, 10, 1],
    ['Teclado Mecânico', 'TECH-KB01', 2, 2, 250.00, 25, 5, 1],
    ['Monitor LG 24"', 'LG-MON24', 2, 2, 899.00, 12, 3, 1],
    ['iPhone 15', 'APPLE-IP15', 3, 1, 6999.00, 8, 2, 1],
    
    // Empresa 2 - Moda
    ['Camiseta Polo', 'POLO-001', 4, 3, 89.90, 100, 20, 2],
    ['Calça Jeans', 'JEANS-002', 4, 3, 159.90, 75, 15, 2],
    ['Vestido Floral', 'VEST-003', 5, 4, 199.90, 45, 10, 2],
    ['Tênis Nike Air', 'NIKE-AIR01', 6, 4, 599.90, 30, 8, 2],
    ['Bolsa Couro', 'BOLSA-001', 4, 3, 299.90, 20, 5, 2],
    
    // Empresa 3 - Atacado
    ['Arroz 5kg', 'ARROZ-5KG', 7, 5, 18.90, 500, 100, 3],
    ['Feijão 1kg', 'FEIJAO-1KG', 7, 5, 7.50, 300, 50, 3],
    ['Coca-Cola 2L', 'COCA-2L', 8, 6, 8.90, 200, 50, 3],
    ['Água Mineral', 'AGUA-500ML', 8, 6, 1.50, 1000, 200, 3],
    ['Detergente', 'DET-500ML', 9, 5, 2.90, 400, 80, 3]
];

$stmt = $conn->prepare("INSERT INTO products (name, sku, category_id, supplier_id, price, stock, min_stock, company_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($products as $prod) {
    $imageUrl = 'https://picsum.photos/seed/' . $prod[1] . '/400';
    $stmt->bind_param("ssiidiis", 
        $prod[0], $prod[1], $prod[2], $prod[3], $prod[4], $prod[5], $prod[6], $prod[7], $imageUrl
    );
    $stmt->execute();
}
$stmt->close();
echo "✅ " . count($products) . " produtos criados\n\n";

// 6. MOVIMENTAÇÕES (histórico de cada empresa)
$movements = [
    // Empresa 1
    [1, 2, 'Entrada', 10, 'Compra inicial'],
    [2, 2, 'Entrada', 50, 'Reposição estoque'],
    [3, 3, 'Saída', 5, 'Venda'],
    
    // Empresa 2
    [6, 5, 'Entrada', 100, 'Nova coleção'],
    [7, 6, 'Saída', 15, 'Vendas do dia'],
    [8, 6, 'Ajuste', -3, 'Perda por dano'],
    
    // Empresa 3
    [11, 8, 'Entrada', 500, 'Carga do fornecedor'],
    [12, 9, 'Entrada', 300, 'Reposição'],
    [14, 9, 'Saída', 100, 'Venda atacado']
];

$stmt = $conn->prepare("INSERT INTO stock_movements (product_id, user_id, type, quantity, reason) VALUES (?, ?, ?, ?, ?)");
foreach ($movements as $mov) {
    $stmt->bind_param("iisis", $mov[0], $mov[1], $mov[2], $mov[3], $mov[4]);
    $stmt->execute();
}
$stmt->close();
echo "✅ " . count($movements) . " movimentações criadas\n\n";

// ===== RESUMO FINAL =====
echo "\n=== RESUMO FINAL ===\n";
foreach (['companies', 'users', 'categories', 'suppliers', 'products', 'stock_movements'] as $table) {
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    $count = $result->fetch_assoc()['count'];
    echo "$table: $count registros\n";
}

echo "\n=== CREDENCIAIS DE ACESSO ===\n\n";

echo "🔑 SUPER ADMIN (vê TODAS as empresas):\n";
echo "   Email: superadmin@sistema.com\n";
echo "   Senha: admin123\n\n";

echo "🏢 EMPRESA 1 - Loja Central:\n";
echo "   Admin:    joao@lojacentral.com / joao123\n";
echo "   Manager:  maria@lojacentral.com / maria123\n";
echo "   Employee: pedro@lojacentral.com / pedro123\n";
echo "   -> 5 produtos (Eletrônicos/Informática)\n\n";

echo "🏢 EMPRESA 2 - Filial Shopping:\n";
echo "   Admin:    ana@filial.com / ana123\n";
echo "   Manager:  carlos@filial.com / carlos123\n";
echo "   Employee: julia@filial.com / julia123\n";
echo "   -> 5 produtos (Moda/Calçados)\n\n";

echo "🏢 EMPRESA 3 - Depósito Atacado:\n";
echo "   Admin:    roberto@deposito.com / roberto123\n";
echo "   Employee: fernanda@deposito.com / fernanda123\n";
echo "   -> 5 produtos (Alimentos/Bebidas/Limpeza)\n\n";

echo "✅ SISTEMA MULTI-EMPRESA CONFIGURADO!\n";
echo "🔒 Cada empresa vê APENAS seus próprios dados\n";
echo "👑 Super Admin vê TUDO\n\n";

echo "Acesse: http://localhost/estoque/\n";

$conn->close();
?>
