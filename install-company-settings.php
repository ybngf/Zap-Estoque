<?php
/**
 * Script to create and populate the company_settings table
 * Run this script once to initialize company-specific settings
 * Execute: php install-company-settings.php
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("❌ Erro de conexão: " . $conn->connect_error . "\n");
}

echo "✅ Conectado ao banco de dados...\n";

try {
    // Read the SQL schema file
    $sqlFile = __DIR__ . '/database/company-settings-schema.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("Schema file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    if ($sql === false) {
        throw new Exception("Could not read schema file");
    }
    
    echo "=== Installing Company Settings Table ===\n\n";
    
    // Execute the multi-query
    if ($conn->multi_query($sql)) {
        echo "✅ SQL script executed successfully\n\n";
        
        // Clear all results
        do {
            if ($result = $conn->store_result()) {
                $result->free();
            }
        } while ($conn->next_result());
        
    } else {
        throw new Exception("Error executing SQL: " . $conn->error);
    }
    
    // Verify installation
    echo "=== Verification ===\n";
    
    $result = $conn->query("SHOW TABLES LIKE 'company_settings'");
    if ($result && $result->num_rows > 0) {
        echo "✅ Table 'company_settings' exists\n";
        
        // Count settings
        $result = $conn->query("SELECT COUNT(*) as total FROM company_settings");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "✅ Total settings configured: " . $row['total'] . "\n";
        }
        
        // Count companies with settings
        $result = $conn->query("SELECT COUNT(DISTINCT company_id) as companies FROM company_settings");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "✅ Companies with settings: " . $row['companies'] . "\n";
        }
        
        // Show sample settings for first company
        $result = $conn->query("
            SELECT cs.setting_key, cs.setting_value, c.name as company_name
            FROM company_settings cs
            JOIN companies c ON cs.company_id = c.id
            ORDER BY cs.company_id, cs.setting_key
            LIMIT 5
        ");
        
        if ($result) {
            echo "\n📋 Sample settings (first 5):\n";
            while ($row = $result->fetch_assoc()) {
                $value = strlen($row['setting_value']) > 30 
                    ? substr($row['setting_value'], 0, 30) . '...' 
                    : $row['setting_value'];
                echo "   • {$row['company_name']}: {$row['setting_key']} = " . ($value ?: '(empty)') . "\n";
            }
        }
        
        echo "\n✅ Installation completed successfully!\n";
        echo "Admins can now configure their company settings in 'Configurações'\n";
    } else {
        echo "❌ Table 'company_settings' was not created\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
} finally {
    $conn->close();
}
?>
