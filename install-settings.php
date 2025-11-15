<?php
// Script para criar a tabela system_settings
// Execute: php install-settings.php

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Erro de conexão: " . $conn->connect_error);
}

echo "Conectado ao banco de dados...\n";

// Criar tabela (sem foreign key por enquanto, para evitar problemas de compatibilidade)
$sql1 = "CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL
)";

if ($conn->query($sql1) === TRUE) {
    echo "✓ Tabela system_settings criada com sucesso!\n";
} else {
    echo "✗ Erro ao criar tabela: " . $conn->error . "\n";
}

// Inserir configurações padrão
$settings = [
    ['system_name', 'Estoque Gemini', 'Nome do sistema exibido no cabeçalho e login'],
    ['system_logo_url', '', 'URL da logomarca do sistema (deixe vazio para usar padrão)'],
    ['gemini_api_key', '', 'Chave de API do Google Gemini para processamento de notas fiscais'],
    ['default_category_id', '1', 'ID da categoria padrão para novos produtos'],
    ['default_supplier_id', '1', 'ID do fornecedor padrão para novos produtos'],
    ['min_stock_default', '10', 'Estoque mínimo padrão para novos produtos'],
    ['currency_symbol', 'R$', 'Símbolo da moeda'],
    ['currency_locale', 'pt-BR', 'Locale para formatação de valores'],
    ['enable_invoice_processing', '1', 'Habilitar processamento de notas fiscais (0=não, 1=sim)'],
    ['enable_activity_log', '1', 'Habilitar log de atividades (0=não, 1=sim)'],
    ['items_per_page', '50', 'Número de itens por página nas tabelas'],
    ['session_timeout_minutes', '480', 'Tempo de sessão em minutos (8 horas = 480)'],
    ['company_website', '', 'Website da empresa'],
    ['company_email', '', 'Email de contato'],
    ['company_phone', '', 'Telefone de contato']
];

$stmt = $conn->prepare("INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_key=setting_key");

$inserted = 0;
foreach ($settings as $setting) {
    $stmt->bind_param("sss", $setting[0], $setting[1], $setting[2]);
    if ($stmt->execute()) {
        $inserted++;
    }
}

echo "✓ $inserted configurações inseridas!\n";

$stmt->close();
$conn->close();

echo "\n✅ Instalação concluída com sucesso!\n";
echo "Você já pode acessar as Configurações no sistema.\n";
?>
