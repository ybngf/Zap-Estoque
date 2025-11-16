<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== VERIFICAÇÃO SIMPLES ===\n\n";

// Incluir config
echo "1. Carregando config.php...\n";
if (!file_exists('config.php')) {
    echo "ERRO: config.php não encontrado!\n";
    exit;
}

include 'config.php';
echo "   ✓ Config carregado\n\n";

// Testar conexão
echo "2. Testando conexão...\n";
if (!isset($conn)) {
    echo "ERRO: Variável \$conn não existe!\n";
    exit;
}

if ($conn->connect_error) {
    echo "ERRO de conexão: " . $conn->connect_error . "\n";
    exit;
}
echo "   ✓ Conexão OK\n\n";

// Query simples
echo "3. Consultando configurações...\n";
$sql = "SELECT company_id, setting_key, setting_value FROM company_settings WHERE setting_key LIKE 'report%' ORDER BY company_id";
echo "   Query: $sql\n";

$result = $conn->query($sql);

if (!$result) {
    echo "ERRO na query: " . $conn->error . "\n";
    exit;
}

echo "   ✓ Query executada\n";
echo "   Resultados: " . $result->num_rows . " linhas\n\n";

if ($result->num_rows === 0) {
    echo "⚠️  NENHUMA configuração encontrada!\n\n";
    
    // Verificar se a tabela existe
    echo "4. Verificando se tabela existe...\n";
    $result2 = $conn->query("SHOW TABLES LIKE 'company_settings'");
    if ($result2->num_rows === 0) {
        echo "   ✗ Tabela company_settings NÃO EXISTE!\n";
    } else {
        echo "   ✓ Tabela existe\n";
        
        // Contar total de registros
        $result3 = $conn->query("SELECT COUNT(*) as total FROM company_settings");
        $row3 = $result3->fetch_assoc();
        echo "   Total de registros na tabela: " . $row3['total'] . "\n";
    }
} else {
    echo "4. Exibindo configurações:\n\n";
    while ($row = $result->fetch_assoc()) {
        $marker = ($row['setting_value'] === '1') ? '✓' : '✗';
        echo "Empresa {$row['company_id']}: {$row['setting_key']} = '{$row['setting_value']}' $marker\n";
    }
}

echo "\n=== FIM ===\n";
