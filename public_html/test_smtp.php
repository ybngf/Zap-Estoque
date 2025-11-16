<?php
require_once 'config.php';
require_once 'smtp_mailer.php';

echo "=== TESTE DE ENVIO SMTP ===\n\n";

// Buscar configurações SMTP da empresa
$companyId = 2; // Dona Salada
echo "1. Buscando configurações SMTP da empresa $companyId...\n";

$stmt = $conn->prepare("SELECT setting_key, setting_value FROM company_settings WHERE company_id = ? AND setting_key LIKE 'smtp_%'");
$stmt->bind_param("i", $companyId);
$stmt->execute();
$result = $stmt->get_result();

$smtpSettings = [];
while ($row = $result->fetch_assoc()) {
    $smtpSettings[$row['setting_key']] = $row['setting_value'];
    echo "   {$row['setting_key']} = {$row['setting_value']}\n";
}
$stmt->close();

if (empty($smtpSettings['smtp_host'])) {
    echo "\n❌ SMTP não configurado!\n";
    echo "Configure em: Configurações da Empresa → Configuração SMTP\n";
    exit;
}

echo "\n2. Testando envio de email...\n";

$to = "yuriferraz@gmail.com";
$subject = "Teste SMTP - Sistema de Estoque - " . date('d/m/Y H:i:s');
$htmlContent = "
<html>
<head>
<style>
body { font-family: Arial, sans-serif; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
.content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
.info { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; }
</style>
</head>
<body>
<div class='container'>
  <div class='header'>
    <h1>✅ Teste de Email SMTP</h1>
  </div>
  <div class='content'>
    <p>Parabéns! O envio de email via SMTP está funcionando corretamente.</p>
    
    <div class='info'>
      <p><strong>📊 Informações do Teste:</strong></p>
      <ul>
        <li><strong>Data/Hora:</strong> " . date('d/m/Y H:i:s') . "</li>
        <li><strong>Servidor SMTP:</strong> {$smtpSettings['smtp_host']}</li>
        <li><strong>Porta:</strong> {$smtpSettings['smtp_port']}</li>
        <li><strong>Criptografia:</strong> " . strtoupper($smtpSettings['smtp_encryption']) . "</li>
        <li><strong>Remetente:</strong> {$smtpSettings['smtp_from_name']} &lt;{$smtpSettings['smtp_from_email']}&gt;</li>
      </ul>
    </div>
    
    <p>Agora você pode receber relatórios automáticos de estoque por email!</p>
    
    <p style='color: #666; font-size: 12px; margin-top: 30px;'>
      Sistema de Gestão de Estoque - Dona Salada
    </p>
  </div>
</div>
</body>
</html>
";

try {
    $mailer = new SMTPMailer(
        $smtpSettings['smtp_host'],
        $smtpSettings['smtp_port'] ?? 587,
        $smtpSettings['smtp_username'],
        $smtpSettings['smtp_password'],
        $smtpSettings['smtp_from_email'] ?? $smtpSettings['smtp_username'],
        $smtpSettings['smtp_from_name'] ?? 'Sistema de Estoque',
        $smtpSettings['smtp_encryption'] ?? 'tls'
    );
    
    $mailer->setDebug(true); // Mostrar log detalhado
    
    echo "\n3. Conectando ao servidor SMTP...\n\n";
    
    $textContent = "Teste de Email SMTP\n\nSe você recebeu este email, a configuração está correta!\n\nData: " . date('d/m/Y H:i:s');
    
    $mailer->send($to, $subject, $htmlContent, $textContent);
    
    echo "\n\n✅ EMAIL ENVIADO COM SUCESSO!\n\n";
    echo "Verifique a caixa de entrada de: $to\n";
    echo "⚠️  Verifique também a pasta de SPAM/Lixo Eletrônico\n";
    
} catch (Exception $e) {
    echo "\n\n❌ ERRO AO ENVIAR EMAIL:\n";
    echo $e->getMessage() . "\n\n";
    
    echo "Possíveis causas:\n";
    echo "  1. Credenciais incorretas (usuário/senha)\n";
    echo "  2. Servidor SMTP bloqueado ou offline\n";
    echo "  3. Porta incorreta ou bloqueada pelo firewall\n";
    echo "  4. Para Gmail: use 'Senha de App' ao invés da senha normal\n";
    echo "  5. Verifique se a autenticação em duas etapas está ativa\n";
}

echo "\n=== FIM DO TESTE ===\n";
