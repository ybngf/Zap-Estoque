<?php
/**
 * Script para criar tabela de auditoria (activity_log)
 * Registra todas as alterações no sistema para rastreabilidade
 */

header('Content-Type: text/html; charset=utf-8');

$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'dona_estoqueg';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("❌ Erro na conexão: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

echo "<h1>🔍 Criação da Tabela de Auditoria</h1>";
echo "<pre>";

// Criar tabela activity_log
$sql = "CREATE TABLE IF NOT EXISTS activity_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    company_id INT UNSIGNED NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT 'INSERT, UPDATE, DELETE',
    entity_type VARCHAR(50) NOT NULL COMMENT 'products, categories, suppliers, users, stock_movements',
    entity_id INT UNSIGNED NOT NULL COMMENT 'ID do registro afetado',
    old_data JSON NULL COMMENT 'Dados antes da alteração (UPDATE/DELETE)',
    new_data JSON NULL COMMENT 'Dados depois da alteração (INSERT/UPDATE)',
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_company (company_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditoria de todas as alterações no sistema'";

if ($conn->query($sql)) {
    echo "✅ Tabela activity_log criada com sucesso!\n\n";
} else {
    echo "❌ Erro ao criar tabela: " . $conn->error . "\n\n";
}

// Verificar estrutura da tabela
echo "📋 Estrutura da tabela activity_log:\n";
$result = $conn->query("DESCRIBE activity_log");
while ($row = $result->fetch_assoc()) {
    echo sprintf(
        "  - %-20s %-30s %s\n",
        $row['Field'],
        $row['Type'],
        $row['Null'] === 'NO' ? 'NOT NULL' : 'NULL'
    );
}

echo "\n✅ Sistema de auditoria pronto para uso!\n";
echo "\n📊 A tabela activity_log vai registrar:\n";
echo "  - Todas as inserções (INSERT)\n";
echo "  - Todas as atualizações (UPDATE) com dados antigos e novos\n";
echo "  - Todas as exclusões (DELETE) com dados removidos\n";
echo "  - Usuário responsável pela ação\n";
echo "  - Empresa associada\n";
echo "  - Data/hora da operação\n";
echo "  - IP e User-Agent\n";

echo "</pre>";

$conn->close();
?>
