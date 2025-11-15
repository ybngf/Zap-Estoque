<?php
/**
 * Teste de rotas da API
 */
header('Content-Type: text/plain; charset=UTF-8');

echo "=== TESTE DE ROTAS DA API ===\n\n";

$testUrls = [
    'Login' => '/estoque/api.php/auth/login',
    'Products' => '/estoque/api.php/products',
    'Categories' => '/estoque/api.php/categories',
    'Dashboard' => '/estoque/api.php/dashboard',
];

foreach ($testUrls as $name => $url) {
    echo "📍 Testando: $name\n";
    echo "   URL: http://localhost$url\n";
    
    // Simular o que o Apache passa para o PHP
    $_SERVER['REQUEST_URI'] = $url;
    $_SERVER['REQUEST_METHOD'] = 'POST';
    
    $path = parse_url($url, PHP_URL_PATH);
    echo "   Path original: $path\n";
    
    // Aplicar regex
    $path = preg_replace('#^.*/api\.php/?#', '', $path);
    echo "   Path processado: $path\n";
    
    $path_parts = explode('/', trim($path, '/'));
    $resource = $path_parts[0] ?? '';
    $id = $path_parts[1] ?? null;
    
    echo "   Resource: $resource\n";
    echo "   ID: " . ($id ?? 'null') . "\n";
    echo "   ---\n\n";
}

echo "\n=== TESTE DE LOGIN ===\n\n";

// Simular requisição de login
$_SERVER['REQUEST_URI'] = '/estoque/api.php/auth/login';
$_SERVER['REQUEST_METHOD'] = 'POST';

require_once 'config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("❌ Erro de conexão: " . $conn->connect_error . "\n");
}

$email = 'admin@estoque.com';
$password = 'admin123';

echo "Tentando login com:\n";
echo "Email: $email\n";
echo "Password: $password\n\n";

$stmt = $conn->prepare("SELECT id, name, email, password, role, company, avatar FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "✅ Usuário encontrado\n\n";
    
    if (password_verify($password, $row['password'])) {
        echo "✅ Senha correta!\n\n";
        
        $user = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'company' => $row['company'],
            'avatar' => $row['avatar']
        ];
        
        echo "Resposta que seria retornada:\n";
        echo json_encode($user, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "❌ Senha incorreta\n";
    }
} else {
    echo "❌ Usuário não encontrado\n";
}

$conn->close();
?>
