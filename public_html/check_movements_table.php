<?php
include 'config.php';

echo "=== ESTRUTURA DA TABELA STOCK_MOVEMENTS ===\n\n";

$result = $conn->query("DESCRIBE stock_movements");

if (!$result) {
    echo "ERRO: " . $conn->error . "\n";
    exit;
}

echo "Colunas encontradas:\n";
while ($row = $result->fetch_assoc()) {
    echo "  {$row['Field']} ({$row['Type']})\n";
}
