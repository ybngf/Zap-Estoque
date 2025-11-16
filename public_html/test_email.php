<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== TESTE DE ENVIO DE EMAIL ===\n\n";

$to = "yuriferraz@gmail.com";
$subject = "Teste - Sistema de Estoque - " . date('d/m/Y H:i:s');
$message = "
<html>
<head>
<style>
body { font-family: Arial, sans-serif; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
.content { padding: 20px; background-color: #f9f9f9; }
</style>
</head>
<body>
<div class='container'>
  <div class='header'>
    <h1>📊 Teste de Email</h1>
  </div>
  <div class='content'>
    <p>Este é um email de teste do sistema de relatórios.</p>
    <p><strong>Data/Hora:</strong> " . date('d/m/Y H:i:s') . "</p>
    <p>Se você recebeu este email, a configuração está correta!</p>
  </div>
</div>
</body>
</html>
";

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: Sistema de Estoque <noreply@donasalada.com.br>" . "\r\n";
$headers .= "Reply-To: noreply@donasalada.com.br" . "\r\n";

echo "1. Verificando configuração PHP mail...\n";
echo "   sendmail_path: " . ini_get('sendmail_path') . "\n";
echo "   SMTP: " . ini_get('SMTP') . "\n";
echo "   smtp_port: " . ini_get('smtp_port') . "\n\n";

echo "2. Enviando email de teste...\n";
echo "   Para: $to\n";
echo "   Assunto: $subject\n\n";

$result = mail($to, $subject, $message, $headers);

if ($result) {
    echo "✅ Função mail() retornou TRUE (email foi aceito para envio)\n\n";
    echo "⚠️  IMPORTANTE:\n";
    echo "   - Verifique sua caixa de entrada em $to\n";
    echo "   - Verifique também a pasta de SPAM/Lixo Eletrônico\n";
    echo "   - O email pode levar alguns minutos para chegar\n";
    echo "   - Se não chegar, verifique os logs do servidor de email\n\n";
    
    echo "3. Onde verificar logs no servidor:\n";
    echo "   - /var/log/mail.log\n";
    echo "   - /var/log/maillog\n";
    echo "   - tail -f /var/log/mail.log | grep '$to'\n";
} else {
    echo "❌ Função mail() retornou FALSE (falha no envio)\n\n";
    
    $lastError = error_get_last();
    if ($lastError) {
        echo "Último erro PHP:\n";
        print_r($lastError);
        echo "\n";
    }
    
    echo "Possíveis causas:\n";
    echo "   1. Servidor de email não configurado no PHP\n";
    echo "   2. Sendmail/Postfix não instalado\n";
    echo "   3. Restrições do servidor\n";
    echo "   4. Porta 25 bloqueada\n\n";
    
    echo "Solução alternativa:\n";
    echo "   - Considere usar SMTP com PHPMailer ou SwiftMailer\n";
    echo "   - Configure um servidor SMTP externo (Gmail, SendGrid, etc.)\n";
}

echo "\n=== FIM DO TESTE ===\n";
