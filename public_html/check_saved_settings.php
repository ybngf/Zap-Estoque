<?php
require_once 'config.php';

echo "=== VERIFICANDO CONFIGURAÇÕES SALVAS ===\n\n";

// Buscar TODAS as configurações de relatórios
$sql = "SELECT cs.company_id, c.name as company_name, cs.setting_key, cs.setting_value, cs.updated_at
        FROM company_settings cs
        LEFT JOIN companies c ON c.id = cs.company_id
        WHERE cs.setting_key LIKE 'report_%'
        ORDER BY cs.company_id, cs.setting_key";

$result = $conn->query($sql);

if (!$result) {
    echo "ERRO na query: " . $conn->error . "\n";
    exit;
}

echo "Total de configurações encontradas: " . $result->num_rows . "\n\n";

if ($result->num_rows === 0) {
    echo "⚠️  NENHUMA configuração de relatório encontrada!\n";
    echo "\nTentando buscar QUALQUER configuração:\n";
    
    $sql2 = "SELECT company_id, setting_key, setting_value FROM company_settings LIMIT 10";
    $result2 = $conn->query($sql2);
    
    if ($result2->num_rows > 0) {
        while ($row = $result2->fetch_assoc()) {
            echo "  Empresa {$row['company_id']}: {$row['setting_key']} = '{$row['setting_value']}'\n";
        }
    } else {
        echo "  Tabela company_settings está completamente VAZIA!\n";
    }
} else {
    $currentCompany = null;
    
    while ($row = $result->fetch_assoc()) {
        if ($currentCompany !== $row['company_id']) {
            if ($currentCompany !== null) echo "\n";
            echo "=== Empresa: {$row['company_name']} (ID: {$row['company_id']}) ===\n";
            $currentCompany = $row['company_id'];
        }
        
        $value = $row['setting_value'];
        $display = $value;
        
        // Colorir valores importantes
        if ($row['setting_key'] === 'report_email_enabled' || $row['setting_key'] === 'report_whatsapp_enabled') {
            $display = ($value === '1') ? '1 ✓ (HABILITADO)' : '0 (DESABILITADO)';
        }
        
        echo "  {$row['setting_key']} = '{$display}'";
        if ($row['updated_at']) {
            echo " (atualizado em: {$row['updated_at']})";
        }
        echo "\n";
    }
}

echo "\n=== RESUMO POR EMPRESA ===\n";
$sql3 = "SELECT 
    cs.company_id,
    c.name as company_name,
    SUM(CASE WHEN cs.setting_key = 'report_email_enabled' AND cs.setting_value = '1' THEN 1 ELSE 0 END) as email_enabled,
    SUM(CASE WHEN cs.setting_key = 'report_whatsapp_enabled' AND cs.setting_value = '1' THEN 1 ELSE 0 END) as whatsapp_enabled,
    MAX(CASE WHEN cs.setting_key = 'report_email_address' THEN cs.setting_value END) as email_address,
    MAX(CASE WHEN cs.setting_key = 'report_whatsapp_number' THEN cs.setting_value END) as whatsapp_number
FROM company_settings cs
LEFT JOIN companies c ON c.id = cs.company_id
WHERE cs.setting_key LIKE 'report_%'
GROUP BY cs.company_id, c.name";

$result3 = $conn->query($sql3);

if ($result3 && $result3->num_rows > 0) {
    while ($row = $result3->fetch_assoc()) {
        echo "\nEmpresa: {$row['company_name']} (ID: {$row['company_id']})\n";
        echo "  📧 Email: " . ($row['email_enabled'] ? "HABILITADO" : "desabilitado");
        if ($row['email_address']) echo " → {$row['email_address']}";
        echo "\n";
        echo "  📱 WhatsApp: " . ($row['whatsapp_enabled'] ? "HABILITADO" : "desabilitado");
        if ($row['whatsapp_number']) echo " → {$row['whatsapp_number']}";
        echo "\n";
    }
} else {
    echo "\nNenhum resumo disponível.\n";
}
