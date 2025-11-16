<?php
require_once 'config.php';

echo "=== TESTE: Salvamento de Configurações ===\n\n";

// Simular um usuário Admin da empresa 2 (Dona Salada)
$companyId = 2;
$userId = 1; // Ajuste para um user_id válido da empresa 2

echo "1. Verificando usuário...\n";
$stmt = $conn->prepare("SELECT id, name, role, company_id FROM users WHERE company_id = ? AND role IN ('Admin', 'Super Admin') LIMIT 1");
$stmt->bind_param("i", $companyId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo "ERRO: Nenhum usuário Admin encontrado para empresa $companyId\n";
    echo "Tentando buscar qualquer usuário...\n";
    
    $stmt = $conn->prepare("SELECT id, name, role, company_id FROM users WHERE company_id = ? LIMIT 1");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    if (!$user) {
        echo "ERRO: Nenhum usuário encontrado para empresa $companyId\n";
        exit;
    }
}

echo "  ✓ Usuário: {$user['name']} (ID: {$user['id']}, Role: {$user['role']})\n\n";

$userId = $user['id'];

// Teste de INSERT
echo "2. Testando INSERT de nova configuração...\n";
$testKey = 'report_email_enabled';
$testValue = '1';

$stmt = $conn->prepare("INSERT INTO company_settings (company_id, setting_key, setting_value, updated_by) VALUES (?, ?, ?, ?)");
$stmt->bind_param("issi", $companyId, $testKey, $testValue, $userId);

if ($stmt->execute()) {
    echo "  ✓ INSERT com sucesso! ID: " . $stmt->insert_id . "\n";
} else {
    echo "  ✗ ERRO no INSERT: " . $stmt->error . "\n";
}
$stmt->close();

// Verificar se foi salvo
echo "\n3. Verificando se foi salvo...\n";
$stmt = $conn->prepare("SELECT * FROM company_settings WHERE company_id = ? AND setting_key = ?");
$stmt->bind_param("is", $companyId, $testKey);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "  ✓ Configuração encontrada:\n";
    echo "    - ID: {$row['id']}\n";
    echo "    - Company ID: {$row['company_id']}\n";
    echo "    - Key: {$row['setting_key']}\n";
    echo "    - Value: '{$row['setting_value']}'\n";
    echo "    - Updated by: {$row['updated_by']}\n";
} else {
    echo "  ✗ Configuração NÃO encontrada!\n";
}
$stmt->close();

// Teste de UPDATE
echo "\n4. Testando UPDATE da configuração...\n";
$newValue = '0';
$stmt = $conn->prepare("UPDATE company_settings SET setting_value = ? WHERE company_id = ? AND setting_key = ?");
$stmt->bind_param("sis", $newValue, $companyId, $testKey);

if ($stmt->execute()) {
    echo "  ✓ UPDATE com sucesso! Linhas afetadas: " . $stmt->affected_rows . "\n";
} else {
    echo "  ✗ ERRO no UPDATE: " . $stmt->error . "\n";
}
$stmt->close();

// Verificar UPDATE
echo "\n5. Verificando valor após UPDATE...\n";
$stmt = $conn->prepare("SELECT setting_value FROM company_settings WHERE company_id = ? AND setting_key = ?");
$stmt->bind_param("is", $companyId, $testKey);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
echo "  Valor atual: '{$row['setting_value']}'\n";
$stmt->close();

// Limpar teste
echo "\n6. Limpando dados de teste...\n";
$stmt = $conn->prepare("DELETE FROM company_settings WHERE company_id = ? AND setting_key = ?");
$stmt->bind_param("is", $companyId, $testKey);
$stmt->execute();
echo "  ✓ Teste concluído e dados removidos.\n";
$stmt->close();

echo "\n=== ESTRUTURA DA TABELA ===\n";
$result = $conn->query("DESCRIBE company_settings");
while ($row = $result->fetch_assoc()) {
    echo "{$row['Field']} - {$row['Type']} - {$row['Null']} - {$row['Key']} - {$row['Default']}\n";
}
