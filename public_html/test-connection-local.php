<?php
/**
 * Test MySQL Connection - Localhost
 */

header('Content-Type: text/plain; charset=UTF-8');

echo "=== TESTE DE CONEXÃO MySQL LOCALHOST ===\n\n";

// Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');

echo "Configuração:\n";
echo "  Host: " . DB_HOST . "\n";
echo "  User: " . DB_USER . "\n";
echo "  Pass: " . (DB_PASS ? '***' : '(vazio)') . "\n";
echo "  DB:   " . DB_NAME . "\n\n";

// Step 1: Test connection to MySQL server
echo "1. Tentando conectar ao servidor MySQL...\n";
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

if ($conn->connect_error) {
    echo "   ❌ ERRO: " . $conn->connect_error . "\n";
    echo "\n💡 Possíveis soluções:\n";
    echo "   - Verifique se o MySQL está rodando (XAMPP/WAMP)\n";
    echo "   - Verifique se a senha do root está correta\n";
    echo "   - Tente: mysql -u root -p\n";
    exit(1);
}

echo "   ✅ Conectado ao servidor MySQL!\n";
echo "   Versão do MySQL: " . $conn->server_info . "\n\n";

// Step 2: Check if database exists
echo "2. Verificando se o banco 'dona_estoqueg' existe...\n";
$result = $conn->query("SHOW DATABASES LIKE 'dona_estoqueg'");

if ($result->num_rows > 0) {
    echo "   ✅ Banco de dados existe!\n\n";
} else {
    echo "   ⚠️ Banco de dados NÃO existe.\n";
    echo "   Criando banco de dados...\n";
    
    if ($conn->query("CREATE DATABASE dona_estoqueg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")) {
        echo "   ✅ Banco criado com sucesso!\n\n";
    } else {
        echo "   ❌ ERRO ao criar banco: " . $conn->error . "\n";
        exit(1);
    }
}

// Step 3: Select database
echo "3. Selecionando banco de dados...\n";
$conn->select_db(DB_NAME);
echo "   ✅ Banco selecionado!\n\n";

// Step 4: Check tables
echo "4. Verificando tabelas existentes...\n";
$result = $conn->query("SHOW TABLES");
$tables = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    echo "   ✅ Tabelas encontradas (" . count($tables) . "):\n";
    foreach ($tables as $table) {
        echo "      - " . $table . "\n";
    }
    echo "\n";
} else {
    echo "   ⚠️ Nenhuma tabela encontrada.\n";
    echo "   O banco existe mas está vazio.\n\n";
}

// Step 5: Check required tables
echo "5. Verificando tabelas obrigatórias...\n";
$required_tables = [
    'users',
    'companies', 
    'categories',
    'suppliers',
    'products',
    'stock_movements'
];

$missing_tables = [];
foreach ($required_tables as $table) {
    if (in_array($table, $tables)) {
        echo "   ✅ $table\n";
    } else {
        echo "   ❌ $table (faltando)\n";
        $missing_tables[] = $table;
    }
}

if (count($missing_tables) > 0) {
    echo "\n   ⚠️ Faltam " . count($missing_tables) . " tabelas!\n";
    echo "   Execute o script de criação do banco de dados.\n";
} else {
    echo "\n   ✅ Todas as tabelas necessárias existem!\n";
}

// Step 6: Test query
if (in_array('users', $tables)) {
    echo "\n6. Testando consulta de dados...\n";
    $result = $conn->query("SELECT COUNT(*) as total FROM users");
    $row = $result->fetch_assoc();
    echo "   ✅ Total de usuários: " . $row['total'] . "\n";
    
    if ($row['total'] > 0) {
        $result = $conn->query("SELECT id, name, email FROM users LIMIT 3");
        echo "\n   Usuários cadastrados:\n";
        while ($user = $result->fetch_assoc()) {
            echo "      - ID " . $user['id'] . ": " . $user['name'] . " (" . $user['email'] . ")\n";
        }
    }
}

echo "\n=== TESTE CONCLUÍDO ===\n";
echo "\n✅ Sistema configurado para MySQL localhost!\n";
echo "   Usuário: root\n";
echo "   Banco: dona_estoqueg\n";

$conn->close();
?>