<?php
require_once 'config.php';

echo "=== DEBUG: Configurações de Relatórios ===\n\n";

$sql = "SELECT company_id, setting_key, setting_value 
        FROM company_settings 
        WHERE setting_key LIKE 'report_%' 
        ORDER BY company_id, setting_key";

$result = $conn->query($sql);

if (!$result) {
    echo "ERRO: " . $conn->error . "\n";
    exit;
}

echo "Total de configurações encontradas: " . $result->num_rows . "\n\n";

$currentCompany = null;
while ($row = $result->fetch_assoc()) {
    if ($currentCompany !== $row['company_id']) {
        if ($currentCompany !== null) echo "\n";
        echo "=== Empresa ID: " . $row['company_id'] . " ===\n";
        $currentCompany = $row['company_id'];
    }
    
    echo "  " . $row['setting_key'] . " = '" . $row['setting_value'] . "'\n";
}

echo "\n=== Teste de Comparação ===\n";
$testValue = '1';
echo "Teste: '1' == '1' ? " . ('1' == '1' ? 'SIM' : 'NÃO') . "\n";
echo "Teste: 'true' == '1' ? " . ('true' == '1' ? 'SIM' : 'NÃO') . "\n";
echo "Teste: 'on' == '1' ? " . ('on' == '1' ? 'SIM' : 'NÃO') . "\n";
