<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'dona_estoqueg');
define('DB_PASS', 'nYW0bHpnYW0bHp');
define('DB_NAME', 'dona_estoqueg');

// Database connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

$conn->set_charset('utf8mb4');

// Test 1: Raw data from database
echo "<h2>Test 1: Raw Data from Database</h2>";
$result = $conn->query("SELECT * FROM products LIMIT 1");
$rawProduct = $result->fetch_assoc();
echo "<pre>";
echo "Raw data:\n";
print_r($rawProduct);
echo "\nTypes:\n";
foreach ($rawProduct as $key => $value) {
    echo "$key: " . gettype($value) . " = " . var_export($value, true) . "\n";
}
echo "</pre>";

// Test 2: After type conversion
echo "<h2>Test 2: After Type Conversion</h2>";
$formatted = [
    'id' => (int)$rawProduct['id'],
    'name' => $rawProduct['name'],
    'sku' => $rawProduct['sku'],
    'categoryId' => (int)$rawProduct['category_id'],
    'supplierId' => (int)$rawProduct['supplier_id'],
    'price' => (float)$rawProduct['price'],
    'stock' => (int)$rawProduct['stock'],
    'minStock' => (int)$rawProduct['min_stock'],
    'imageUrl' => $rawProduct['image_url']
];

echo "<pre>";
echo "Formatted data:\n";
print_r($formatted);
echo "\nTypes:\n";
foreach ($formatted as $key => $value) {
    echo "$key: " . gettype($value) . " = " . var_export($value, true) . "\n";
}
echo "</pre>";

// Test 3: JSON encoding
echo "<h2>Test 3: JSON Encoded</h2>";
$json = json_encode($formatted);
echo "<pre>";
echo "JSON string:\n";
echo $json;
echo "\n\nJSON decoded:\n";
print_r(json_decode($json, true));
echo "</pre>";

// Test 4: What the API should return
echo "<h2>Test 4: Full API Response</h2>";
$result = $conn->query("SELECT * FROM products");
$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'sku' => $row['sku'],
        'categoryId' => (int)$row['category_id'],
        'supplierId' => (int)$row['supplier_id'],
        'price' => (float)$row['price'],
        'stock' => (int)$row['stock'],
        'minStock' => (int)$row['min_stock'],
        'imageUrl' => $row['image_url']
    ];
}

echo "<h3>As Array:</h3>";
echo "<pre>";
print_r($products);
echo "</pre>";

echo "<h3>As JSON (what frontend receives):</h3>";
echo "<pre>";
echo json_encode($products, JSON_PRETTY_PRINT);
echo "</pre>";

$conn->close();
?>
