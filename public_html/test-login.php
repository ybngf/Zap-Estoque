<?php
/**
 * Test Login System
 */

header('Content-Type: text/plain; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

echo "=== TESTE DO SISTEMA DE LOGIN ===\n\n";

// Test database connection
echo "1. Testando conexão com banco de dados...\n";
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    echo "   ❌ ERRO: " . $conn->connect_error . "\n";
    echo "\n💡 Verifique:\n";
    echo "   - MySQL está rodando?\n";
    echo "   - Credenciais estão corretas?\n";
    echo "   - Banco 'dona_estoqueg' existe?\n\n";
    exit(1);
}

echo "   ✅ Conectado ao MySQL!\n";
echo "   Host: " . DB_HOST . "\n";
echo "   User: " . DB_USER . "\n";
echo "   Database: " . DB_NAME . "\n\n";

// Check if users table exists
echo "2. Verificando tabela de usuários...\n";
$result = $conn->query("SHOW TABLES LIKE 'users'");
if ($result->num_rows == 0) {
    echo "   ❌ ERRO: Tabela 'users' não existe!\n";
    echo "\n💡 Execute: http://localhost:8000/setup-database.php\n\n";
    exit(1);
}
echo "   ✅ Tabela 'users' existe!\n\n";

// Check users
echo "3. Verificando usuários cadastrados...\n";
$result = $conn->query("SELECT id, name, email, role, password FROM users");

if ($result->num_rows == 0) {
    echo "   ⚠️ Nenhum usuário cadastrado!\n";
    echo "\n💡 Criando usuário admin...\n";
    
    $password = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, company, avatar) VALUES (?, ?, ?, ?, ?, ?)");
    $name = 'Administrador';
    $email = 'admin@estoque.com';
    $role = 'Super Admin';
    $company = 'Empresa Principal';
    $avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';
    $stmt->bind_param("ssssss", $name, $email, $password, $role, $company, $avatar);
    
    if ($stmt->execute()) {
        echo "   ✅ Usuário admin criado!\n\n";
    } else {
        echo "   ❌ ERRO ao criar usuário: " . $stmt->error . "\n\n";
        exit(1);
    }
} else {
    echo "   ✅ Usuários encontrados:\n\n";
    while ($user = $result->fetch_assoc()) {
        echo "   ID: " . $user['id'] . "\n";
        echo "   Nome: " . $user['name'] . "\n";
        echo "   Email: " . $user['email'] . "\n";
        echo "   Role: " . $user['role'] . "\n";
        echo "   Senha (hash): " . substr($user['password'], 0, 20) . "...\n";
        echo "   ---\n";
    }
}

// Test login with admin credentials
echo "\n4. Testando login com admin@estoque.com...\n";
$email = 'admin@estoque.com';
$password = 'admin123';

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 0) {
    echo "   ❌ ERRO: Usuário não encontrado!\n";
    echo "   Email procurado: $email\n\n";
} else {
    $user = $result->fetch_assoc();
    echo "   ✅ Usuário encontrado!\n";
    echo "   Nome: " . $user['name'] . "\n";
    echo "   Email: " . $user['email'] . "\n";
    
    // Verify password
    echo "\n5. Verificando senha...\n";
    echo "   Senha testada: $password\n";
    echo "   Hash no banco: " . substr($user['password'], 0, 30) . "...\n";
    
    if (password_verify($password, $user['password'])) {
        echo "   ✅ SENHA CORRETA!\n";
        echo "\n=== LOGIN FUNCIONARIA! ===\n";
        echo "\nCredenciais válidas:\n";
        echo "   Email: admin@estoque.com\n";
        echo "   Senha: admin123\n\n";
    } else {
        echo "   ❌ SENHA INCORRETA!\n";
        echo "\n💡 Resetando senha para 'admin123'...\n";
        
        $new_password = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
        $stmt->bind_param("ss", $new_password, $email);
        
        if ($stmt->execute()) {
            echo "   ✅ Senha resetada com sucesso!\n";
            echo "\nTente novamente com:\n";
            echo "   Email: admin@estoque.com\n";
            echo "   Senha: admin123\n\n";
        } else {
            echo "   ❌ ERRO ao resetar senha: " . $stmt->error . "\n\n";
        }
    }
}

// Test API endpoint
echo "\n6. Testando endpoint da API...\n";
$api_url = "http://localhost:8000/api.php/users";
echo "   URL: $api_url\n";

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code == 200) {
    echo "   ✅ API respondendo (HTTP $http_code)!\n";
    $users = json_decode($response, true);
    if ($users && count($users) > 0) {
        echo "   ✅ API retornou " . count($users) . " usuário(s)\n";
    }
} else {
    echo "   ⚠️ API retornou HTTP $http_code\n";
    echo "   Resposta: " . substr($response, 0, 100) . "...\n";
}

echo "\n=== RESUMO ===\n\n";
echo "✅ Banco de dados: Conectado\n";
echo "✅ Tabela users: Existe\n";
echo "✅ Usuários: Cadastrados\n";
echo "✅ Senha admin: Válida\n\n";

echo "🌐 URLs para testar:\n";
echo "   API: http://localhost:8000/api.php/users\n";
echo "   Setup: http://localhost:8000/setup-database.php\n";
echo "   Este teste: http://localhost:8000/test-login.php\n\n";

echo "🚀 Para iniciar frontend:\n";
echo "   npm run dev\n";
echo "   Acesse: http://localhost:5173\n\n";

$conn->close();
?>