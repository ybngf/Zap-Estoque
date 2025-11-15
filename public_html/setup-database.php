<?php
/**
 * Database Setup Script - Localhost
 * Creates all tables and inserts sample data
 */

header('Content-Type: text/plain; charset=UTF-8');

echo "=== CRIAÇÃO DO BANCO DE DADOS ===\n\n";

// Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');

// Connect to MySQL server (without database)
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

if ($conn->connect_error) {
    die("❌ ERRO: Não foi possível conectar ao MySQL: " . $conn->connect_error . "\n");
}

echo "✅ Conectado ao MySQL Server\n";
echo "   Versão: " . $conn->server_info . "\n\n";

// Create database
echo "Criando banco de dados 'dona_estoqueg'...\n";
$sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($conn->query($sql)) {
    echo "✅ Banco de dados criado/verificado\n\n";
} else {
    die("❌ ERRO ao criar banco: " . $conn->error . "\n");
}

// Select database
$conn->select_db(DB_NAME);

// Create tables
$tables = [
    'companies' => "CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    
    'users' => "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('Super Admin', 'Admin', 'Manager', 'Employee') NOT NULL DEFAULT 'Employee',
        company VARCHAR(255) NOT NULL,
        avatar VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    
    'categories' => "CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    
    'suppliers' => "CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    
    'products' => "CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL UNIQUE,
        category_id INT NOT NULL,
        supplier_id INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 0,
        image_url VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    
    'stock_movements' => "CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM('Entrada', 'Saída', 'Ajuste') NOT NULL,
        quantity INT NOT NULL,
        reason TEXT,
        date DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
];

echo "Criando tabelas...\n";
foreach ($tables as $table_name => $sql) {
    if ($conn->query($sql)) {
        echo "  ✅ $table_name\n";
    } else {
        echo "  ❌ $table_name: " . $conn->error . "\n";
    }
}

echo "\nInserindo dados de exemplo...\n";

// Insert sample data (only if tables are empty)

// Company
$result = $conn->query("SELECT COUNT(*) as count FROM companies");
if ($result->fetch_assoc()['count'] == 0) {
    $conn->query("INSERT INTO companies (id, name) VALUES (1, 'Empresa Principal')");
    echo "  ✅ Empresa criada\n";
}

// User (password: admin123)
$result = $conn->query("SELECT COUNT(*) as count FROM users");
if ($result->fetch_assoc()['count'] == 0) {
    $password_hash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (id, name, email, password, role, company, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $name = 'Administrador';
    $email = 'admin@estoque.com';
    $role = 'Super Admin';
    $company = 'Empresa Principal';
    $avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';
    $id = 1;
    $stmt->bind_param("issssss", $id, $name, $email, $password_hash, $role, $company, $avatar);
    $stmt->execute();
    echo "  ✅ Usuário admin criado (email: admin@estoque.com, senha: admin123)\n";
}

// Categories
$result = $conn->query("SELECT COUNT(*) as count FROM categories");
if ($result->fetch_assoc()['count'] == 0) {
    $conn->query("INSERT INTO categories (name, description) VALUES 
        ('Eletrônicos', 'Produtos eletrônicos em geral'),
        ('Alimentos', 'Produtos alimentícios'),
        ('Vestuário', 'Roupas e acessórios')");
    echo "  ✅ Categorias criadas\n";
}

// Suppliers
$result = $conn->query("SELECT COUNT(*) as count FROM suppliers");
if ($result->fetch_assoc()['count'] == 0) {
    $conn->query("INSERT INTO suppliers (name, contact_person, email, phone) VALUES 
        ('Fornecedor A', 'João Silva', 'joao@fornecedora.com', '(11) 1234-5678'),
        ('Fornecedor B', 'Maria Santos', 'maria@fornecedorb.com', '(11) 9876-5432')");
    echo "  ✅ Fornecedores criados\n";
}

// Products
$result = $conn->query("SELECT COUNT(*) as count FROM products");
if ($result->fetch_assoc()['count'] == 0) {
    $conn->query("INSERT INTO products (name, sku, category_id, supplier_id, price, stock, min_stock, image_url) VALUES 
        ('Notebook Dell', 'NB-DELL-001', 1, 1, 2500.00, 10, 5, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'),
        ('Mouse Wireless', 'MS-LOGI-001', 1, 1, 80.00, 50, 10, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'),
        ('Arroz Integral', 'ALM-ARROZ-001', 2, 2, 15.00, 100, 20, 'https://images.unsplash.com/photo-1586201375761-83865001e31c')");
    echo "  ✅ Produtos criados\n";
}

echo "\n=== RESUMO ===\n\n";

$tables_to_check = ['companies', 'users', 'categories', 'suppliers', 'products', 'stock_movements'];
foreach ($tables_to_check as $table) {
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    $count = $result->fetch_assoc()['count'];
    echo "  $table: $count registros\n";
}

echo "\n✅ BANCO DE DADOS CONFIGURADO COM SUCESSO!\n\n";
echo "Credenciais de acesso:\n";
echo "  Email: admin@estoque.com\n";
echo "  Senha: admin123\n\n";

$conn->close();
?>