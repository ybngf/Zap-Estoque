<?php
/**
 * RESET COMPLETO DO BANCO DE DADOS
 * Deleta tudo e recria com dados de exemplo
 */

header('Content-Type: text/plain; charset=UTF-8');

echo "=== RESET COMPLETO DO BANCO DE DADOS ===\n\n";
echo "⚠️ ATENÇÃO: Este script vai deletar TODOS os dados!\n\n";

// Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');

// Connect to MySQL server
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

if ($conn->connect_error) {
    die("❌ ERRO: Não foi possível conectar ao MySQL: " . $conn->connect_error . "\n");
}

echo "✅ Conectado ao MySQL Server\n\n";

// Drop database if exists
echo "1. Deletando banco de dados antigo...\n";
$conn->query("DROP DATABASE IF EXISTS " . DB_NAME);
echo "   ✅ Banco deletado (se existia)\n\n";

// Create fresh database
echo "2. Criando banco de dados novo...\n";
$sql = "CREATE DATABASE " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($conn->query($sql)) {
    echo "   ✅ Banco criado: " . DB_NAME . "\n\n";
} else {
    die("   ❌ ERRO ao criar banco: " . $conn->error . "\n");
}

// Select database
$conn->select_db(DB_NAME);

// Create tables
echo "3. Criando tabelas...\n";

// Table: companies
$sql = "CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
$conn->query($sql);
echo "   ✅ companies\n";

// Table: users
$sql = "CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Super Admin', 'Admin', 'Manager', 'Employee') NOT NULL DEFAULT 'Employee',
    company VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
$conn->query($sql);
echo "   ✅ users\n";

// Table: categories
$sql = "CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
$conn->query($sql);
echo "   ✅ categories\n";

// Table: suppliers
$sql = "CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
$conn->query($sql);
echo "   ✅ suppliers\n";

// Table: products
$sql = "CREATE TABLE products (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
$conn->query($sql);
echo "   ✅ products\n";

// Table: stock_movements
$sql = "CREATE TABLE stock_movements (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
$conn->query($sql);
echo "   ✅ stock_movements\n\n";

// Insert sample data
echo "4. Inserindo dados de exemplo...\n\n";

// Companies
echo "   📦 Empresas:\n";
$conn->query("INSERT INTO companies (name) VALUES 
    ('Empresa Principal'),
    ('Filial São Paulo'),
    ('Filial Rio de Janeiro')");
echo "      ✅ 3 empresas criadas\n\n";

// Users
echo "   👤 Usuários:\n";
$users = [
    ['Administrador', 'admin@estoque.com', 'admin123', 'Super Admin', 'Empresa Principal', 'Admin'],
    ['João Silva', 'joao@estoque.com', 'joao123', 'Admin', 'Empresa Principal', 'Joao'],
    ['Maria Santos', 'maria@estoque.com', 'maria123', 'Manager', 'Filial São Paulo', 'Maria'],
    ['Pedro Oliveira', 'pedro@estoque.com', 'pedro123', 'Employee', 'Filial Rio de Janeiro', 'Pedro'],
    ['Ana Costa', 'ana@estoque.com', 'ana123', 'Employee', 'Empresa Principal', 'Ana']
];

foreach ($users as $user) {
    $password_hash = password_hash($user[2], PASSWORD_DEFAULT);
    $avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" . $user[5];
    
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, company, avatar) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $user[0], $user[1], $password_hash, $user[3], $user[4], $avatar);
    $stmt->execute();
    
    echo "      ✅ " . $user[0] . " (" . $user[1] . " / senha: " . $user[2] . ")\n";
}
echo "\n";

// Categories
echo "   📁 Categorias:\n";
$categories = [
    ['Eletrônicos', 'Produtos eletrônicos e tecnologia'],
    ['Alimentos', 'Produtos alimentícios e bebidas'],
    ['Vestuário', 'Roupas, calçados e acessórios'],
    ['Limpeza', 'Produtos de limpeza e higiene'],
    ['Escritório', 'Material de escritório e papelaria'],
    ['Ferramentas', 'Ferramentas e equipamentos'],
    ['Livros', 'Livros, revistas e material de leitura'],
    ['Esportes', 'Artigos esportivos e fitness']
];

foreach ($categories as $cat) {
    $stmt = $conn->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
    $stmt->bind_param("ss", $cat[0], $cat[1]);
    $stmt->execute();
    echo "      ✅ " . $cat[0] . "\n";
}
echo "\n";

// Suppliers
echo "   🏢 Fornecedores:\n";
$suppliers = [
    ['TechSupply Ltda', 'Carlos Mendes', 'carlos@techsupply.com', '(11) 3456-7890'],
    ['AlimentaBem Distribuidora', 'Fernanda Lima', 'fernanda@alimentabem.com', '(21) 2345-6789'],
    ['Moda & Estilo', 'Roberto Carvalho', 'roberto@modaestilo.com', '(11) 4567-8901'],
    ['LimpaMax Produtos', 'Juliana Rocha', 'juliana@limpamax.com', '(85) 5678-9012'],
    ['PapelOffice', 'Marcos Pereira', 'marcos@papeloffice.com', '(11) 6789-0123'],
    ['FerraTools', 'André Souza', 'andre@ferratools.com', '(48) 7890-1234']
];

foreach ($suppliers as $sup) {
    $stmt = $conn->prepare("INSERT INTO suppliers (name, contact_person, email, phone) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $sup[0], $sup[1], $sup[2], $sup[3]);
    $stmt->execute();
    echo "      ✅ " . $sup[0] . "\n";
}
echo "\n";

// Products
echo "   📦 Produtos:\n";
$products = [
    ['Notebook Dell Inspiron 15', 'NB-DELL-001', 1, 1, 2899.00, 15, 5, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'],
    ['Mouse Logitech MX Master', 'MS-LOGI-001', 1, 1, 299.90, 45, 10, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'],
    ['Teclado Mecânico RGB', 'KB-MECH-001', 1, 1, 449.00, 30, 8, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3'],
    ['Monitor LG 27" 4K', 'MON-LG-001', 1, 1, 1899.00, 12, 3, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'],
    ['Arroz Integral 1kg', 'ALM-ARROZ-001', 2, 2, 8.90, 200, 50, 'https://images.unsplash.com/photo-1586201375761-83865001e31c'],
    ['Feijão Preto 1kg', 'ALM-FEIJ-001', 2, 2, 7.50, 180, 40, 'https://images.unsplash.com/photo-1596040033229-a0b3b9f5e8b1'],
    ['Óleo de Soja 900ml', 'ALM-OLEO-001', 2, 2, 6.90, 150, 30, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'],
    ['Camiseta Básica Branca', 'VEST-CAM-001', 3, 3, 39.90, 80, 20, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
    ['Calça Jeans Masculina', 'VEST-CAL-001', 3, 3, 129.90, 50, 15, 'https://images.unsplash.com/photo-1542272454315-7f6b6c4c8f7c'],
    ['Tênis Esportivo Nike', 'VEST-TEN-001', 3, 3, 349.00, 35, 10, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
    ['Detergente Líquido 500ml', 'LIMP-DET-001', 4, 4, 3.50, 300, 80, 'https://images.unsplash.com/photo-1563453392212-326f5e854473'],
    ['Desinfetante 2L', 'LIMP-DES-001', 4, 4, 8.90, 120, 30, 'https://images.unsplash.com/photo-1585421514738-01798e348b17'],
    ['Caderno Universitário 200 folhas', 'ESC-CAD-001', 5, 5, 24.90, 100, 25, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64'],
    ['Caneta Esferográfica Azul', 'ESC-CAN-001', 5, 5, 2.50, 500, 100, 'https://images.unsplash.com/photo-1586027976067-c8c8bf5ed4a6'],
    ['Furadeira Elétrica DeWalt', 'FERR-FUR-001', 6, 6, 489.00, 10, 3, 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407'],
    ['Jogo de Chaves Phillips', 'FERR-CHV-001', 6, 6, 79.90, 25, 8, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc']
];

foreach ($products as $prod) {
    $stmt = $conn->prepare("INSERT INTO products (name, sku, category_id, supplier_id, price, stock, min_stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssiidiss", $prod[0], $prod[1], $prod[2], $prod[3], $prod[4], $prod[5], $prod[6], $prod[7]);
    $stmt->execute();
    echo "      ✅ " . $prod[0] . " (estoque: " . $prod[5] . ")\n";
}
echo "\n";

// Stock Movements (histórico de exemplo)
echo "   📊 Movimentações de Estoque:\n";
$movements = [
    [1, 1, 'Entrada', 20, 'Compra inicial', '2024-11-01 10:00:00'],
    [2, 1, 'Entrada', 50, 'Reposição de estoque', '2024-11-02 14:30:00'],
    [1, 2, 'Saída', 5, 'Venda para cliente', '2024-11-05 11:15:00'],
    [5, 1, 'Entrada', 250, 'Compra em atacado', '2024-11-03 09:00:00'],
    [5, 3, 'Saída', 50, 'Venda varejo', '2024-11-10 16:00:00'],
    [8, 4, 'Entrada', 100, 'Nova coleção', '2024-11-04 13:00:00'],
    [8, 2, 'Saída', 20, 'Promoção', '2024-11-12 15:30:00'],
    [11, 5, 'Entrada', 400, 'Estoque inicial', '2024-11-01 08:00:00'],
    [11, 3, 'Saída', 100, 'Uso interno', '2024-11-08 10:00:00']
];

foreach ($movements as $mov) {
    $stmt = $conn->prepare("INSERT INTO stock_movements (product_id, user_id, type, quantity, reason, date) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iisiss", $mov[0], $mov[1], $mov[2], $mov[3], $mov[4], $mov[5]);
    $stmt->execute();
    echo "      ✅ " . $mov[2] . " - " . $mov[3] . " unidades - " . $mov[4] . "\n";
}
echo "\n";

// Summary
echo "=== RESUMO FINAL ===\n\n";

$tables = ['companies', 'users', 'categories', 'suppliers', 'products', 'stock_movements'];
foreach ($tables as $table) {
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    $count = $result->fetch_assoc()['count'];
    echo "   " . str_pad($table . ":", 20) . $count . " registros\n";
}

echo "\n=== BANCO DE DADOS RESETADO COM SUCESSO! ===\n\n";

echo "👤 Usuários criados:\n";
echo "   1. admin@estoque.com     / admin123  (Super Admin)\n";
echo "   2. joao@estoque.com      / joao123   (Admin)\n";
echo "   3. maria@estoque.com     / maria123  (Manager)\n";
echo "   4. pedro@estoque.com     / pedro123  (Employee)\n";
echo "   5. ana@estoque.com       / ana123    (Employee)\n\n";

echo "🌐 Acesse o sistema:\n";
echo "   Frontend: http://localhost:5173\n";
echo "   Login: admin@estoque.com / admin123\n\n";

$conn->close();
?>