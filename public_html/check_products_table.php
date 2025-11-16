<?php
include 'config.php';

echo "=== ESTRUTURA DA TABELA PRODUCTS ===\n\n";

$result = $conn->query("DESCRIBE products");

if (!$result) {
    echo "ERRO: " . $conn->error . "\n";
    exit;
}

echo "Colunas encontradas:\n";
while ($row = $result->fetch_assoc()) {
    $marker = (strpos($row['Field'], 'stock') !== false) ? ' ← ESTOQUE' : '';
    echo "  {$row['Field']} ({$row['Type']})$marker\n";
}
