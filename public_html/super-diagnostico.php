<?php
/**
 * SUPER DIAGNÓSTICO - Testa TUDO
 * Acesse: http://seudominio.com/super-diagnostico.php
 */

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>🔬 Super Diagnóstico</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        h1 { color: #ff0; }
        h2 { color: #0ff; border-bottom: 1px solid #0f0; }
        .ok { color: #0f0; }
        .fail { color: #f00; }
        .warn { color: #ff0; }
        pre { background: #111; padding: 10px; border-left: 3px solid #0f0; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #0f0; padding: 8px; text-align: left; }
        th { background: #003300; }
    </style>
</head>
<body>

<h1>🔬 SUPER DIAGNÓSTICO DO SISTEMA</h1>

<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'dona_estoqueg');
define('DB_PASS', 'nYW0bHpnYW0bHp');
define('DB_NAME', 'dona_estoqueg');

echo "<h2>1️⃣ INFORMAÇÕES DO SERVIDOR</h2>";
echo "<pre>";
echo "PHP Version: " . phpversion() . "\n";
echo "Server: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Path: " . __FILE__ . "\n";
echo "Current User: " . get_current_user() . "\n";
echo "</pre>";

echo "<h2>2️⃣ TESTE DE CONEXÃO MYSQL</h2>";

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    echo "<p class='fail'>❌ FALHOU: " . $conn->connect_error . "</p>";
    exit;
} else {
    echo "<p class='ok'>✅ CONECTADO COM SUCESSO!</p>";
    echo "<pre>";
    echo "Host: " . DB_HOST . "\n";
    echo "User: " . DB_USER . "\n";
    echo "Database: " . DB_NAME . "\n";
    echo "</pre>";
}

$conn->set_charset('utf8mb4');

echo "<h2>3️⃣ TABELAS NO BANCO</h2>";
$result = $conn->query("SHOW TABLES");
$tables = [];
echo "<pre>";
while ($row = $result->fetch_array()) {
    $tables[] = $row[0];
    echo "✓ " . $row[0] . "\n";
}
echo "</pre>";

if (count($tables) === 0) {
    echo "<p class='fail'>❌ NENHUMA TABELA! Execute schema.sql</p>";
    exit;
}

echo "<h2>4️⃣ ESTRUTURA DA TABELA USERS</h2>";
if (in_array('users', $tables)) {
    $result = $conn->query("DESCRIBE users");
    echo "<table>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>{$row['Field']}</td>";
        echo "<td>{$row['Type']}</td>";
        echo "<td>{$row['Null']}</td>";
        echo "<td>{$row['Key']}</td>";
        echo "<td>{$row['Default']}</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p class='fail'>❌ Tabela 'users' não existe!</p>";
    exit;
}

echo "<h2>5️⃣ TODOS OS USUÁRIOS NO BANCO</h2>";
$result = $conn->query("SELECT id, name, email, password, role, company FROM users");

if ($result->num_rows === 0) {
    echo "<p class='fail'>❌ NENHUM USUÁRIO! Execute os INSERTs do schema.sql</p>";
    exit;
}

echo "<table>";
echo "<tr><th>ID</th><th>Nome</th><th>Email</th><th>Senha</th><th>Papel</th><th>Empresa</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['id']}</td>";
    echo "<td>{$row['name']}</td>";
    echo "<td>{$row['email']}</td>";
    echo "<td>{$row['password']}</td>";
    echo "<td>{$row['role']}</td>";
    echo "<td>{$row['company']}</td>";
    echo "</tr>";
}
echo "</table>";

echo "<h2>6️⃣ TESTE DE LOGIN - QUERY DIRETA</h2>";

$testCases = [
    ['email' => 'admin@sistema.com', 'password' => '123456'],
    ['email' => 'joao@empresa.com', 'password' => '123456'],
    ['email' => 'maria@empresa.com', 'password' => '123456'],
    ['email' => 'pedro@empresa.com', 'password' => '123456']
];

foreach ($testCases as $test) {
    echo "<h3>Testando: {$test['email']}</h3>";
    
    // Teste 1: Query direta (como está no api.php)
    $stmt = $conn->prepare("SELECT id, name, email, role, company FROM users WHERE email = ? AND password = ?");
    $stmt->bind_param("ss", $test['email'], $test['password']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo "<p class='ok'>✅ LOGIN OK - Query preparada funcionou!</p>";
        echo "<pre>";
        echo "ID: {$row['id']}\n";
        echo "Nome: {$row['name']}\n";
        echo "Email: {$row['email']}\n";
        echo "Papel: {$row['role']}\n";
        echo "Empresa: {$row['company']}\n";
        echo "</pre>";
    } else {
        echo "<p class='fail'>❌ LOGIN FALHOU - Query preparada não retornou nada</p>";
        
        // Debug: verificar se email existe
        $checkStmt = $conn->prepare("SELECT id, password FROM users WHERE email = ?");
        $checkStmt->bind_param("s", $test['email']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkRow = $checkResult->fetch_assoc()) {
            echo "<p class='warn'>⚠️ Email EXISTE no banco</p>";
            echo "<pre>";
            echo "Senha no banco: '{$checkRow['password']}'\n";
            echo "Senha testada:  '{$test['password']}'\n";
            echo "Tamanho senha DB: " . strlen($checkRow['password']) . "\n";
            echo "Tamanho senha teste: " . strlen($test['password']) . "\n";
            echo "São iguais? " . ($checkRow['password'] === $test['password'] ? 'SIM' : 'NÃO') . "\n";
            echo "Comparação binária: " . (strcmp($checkRow['password'], $test['password']) === 0 ? 'SIM' : 'NÃO') . "\n";
            
            // Hex dump para ver caracteres escondidos
            echo "\nHex senha DB: " . bin2hex($checkRow['password']) . "\n";
            echo "Hex senha teste: " . bin2hex($test['password']) . "\n";
            echo "</pre>";
        } else {
            echo "<p class='fail'>❌ Email NÃO EXISTE no banco!</p>";
        }
        $checkStmt->close();
    }
    $stmt->close();
    
    echo "<hr>";
}

echo "<h2>7️⃣ TESTE DA API - Simulando POST</h2>";

// Simular o que acontece quando frontend chama a API
$testEmail = 'admin@sistema.com';
$testPassword = '123456';

echo "<h3>Simulando POST /api/auth/login</h3>";
echo "<pre>";
echo "Dados enviados:\n";
echo json_encode(['email' => $testEmail, 'password' => $testPassword], JSON_PRETTY_PRINT);
echo "\n\n";

$stmt = $conn->prepare("SELECT id, name, email, role, company, avatar FROM users WHERE email = ? AND password = ?");
$stmt->bind_param("ss", $testEmail, $testPassword);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "Resposta da API (200 OK):\n";
    echo json_encode($row, JSON_PRETTY_PRINT);
} else {
    echo "Resposta da API (401 Unauthorized):\n";
    echo json_encode(['error' => 'Credenciais inválidas'], JSON_PRETTY_PRINT);
}
$stmt->close();
echo "</pre>";

echo "<h2>8️⃣ TESTE DE RECEBIMENTO DE DADOS POST</h2>";

// Criar arquivo de teste para receber POST
file_put_contents('test-post-receiver.php', '<?php
header("Content-Type: application/json");
$input = json_decode(file_get_contents("php://input"), true);
echo json_encode([
    "received" => $input,
    "method" => $_SERVER["REQUEST_METHOD"],
    "content_type" => $_SERVER["CONTENT_TYPE"] ?? "not set"
]);
');

echo "<p class='ok'>✅ Arquivo test-post-receiver.php criado</p>";
echo "<p>Use este curl para testar:</p>";
echo "<pre>";
echo 'curl -X POST http://' . $_SERVER['HTTP_HOST'] . '/test-post-receiver.php \\' . "\n";
echo '  -H "Content-Type: application/json" \\' . "\n";
echo '  -d \'{"email":"admin@sistema.com","password":"123456"}\'' . "\n";
echo "</pre>";

echo "<h2>9️⃣ VERIFICAÇÃO DE ARQUIVOS</h2>";

$files = [
    'api.php' => 'Backend principal',
    '.htaccess' => 'Configuração Apache',
    'test-db.php' => 'Teste de banco',
    'index.html' => 'Frontend build',
    'diagnostico-servidor.html' => 'Diagnóstico HTML'
];

echo "<table>";
echo "<tr><th>Arquivo</th><th>Descrição</th><th>Status</th><th>Tamanho</th><th>Permissões</th></tr>";
foreach ($files as $file => $desc) {
    $path = __DIR__ . '/' . $file;
    $exists = file_exists($path);
    $size = $exists ? filesize($path) : 0;
    $perms = $exists ? substr(sprintf('%o', fileperms($path)), -4) : 'N/A';
    
    echo "<tr>";
    echo "<td>{$file}</td>";
    echo "<td>{$desc}</td>";
    echo "<td>" . ($exists ? "<span class='ok'>✅ Existe</span>" : "<span class='fail'>❌ Não existe</span>") . "</td>";
    echo "<td>" . ($exists ? number_format($size) . " bytes" : "-") . "</td>";
    echo "<td>{$perms}</td>";
    echo "</tr>";
}
echo "</table>";

echo "<h2>🔟 DIAGNÓSTICO FINAL</h2>";

// Contar problemas
$problems = [];

if (count($tables) === 0) {
    $problems[] = "Nenhuma tabela no banco";
}

$userCount = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()['count'];
if ($userCount === 0) {
    $problems[] = "Nenhum usuário cadastrado";
}

$stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND password = ?");
$testEmail = 'admin@sistema.com';
$testPassword = '123456';
$stmt->bind_param("ss", $testEmail, $testPassword);
$stmt->execute();
$result = $stmt->get_result();
$loginWorks = $result->num_rows > 0;
$stmt->close();

if (!$loginWorks) {
    $problems[] = "Login admin@sistema.com/123456 não funciona";
}

if (!file_exists(__DIR__ . '/.htaccess')) {
    $problems[] = ".htaccess não encontrado";
}

if (!file_exists(__DIR__ . '/api.php')) {
    $problems[] = "api.php não encontrado";
}

if (count($problems) === 0) {
    echo "<p class='ok' style='font-size: 24px;'>✅ ✅ ✅ TUDO OK! SISTEMA PRONTO! ✅ ✅ ✅</p>";
    echo "<h3>🎯 Próximos passos:</h3>";
    echo "<ol>";
    echo "<li>Acesse o sistema: <a href='/' style='color: #0ff;'>" . $_SERVER['HTTP_HOST'] . "</a></li>";
    echo "<li>Faça login com: admin@sistema.com / 123456</li>";
    echo "<li>🔒 IMPORTANTE: Remova este arquivo (super-diagnostico.php) do servidor!</li>";
    echo "</ol>";
} else {
    echo "<p class='fail' style='font-size: 20px;'>❌ PROBLEMAS ENCONTRADOS:</p>";
    echo "<ul>";
    foreach ($problems as $problem) {
        echo "<li class='fail'>❌ {$problem}</li>";
    }
    echo "</ul>";
    
    echo "<h3>💡 Soluções:</h3>";
    echo "<ol>";
    foreach ($problems as $problem) {
        if (strpos($problem, 'tabela') !== false) {
            echo "<li>Execute schema.sql completo no phpMyAdmin</li>";
        } elseif (strpos($problem, 'usuário') !== false) {
            echo "<li>Execute a parte de INSERT do schema.sql</li>";
        } elseif (strpos($problem, 'Login') !== false) {
            echo "<li>Verifique a seção 5️⃣ e 6️⃣ acima para ver o problema exato</li>";
        } elseif (strpos($problem, 'htaccess') !== false) {
            echo "<li>Re-envie o arquivo .htaccess (arquivo oculto!)</li>";
        } elseif (strpos($problem, 'api.php') !== false) {
            echo "<li>Re-envie o arquivo api.php</li>";
        }
    }
    echo "</ol>";
}

$conn->close();
?>

<hr>
<p style="color: #888; font-size: 12px;">
    Diagnóstico executado em: <?php echo date('Y-m-d H:i:s'); ?><br>
    Versão: 2.0
</p>

</body>
</html>
