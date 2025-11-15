<?php
header('Content-Type: text/plain; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

echo "=== VERIFICAR TIPO DA COLUNA 'type' ===\n\n";

// Get detailed column info
$result = $conn->query("SHOW COLUMNS FROM stock_movements LIKE 'type'");

if ($result && $result->num_rows > 0) {
    $column = $result->fetch_assoc();
    echo "Campo: " . $column['Field'] . "\n";
    echo "Tipo: " . $column['Type'] . "\n";
    echo "Null: " . $column['Null'] . "\n";
    echo "Default: " . ($column['Default'] ?? 'NULL') . "\n\n";
    
    // If it's an ENUM, show allowed values
    if (strpos($column['Type'], 'enum') !== false) {
        echo "⚠️ COLUNA É ENUM!\n";
        echo "Valores permitidos: " . $column['Type'] . "\n\n";
        
        // Extract enum values
        preg_match("/^enum\((.+)\)$/", $column['Type'], $matches);
        if (isset($matches[1])) {
            $values = str_getcsv($matches[1], ',', "'");
            echo "Valores aceitos:\n";
            foreach ($values as $value) {
                echo "  - '$value'\n";
            }
        }
    }
} else {
    echo "ERRO: Coluna 'type' não encontrada!\n";
}

echo "\n=== VERIFICAR MOVIMENTAÇÕES EXISTENTES ===\n\n";

// Check existing values
$result = $conn->query("SELECT DISTINCT type FROM stock_movements LIMIT 10");
if ($result && $result->num_rows > 0) {
    echo "Valores de 'type' já usados no banco:\n";
    while ($row = $result->fetch_assoc()) {
        echo "  - '" . $row['type'] . "'\n";
    }
} else {
    echo "Nenhuma movimentação encontrada (ou erro: " . $conn->error . ")\n";
}

$conn->close();
?>