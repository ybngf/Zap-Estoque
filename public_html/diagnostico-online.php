<?php
/**
 * Diagnóstico Completo - Estoque Gemini Online
 * Acesse: www.donasalada.com/EstoqueGemini/diagnostico-online.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html>
<html lang='pt-BR'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Diagnóstico - Estoque Gemini</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h1 { color: #2c3e50; }
        h2 { 
            color: #34495e; 
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .success { 
            background: #d4edda; 
            border-left: 4px solid #28a745;
            padding: 10px;
            margin: 10px 0;
        }
        .error { 
            background: #f8d7da; 
            border-left: 4px solid #dc3545;
            padding: 10px;
            margin: 10px 0;
        }
        .warning { 
            background: #fff3cd; 
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 10px 0;
        }
        .info { 
            background: #d1ecf1; 
            border-left: 4px solid #17a2b8;
            padding: 10px;
            margin: 10px 0;
        }
        pre {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #3498db;
            color: white;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 5px;
        }
        .btn:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>";

echo "<h1>🔍 Diagnóstico Completo - Estoque Gemini</h1>";
echo "<p><strong>Data/Hora:</strong> " . date('d/m/Y H:i:s') . "</p>";

// ==========================================
// 1. INFORMAÇÕES DO SERVIDOR
// ==========================================
echo "<div class='container'>";
echo "<h2>📊 1. Informações do Servidor</h2>";
echo "<table>";
echo "<tr><th>Item</th><th>Valor</th></tr>";
echo "<tr><td>Sistema Operacional</td><td>" . PHP_OS . "</td></tr>";
echo "<tr><td>Versão PHP</td><td>" . PHP_VERSION . "</td></tr>";
echo "<tr><td>Servidor Web</td><td>" . $_SERVER['SERVER_SOFTWARE'] . "</td></tr>";
echo "<tr><td>Documento Root</td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td></tr>";
echo "<tr><td>Script Atual</td><td>" . __FILE__ . "</td></tr>";
echo "<tr><td>URL Atual</td><td>" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] . "</td></tr>";
echo "</table>";
echo "</div>";

// ==========================================
// 2. CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
echo "<div class='container'>";
echo "<h2>🔧 2. Configuração do Banco de Dados</h2>";

// Tentar carregar config.php
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    echo "<div class='success'>✅ Arquivo config.php encontrado</div>";
    require_once $configFile;
    
    echo "<table>";
    echo "<tr><th>Parâmetro</th><th>Valor</th></tr>";
    echo "<tr><td>DB_HOST</td><td>" . (defined('DB_HOST') ? DB_HOST : '<span style="color:red">NÃO DEFINIDO</span>') . "</td></tr>";
    echo "<tr><td>DB_USER</td><td>" . (defined('DB_USER') ? DB_USER : '<span style="color:red">NÃO DEFINIDO</span>') . "</td></tr>";
    echo "<tr><td>DB_PASS</td><td>" . (defined('DB_PASS') ? (DB_PASS ? '****** (' . strlen(DB_PASS) . ' caracteres)' : '<span style="color:orange">VAZIO</span>') : '<span style="color:red">NÃO DEFINIDO</span>') . "</td></tr>";
    echo "<tr><td>DB_NAME</td><td>" . (defined('DB_NAME') ? DB_NAME : '<span style="color:red">NÃO DEFINIDO</span>') . "</td></tr>";
    echo "</table>";
} else {
    echo "<div class='error'>❌ Arquivo config.php NÃO encontrado em: " . $configFile . "</div>";
    echo "<div class='warning'>⚠️ Usando configurações padrão do api.php</div>";
    
    // Tentar pegar do api.php
    $apiFile = __DIR__ . '/api.php';
    if (file_exists($apiFile)) {
        $apiContent = file_get_contents($apiFile);
        preg_match("/define\('DB_HOST',\s*'([^']+)'\)/", $apiContent, $host);
        preg_match("/define\('DB_USER',\s*'([^']+)'\)/", $apiContent, $user);
        preg_match("/define\('DB_NAME',\s*'([^']+)'\)/", $apiContent, $name);
        
        define('DB_HOST', $host[1] ?? 'localhost');
        define('DB_USER', $user[1] ?? 'root');
        define('DB_PASS', '');
        define('DB_NAME', $name[1] ?? 'dona_estoqueg');
        
        echo "<table>";
        echo "<tr><th>Parâmetro</th><th>Valor (do api.php)</th></tr>";
        echo "<tr><td>DB_HOST</td><td>" . DB_HOST . "</td></tr>";
        echo "<tr><td>DB_USER</td><td>" . DB_USER . "</td></tr>";
        echo "<tr><td>DB_NAME</td><td>" . DB_NAME . "</td></tr>";
        echo "</table>";
    }
}
echo "</div>";

// ==========================================
// 3. TESTE DE CONEXÃO COM BANCO
// ==========================================
echo "<div class='container'>";
echo "<h2>🔌 3. Teste de Conexão com Banco de Dados</h2>";

$conn = null;
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        echo "<div class='error'>";
        echo "<strong>❌ ERRO na conexão:</strong><br>";
        echo "Código: " . $conn->connect_errno . "<br>";
        echo "Mensagem: " . $conn->connect_error;
        echo "</div>";
        
        echo "<div class='info'>";
        echo "<strong>💡 Possíveis soluções:</strong><br>";
        echo "1. Verifique se o MySQL está rodando no cPanel<br>";
        echo "2. Confirme o usuário: geralmente é <code>cpanel_user_dbuser</code><br>";
        echo "3. Confirme o nome do banco: geralmente é <code>cpanel_user_dbname</code><br>";
        echo "4. Verifique a senha do banco no cPanel > MySQL Databases<br>";
        echo "5. Certifique-se que o usuário tem permissão no banco<br>";
        echo "</div>";
    } else {
        echo "<div class='success'>";
        echo "✅ <strong>Conexão com MySQL bem-sucedida!</strong><br>";
        echo "Versão do MySQL: " . $conn->server_info . "<br>";
        echo "Charset: " . $conn->character_set_name();
        echo "</div>";
        
        // Testar se o banco existe
        $result = $conn->query("SELECT DATABASE()");
        if ($result) {
            $row = $result->fetch_row();
            echo "<div class='success'>✅ Banco de dados conectado: <strong>" . $row[0] . "</strong></div>";
        }
    }
} catch (Exception $e) {
    echo "<div class='error'>";
    echo "<strong>❌ EXCEÇÃO ao conectar:</strong><br>";
    echo $e->getMessage();
    echo "</div>";
}
echo "</div>";

// ==========================================
// 4. VERIFICAR TABELAS DO BANCO
// ==========================================
if ($conn && !$conn->connect_error) {
    echo "<div class='container'>";
    echo "<h2>📋 4. Tabelas do Banco de Dados</h2>";
    
    $result = $conn->query("SHOW TABLES");
    
    if ($result && $result->num_rows > 0) {
        echo "<div class='success'>✅ Encontradas " . $result->num_rows . " tabelas</div>";
        echo "<table>";
        echo "<tr><th>#</th><th>Nome da Tabela</th><th>Registros</th></tr>";
        
        $i = 1;
        while ($row = $result->fetch_row()) {
            $tableName = $row[0];
            $count = $conn->query("SELECT COUNT(*) as total FROM `$tableName`");
            $countRow = $count->fetch_assoc();
            
            echo "<tr>";
            echo "<td>" . $i++ . "</td>";
            echo "<td><strong>" . $tableName . "</strong></td>";
            echo "<td>" . number_format($countRow['total']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<div class='error'>❌ Nenhuma tabela encontrada no banco de dados!</div>";
        echo "<div class='warning'>⚠️ Você precisa importar o banco de dados primeiro.</div>";
    }
    echo "</div>";
    
    // ==========================================
    // 5. VERIFICAR TABELA DE USUÁRIOS
    // ==========================================
    echo "<div class='container'>";
    echo "<h2>👥 5. Verificação da Tabela 'users'</h2>";
    
    $tableExists = $conn->query("SHOW TABLES LIKE 'users'");
    
    if ($tableExists && $tableExists->num_rows > 0) {
        echo "<div class='success'>✅ Tabela 'users' existe</div>";
        
        // Estrutura da tabela
        echo "<h3>Estrutura da Tabela:</h3>";
        $structure = $conn->query("DESCRIBE users");
        if ($structure) {
            echo "<table>";
            echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Chave</th><th>Padrão</th></tr>";
            while ($row = $structure->fetch_assoc()) {
                echo "<tr>";
                echo "<td><strong>" . $row['Field'] . "</strong></td>";
                echo "<td>" . $row['Type'] . "</td>";
                echo "<td>" . $row['Null'] . "</td>";
                echo "<td>" . $row['Key'] . "</td>";
                echo "<td>" . ($row['Default'] ?? 'NULL') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
        // Usuários cadastrados
        echo "<h3>Usuários Cadastrados:</h3>";
        $users = $conn->query("SELECT id, name, email, role, company_id, active FROM users ORDER BY id");
        
        if ($users && $users->num_rows > 0) {
            echo "<div class='success'>✅ Encontrados " . $users->num_rows . " usuários</div>";
            echo "<table>";
            echo "<tr><th>ID</th><th>Nome</th><th>Email</th><th>Role</th><th>Empresa</th><th>Ativo</th></tr>";
            
            while ($row = $users->fetch_assoc()) {
                $activeStatus = $row['active'] ? '✅ Sim' : '❌ Não';
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . $row['name'] . "</td>";
                echo "<td>" . $row['email'] . "</td>";
                echo "<td>" . $row['role'] . "</td>";
                echo "<td>" . $row['company_id'] . "</td>";
                echo "<td>" . $activeStatus . "</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            // Testar senha do primeiro usuário admin
            echo "<h3>🔐 Teste de Senha (Primeiro Admin):</h3>";
            $adminUser = $conn->query("SELECT id, email, password FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
            
            if ($adminUser && $adminUser->num_rows > 0) {
                $admin = $adminUser->fetch_assoc();
                echo "<div class='info'>";
                echo "<strong>Email:</strong> " . $admin['email'] . "<br>";
                echo "<strong>Hash da senha (primeiros 30 chars):</strong> " . substr($admin['password'], 0, 30) . "...<br>";
                echo "<strong>Comprimento do hash:</strong> " . strlen($admin['password']) . " caracteres<br>";
                
                // Verificar se é bcrypt
                if (substr($admin['password'], 0, 4) === '$2y$' || substr($admin['password'], 0, 4) === '$2a$') {
                    echo "<div class='success'>✅ Hash é bcrypt (formato correto)</div>";
                } else {
                    echo "<div class='error'>❌ Hash NÃO é bcrypt! Formato: " . substr($admin['password'], 0, 10) . "</div>";
                }
                
                // Testar senha padrão
                $testPasswords = ['123456', 'admin123', 'admin', 'senha123'];
                echo "<br><strong>Testando senhas comuns:</strong><br>";
                foreach ($testPasswords as $testPass) {
                    $match = password_verify($testPass, $admin['password']);
                    if ($match) {
                        echo "<div class='success'>✅ Senha '<strong>" . $testPass . "</strong>' funciona!</div>";
                    } else {
                        echo "<div class='warning'>❌ Senha '" . $testPass . "' não funciona</div>";
                    }
                }
                echo "</div>";
            }
            
        } else {
            echo "<div class='error'>❌ Nenhum usuário encontrado na tabela!</div>";
            echo "<div class='warning'>⚠️ Você precisa criar pelo menos um usuário admin.</div>";
        }
        
    } else {
        echo "<div class='error'>❌ Tabela 'users' NÃO existe!</div>";
        echo "<div class='warning'>⚠️ O banco de dados não foi importado corretamente.</div>";
    }
    echo "</div>";
    
    // ==========================================
    // 6. TESTE DE LOGIN VIA API
    // ==========================================
    echo "<div class='container'>";
    echo "<h2>🔐 6. Teste de Login via API</h2>";
    
    echo "<div class='info'>";
    echo "<p><strong>URL da API:</strong> " . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/api.php</p>";
    echo "</div>";
    
    // Pegar primeiro admin para teste
    $adminTest = $conn->query("SELECT email FROM users WHERE role = 'admin' AND active = 1 ORDER BY id LIMIT 1");
    if ($adminTest && $adminTest->num_rows > 0) {
        $adminEmail = $adminTest->fetch_assoc()['email'];
        
        echo "<div class='warning'>";
        echo "<strong>⚠️ Para testar o login:</strong><br>";
        echo "1. Abra o console do navegador (F12)<br>";
        echo "2. Cole e execute este código:<br><br>";
        echo "<pre>";
        echo "fetch('" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/api.php/auth/login', {\n";
        echo "  method: 'POST',\n";
        echo "  headers: { 'Content-Type': 'application/json' },\n";
        echo "  body: JSON.stringify({\n";
        echo "    email: '" . $adminEmail . "',\n";
        echo "    password: '123456'\n";
        echo "  })\n";
        echo "})\n";
        echo ".then(r => r.json())\n";
        echo ".then(d => console.log(d));\n";
        echo "</pre>";
        echo "</div>";
    }
    
    echo "</div>";
    
    // ==========================================
    // 7. VERIFICAR ARQUIVO .HTACCESS
    // ==========================================
    echo "<div class='container'>";
    echo "<h2>⚙️ 7. Arquivo .htaccess</h2>";
    
    $htaccessFile = __DIR__ . '/.htaccess';
    if (file_exists($htaccessFile)) {
        echo "<div class='success'>✅ Arquivo .htaccess existe</div>";
        echo "<h3>Conteúdo:</h3>";
        echo "<pre>" . htmlspecialchars(file_get_contents($htaccessFile)) . "</pre>";
    } else {
        echo "<div class='warning'>⚠️ Arquivo .htaccess NÃO encontrado</div>";
        echo "<div class='info'>Isso pode afetar o roteamento da API</div>";
    }
    echo "</div>";
}

// ==========================================
// 8. RECOMENDAÇÕES
// ==========================================
echo "<div class='container'>";
echo "<h2>💡 8. Recomendações e Próximos Passos</h2>";

echo "<div class='info'>";
echo "<h3>✅ Checklist de Deploy:</h3>";
echo "<ol>";
echo "<li>✓ Copiar pasta public_html para o servidor</li>";
echo "<li>✓ Configurar config.php com dados do MySQL do cPanel</li>";
echo "<li>✓ Importar banco de dados via phpMyAdmin</li>";
echo "<li>✓ Verificar se usuários foram importados</li>";
echo "<li>✓ Testar conexão com banco (este diagnóstico)</li>";
echo "<li>✓ Testar login via API</li>";
echo "<li>✓ Acessar aplicação frontend</li>";
echo "</ol>";
echo "</div>";

echo "<div class='warning'>";
echo "<h3>⚠️ Problemas Comuns:</h3>";
echo "<ul>";
echo "<li><strong>Erro de conexão MySQL:</strong> Verifique usuário/senha no cPanel</li>";
echo "<li><strong>Tabelas não existem:</strong> Re-importe o banco de dados</li>";
echo "<li><strong>Login não funciona:</strong> Verifique hash das senhas</li>";
echo "<li><strong>CORS Error:</strong> Verifique headers no api.php</li>";
echo "<li><strong>404 na API:</strong> Verifique .htaccess ou use ?path=</li>";
echo "</ul>";
echo "</div>";

echo "</div>";

// Fechar conexão
if ($conn && !$conn->connect_error) {
    $conn->close();
}

echo "<div style='text-align: center; margin-top: 20px;'>";
echo "<a href='?' class='btn'>🔄 Recarregar Diagnóstico</a>";
echo "<a href='index.html' class='btn'>🏠 Ir para Aplicação</a>";
echo "</div>";

echo "</body></html>";
?>
