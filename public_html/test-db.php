<?php
/**
 * Script de teste para verificar conexão e dados do banco
 * Works in subdirectories
 */

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'dona_estoqueg');
define('DB_PASS', 'nYW0bHpnYW0bHp');
define('DB_NAME', 'dona_estoqueg');

$result = [
    'connection' => false,
    'tables' => [],
    'users' => [],
    'error' => null
];

try {
    // Test connection
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception('Connection failed: ' . $conn->connect_error);
    }
    
    $result['connection'] = true;
    $conn->set_charset('utf8mb4');
    
    // Check tables
    $tables_query = $conn->query("SHOW TABLES");
    while ($row = $tables_query->fetch_array()) {
        $result['tables'][] = $row[0];
    }
    
    // Check users (if table exists)
    if (in_array('users', $result['tables'])) {
        $users_query = $conn->query("SELECT id, name, email, role, company FROM users");
        if ($users_query) {
            while ($row = $users_query->fetch_assoc()) {
                $result['users'][] = $row;
            }
        }
    }
    
    // Test login with default credentials
    if (in_array('users', $result['tables'])) {
        $test_email = 'admin@sistema.com';
        $test_pass = '123456';
        
        $stmt = $conn->prepare("SELECT id, name, email FROM users WHERE email = ? AND password = ?");
        $stmt->bind_param("ss", $test_email, $test_pass);
        $stmt->execute();
        $login_result = $stmt->get_result();
        
        if ($row = $login_result->fetch_assoc()) {
            $result['test_login'] = [
                'success' => true,
                'user' => $row
            ];
        } else {
            $result['test_login'] = [
                'success' => false,
                'message' => 'Usuário admin@sistema.com não encontrado ou senha incorreta'
            ];
        }
        $stmt->close();
    }
    
    $conn->close();
    
} catch (Exception $e) {
    $result['error'] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
