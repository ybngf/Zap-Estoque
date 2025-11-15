<?php
/**
 * Script para corrigir estoques que foram subtraídos indevidamente
 * Recalcula o estoque baseado nas movimentações
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("❌ Erro de conexão: " . $conn->connect_error . "\n");
}

echo "✅ Conectado ao banco de dados...\n\n";

echo "=== Análise de Produtos com Estoque Incorreto ===\n\n";

// Buscar todos os produtos
$result = $conn->query("SELECT id, name, stock FROM products");
$productsToFix = [];
$totalFixed = 0;

while ($product = $result->fetch_assoc()) {
    $productId = $product['id'];
    $currentStock = $product['stock'];
    
    // Calcular estoque correto baseado nas movimentações
    $movements = $conn->query("
        SELECT type, quantity 
        FROM stock_movements 
        WHERE product_id = $productId
        ORDER BY date ASC
    ");
    
    $calculatedStock = 0;
    $movementCount = 0;
    
    while ($movement = $movements->fetch_assoc()) {
        $movementCount++;
        $type = $movement['type'];
        $quantity = $movement['quantity'];
        
        // Entrada: adiciona
        if ($type === 'in' || $type === 'Entrada' || strtolower($type) === 'entrada') {
            $calculatedStock += $quantity;
        }
        // Saída: subtrai
        else if ($type === 'out' || $type === 'Saída' || strtolower($type) === 'saída') {
            $calculatedStock -= $quantity;
        }
        // Ajuste: define o valor
        else if ($type === 'adjustment' || $type === 'Ajuste' || strtolower($type) === 'ajuste') {
            $calculatedStock = $quantity;
        }
    }
    
    // Se há movimentações e o estoque está diferente
    if ($movementCount > 0 && $currentStock != $calculatedStock) {
        $productsToFix[] = [
            'id' => $productId,
            'name' => $product['name'],
            'current' => $currentStock,
            'correct' => $calculatedStock,
            'diff' => $calculatedStock - $currentStock,
            'movements' => $movementCount
        ];
    }
}

if (empty($productsToFix)) {
    echo "✅ Nenhum produto com estoque incorreto encontrado!\n";
    echo "Todos os estoques estão corretos.\n";
    exit(0);
}

echo "📊 Produtos com estoque incorreto:\n\n";
echo str_pad("ID", 5) . " | " . str_pad("Produto", 30) . " | " . str_pad("Atual", 10) . " | " . str_pad("Correto", 10) . " | " . str_pad("Diferença", 10) . " | Movs\n";
echo str_repeat("-", 90) . "\n";

foreach ($productsToFix as $product) {
    echo str_pad($product['id'], 5) . " | ";
    echo str_pad(substr($product['name'], 0, 30), 30) . " | ";
    echo str_pad($product['current'], 10, " ", STR_PAD_LEFT) . " | ";
    echo str_pad($product['correct'], 10, " ", STR_PAD_LEFT) . " | ";
    
    $diff = $product['diff'];
    $diffStr = ($diff > 0 ? "+" : "") . $diff;
    echo str_pad($diffStr, 10, " ", STR_PAD_LEFT) . " | ";
    echo str_pad($product['movements'], 4, " ", STR_PAD_LEFT) . "\n";
}

echo "\n";
echo "Total de produtos a corrigir: " . count($productsToFix) . "\n\n";

// Perguntar confirmação
echo "Deseja corrigir os estoques? (sim/não): ";
$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));
fclose($handle);

if (strtolower($line) !== 'sim' && strtolower($line) !== 's') {
    echo "❌ Correção cancelada.\n";
    exit(0);
}

echo "\n=== Corrigindo Estoques ===\n\n";

foreach ($productsToFix as $product) {
    $stmt = $conn->prepare("UPDATE products SET stock = ? WHERE id = ?");
    $stmt->bind_param("ii", $product['correct'], $product['id']);
    
    if ($stmt->execute()) {
        echo "✅ {$product['name']}: {$product['current']} → {$product['correct']} ";
        echo "(" . ($product['diff'] > 0 ? "+" : "") . $product['diff'] . ")\n";
        $totalFixed++;
    } else {
        echo "❌ Erro ao corrigir {$product['name']}: " . $stmt->error . "\n";
    }
    
    $stmt->close();
}

echo "\n✅ Correção concluída!\n";
echo "Total de produtos corrigidos: $totalFixed\n";

$conn->close();
?>
