<?php
/**
 * Debug detalhado do login
 */

header('Content-Type: text/plain; charset=UTF-8');

require_once 'config.php';

echo "=== DEBUG DE LOGIN ===\n\n";

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("❌ Erro de conexão: " . $conn->connect_error . "\n");
}

echo "✅ Conectado ao banco\n\n";

// Listar todos os usuários
echo "1. Usuários cadastrados:\n";
$result = $conn->query("SELECT id, name, email, role, LENGTH(password) as pwd_len FROM users");

while ($user = $result->fetch_assoc()) {
    echo "   ID: {$user['id']}\n";
    echo "   Nome: {$user['name']}\n";
    echo "   Email: {$user['email']}\n";
    echo "   Role: {$user['role']}\n";
    echo "   Tamanho senha hash: {$user['pwd_len']} caracteres\n";
    echo "   ---\n";
}

// Testar login com admin
echo "\n2. Testando login: admin@estoque.com / admin123\n";

$email = 'admin@estoque.com';
$password = 'admin123';

$stmt = $conn->prepare("SELECT id, name, email, password, role, company, avatar FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "   ✅ Usuário encontrado!\n";
    echo "   Nome: {$row['name']}\n";
    echo "   Email: {$row['email']}\n\n";
    
    echo "3. Testando senha...\n";
    echo "   Senha digitada: $password\n";
    echo "   Hash no banco: " . substr($row['password'], 0, 60) . "...\n";
    
    if (password_verify($password, $row['password'])) {
        echo "   ✅ SENHA CORRETA!\n\n";
        
        echo "4. Dados que seriam retornados:\n";
        $user = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'company' => $row['company'],
            'avatar' => $row['avatar']
        ];
        echo json_encode($user, JSON_PRETTY_PRINT) . "\n\n";
        
        echo "✅ LOGIN DEVERIA FUNCIONAR!\n";
    } else {
        echo "   ❌ SENHA INCORRETA!\n\n";
        
        echo "4. Tentando criar novo hash...\n";
        $new_hash = password_hash($password, PASSWORD_DEFAULT);
        echo "   Novo hash: " . substr($new_hash, 0, 60) . "...\n\n";
        
        echo "5. Atualizando senha no banco...\n";
        $update = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
        $update->bind_param("ss", $new_hash, $email);
        if ($update->execute()) {
            echo "   ✅ Senha atualizada!\n";
            echo "   Tente fazer login novamente.\n";
        }
    }
} else {
    echo "   ❌ Usuário NÃO encontrado!\n";
    echo "   Email procurado: $email\n";
}

echo "\n=== FIM DO DEBUG ===\n";

$conn->close();
?>