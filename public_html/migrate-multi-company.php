<?php
/**
 * Migração Multi-Empresa - Executa via PHP
 */

header('Content-Type: text/plain; charset=UTF-8');

require_once 'config.php';

echo "=== MIGRAÇÃO MULTI-EMPRESA ===\n\n";

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("❌ Erro de conexão: " . $conn->connect_error . "\n");
}

$conn->set_charset('utf8mb4');

echo "✅ Conectado ao banco\n\n";

// Executar migração em partes
$steps = [
    [
        'name' => 'Adicionar company_id em users',
        'sql' => "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INT UNSIGNED NULL AFTER role"
    ],
    [
        'name' => 'Migrar dados de company para company_id',
        'sql' => "UPDATE users u INNER JOIN companies c ON u.company = c.name SET u.company_id = c.id WHERE u.company_id IS NULL"
    ],
    [
        'name' => 'Tornar company_id obrigatório em users',
        'sql' => "ALTER TABLE users MODIFY company_id INT UNSIGNED NOT NULL"
    ],
    [
        'name' => 'Adicionar foreign key em users',
        'sql' => "ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT",
        'ignore_error' => true // Pode já existir
    ],
    [
        'name' => 'Adicionar company_id em products',
        'sql' => "ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id INT UNSIGNED NULL AFTER image_url"
    ],
    [
        'name' => 'Migrar produtos para empresa padrão',
        'sql' => "UPDATE products SET company_id = 1 WHERE company_id IS NULL"
    ],
    [
        'name' => 'Tornar company_id obrigatório em products',
        'sql' => "ALTER TABLE products MODIFY company_id INT UNSIGNED NOT NULL"
    ],
    [
        'name' => 'Adicionar foreign key em products',
        'sql' => "ALTER TABLE products ADD CONSTRAINT fk_products_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT",
        'ignore_error' => true
    ],
    [
        'name' => 'Adicionar company_id em categories',
        'sql' => "ALTER TABLE categories ADD COLUMN IF NOT EXISTS company_id INT UNSIGNED NULL AFTER description"
    ],
    [
        'name' => 'Migrar categorias para empresa padrão',
        'sql' => "UPDATE categories SET company_id = 1 WHERE company_id IS NULL"
    ],
    [
        'name' => 'Tornar company_id obrigatório em categories',
        'sql' => "ALTER TABLE categories MODIFY company_id INT UNSIGNED NOT NULL"
    ],
    [
        'name' => 'Adicionar foreign key em categories',
        'sql' => "ALTER TABLE categories ADD CONSTRAINT fk_categories_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT",
        'ignore_error' => true
    ],
    [
        'name' => 'Adicionar company_id em suppliers',
        'sql' => "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_id INT UNSIGNED NULL AFTER phone"
    ],
    [
        'name' => 'Migrar suppliers para empresa padrão',
        'sql' => "UPDATE suppliers SET company_id = 1 WHERE company_id IS NULL"
    ],
    [
        'name' => 'Tornar company_id obrigatório em suppliers',
        'sql' => "ALTER TABLE suppliers MODIFY company_id INT UNSIGNED NOT NULL"
    ],
    [
        'name' => 'Adicionar foreign key em suppliers',
        'sql' => "ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT",
        'ignore_error' => true
    ]
];

$success = 0;
$errors = 0;

foreach ($steps as $i => $step) {
    echo ($i + 1) . ". " . $step['name'] . "...\n";
    
    if ($conn->query($step['sql'])) {
        echo "   ✅ Sucesso\n";
        $success++;
    } else {
        if (isset($step['ignore_error']) && $step['ignore_error']) {
            echo "   ⚠️ Aviso: " . $conn->error . " (ignorado)\n";
            $success++;
        } else {
            echo "   ❌ Erro: " . $conn->error . "\n";
            $errors++;
        }
    }
}

echo "\n=== RESULTADO ===\n";
echo "✅ Sucesso: $success\n";
echo "❌ Erros: $errors\n\n";

if ($errors === 0) {
    echo "🎉 Migração concluída com sucesso!\n\n";
    
    // Verificar estrutura
    echo "=== VERIFICAÇÃO ===\n\n";
    
    $tables = ['users', 'products', 'categories', 'suppliers'];
    
    foreach ($tables as $table) {
        $result = $conn->query("SHOW COLUMNS FROM $table LIKE 'company_id'");
        if ($result->num_rows > 0) {
            $col = $result->fetch_assoc();
            echo "✅ $table.company_id: {$col['Type']} {$col['Null']} {$col['Key']}\n";
        } else {
            echo "❌ $table.company_id: NÃO ENCONTRADO\n";
        }
    }
}

$conn->close();
?>
