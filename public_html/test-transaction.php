<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

// Test direct database update
$productId = 1;
$newStock = 888; // Valor único para teste

echo "=== TESTE DE TRANSAÇÃO MYSQL ===\n\n";

// 1. Check current stock
$stmt = $conn->prepare("SELECT id, name, stock FROM products WHERE id = ?");
$stmt->bind_param("i", $productId);
$stmt->execute();
$result = $stmt->get_result();
$before = $result->fetch_assoc();

echo "1. ANTES DA ATUALIZAÇÃO:\n";
echo "   Stock: " . $before['stock'] . "\n\n";

// 2. Update with detailed error checking
echo "2. EXECUTANDO UPDATE...\n";
$stmt = $conn->prepare("UPDATE products SET stock = ? WHERE id = ?");
if (!$stmt) {
    echo "   ERRO ao preparar: " . $conn->error . "\n";
    exit;
}

$stmt->bind_param("ii", $newStock, $productId);
$executeResult = $stmt->execute();

echo "   Execute result: " . ($executeResult ? "TRUE" : "FALSE") . "\n";
echo "   Error: " . ($stmt->error ?: "nenhum") . "\n";
echo "   Affected rows: " . $stmt->affected_rows . "\n";
echo "   Connection error: " . ($conn->error ?: "nenhum") . "\n";

// 3. Check autocommit status
$autocommit = $conn->query("SELECT @@autocommit as ac")->fetch_assoc();
echo "   Autocommit: " . $autocommit['ac'] . "\n";

// 4. Explicit commit
echo "\n3. FORÇANDO COMMIT...\n";
$commitResult = $conn->commit();
echo "   Commit result: " . ($commitResult ? "TRUE" : "FALSE") . "\n";

// 5. Check stock after update (same connection)
$stmt = $conn->prepare("SELECT stock FROM products WHERE id = ?");
$stmt->bind_param("i", $productId);
$stmt->execute();
$result = $stmt->get_result();
$afterSame = $result->fetch_assoc();

echo "\n4. DEPOIS DA ATUALIZAÇÃO (mesma conexão):\n";
echo "   Stock: " . $afterSame['stock'] . "\n";

// 6. Check with new connection
$conn2 = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$stmt2 = $conn2->prepare("SELECT stock FROM products WHERE id = ?");
$stmt2->bind_param("i", $productId);
$stmt2->execute();
$result2 = $stmt2->get_result();
$afterNew = $result2->fetch_assoc();

echo "\n5. DEPOIS DA ATUALIZAÇÃO (nova conexão):\n";
echo "   Stock: " . $afterNew['stock'] . "\n";

// 7. Summary
echo "\n=== RESUMO ===\n";
echo "Stock antes: " . $before['stock'] . "\n";
echo "Stock depois (mesma conexão): " . $afterSame['stock'] . "\n";
echo "Stock depois (nova conexão): " . $afterNew['stock'] . "\n";

if ($afterNew['stock'] == $newStock) {
    echo "\n✅ SUCESSO: Mudança foi salva no banco!\n";
} else {
    echo "\n❌ FALHA: Mudança NÃO foi salva no banco!\n";
    echo "Esperado: " . $newStock . "\n";
    echo "Obtido: " . $afterNew['stock'] . "\n";
}

$conn->close();
$conn2->close();
?>