<?php
include 'config.php';

echo "=== TODAS AS CONFIGURAÇÕES ===\n\n";

$sql = "SELECT company_id, setting_key, setting_value FROM company_settings ORDER BY company_id, setting_key";
$result = $conn->query($sql);

echo "Total: " . $result->num_rows . " configurações\n\n";

$currentCompany = null;
while ($row = $result->fetch_assoc()) {
    if ($currentCompany !== $row['company_id']) {
        if ($currentCompany !== null) echo "\n";
        echo "=== Empresa ID: {$row['company_id']} ===\n";
        $currentCompany = $row['company_id'];
    }
    echo "  {$row['setting_key']} = '{$row['setting_value']}'\n";
}
