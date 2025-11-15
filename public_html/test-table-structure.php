<?php
header('Content-Type: text/plain; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

echo "=== ESTRUTURA DA TABELA stock_movements ===\n\n";

// Show table structure
$result = $conn->query("DESCRIBE stock_movements");

if ($result) {
    echo "Colunas da tabela:\n";
    echo str_pad("Campo", 20) . str_pad("Tipo", 20) . str_pad("Null", 10) . str_pad("Key", 10) . "Extra\n";
    echo str_repeat("-", 80) . "\n";
    
    while ($row = $result->fetch_assoc()) {
        echo str_pad($row['Field'], 20) . 
             str_pad($row['Type'], 20) . 
             str_pad($row['Null'], 10) . 
             str_pad($row['Key'], 10) . 
             $row['Extra'] . "\n";
    }
} else {
    echo "ERRO ao buscar estrutura: " . $conn->error . "\n";
}

echo "\n=== VERIFICAR CONSTRAINTS ===\n\n";

// Check foreign keys
$result = $conn->query("
    SELECT 
        CONSTRAINT_NAME, 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'stock_movements' 
    AND TABLE_SCHEMA = '" . DB_NAME . "' 
    AND REFERENCED_TABLE_NAME IS NOT NULL
");

if ($result && $result->num_rows > 0) {
    echo "Foreign Keys encontradas:\n";
    while ($row = $result->fetch_assoc()) {
        echo "- {$row['COLUMN_NAME']} → {$row['REFERENCED_TABLE_NAME']}.{$row['REFERENCED_COLUMN_NAME']}\n";
    }
} else {
    echo "Nenhuma foreign key encontrada (ou erro: " . $conn->error . ")\n";
}

echo "\n=== VERIFICAR DADOS EXISTENTES ===\n\n";

// Count rows
$result = $conn->query("SELECT COUNT(*) as total FROM stock_movements");
$total = $result->fetch_assoc()['total'];
echo "Total de registros: $total\n\n";

if ($total > 0) {
    echo "Últimas 3 movimentações:\n";
    $result = $conn->query("SELECT * FROM stock_movements ORDER BY id DESC LIMIT 3");
    while ($row = $result->fetch_assoc()) {
        echo "\nID: {$row['id']}\n";
        echo "  product_id: {$row['product_id']}\n";
        echo "  user_id: {$row['user_id']}\n";
        echo "  type: {$row['type']}\n";
        echo "  quantity: {$row['quantity']}\n";
        echo "  reason: {$row['reason']}\n";
        echo "  date: {$row['date']}\n";
    }
}

$conn->close();
?>