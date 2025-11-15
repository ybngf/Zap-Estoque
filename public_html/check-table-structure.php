<?php
require_once 'config.php';

$result = $conn->query('DESCRIBE companies');
echo "Companies table structure:\n";
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    echo "{$row['Field']}: {$row['Type']} {$row['Key']} {$row['Extra']}\n";
}

echo "\n\nChecking company_settings if exists:\n";
$result = $conn->query("SHOW TABLES LIKE 'company_settings'");
if ($result->rowCount() > 0) {
    $result = $conn->query('DESCRIBE company_settings');
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        echo "{$row['Field']}: {$row['Type']} {$row['Key']} {$row['Extra']}\n";
    }
}
?>
