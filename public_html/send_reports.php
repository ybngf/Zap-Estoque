<?php
/**
 * Script de Envio Automático de Relatórios de Estoque
 * 
 * Este script deve ser executado via CRON diariamente
 * Exemplo de CRON (executar todo dia às 08:00):
 * 0 8 * * * /usr/bin/php /caminho/para/send_reports.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/smtp_mailer.php';

// Função para gerar relatório de estoque
function generateStockReport($conn, $companyId, $companyName) {
    $report = [
        'company_name' => $companyName,
        'date' => date('d/m/Y H:i:s'),
        'summary' => [],
        'low_stock' => [],
        'out_of_stock' => [],
        'recent_movements' => [],
        'total_value' => 0
    ];
    
    // 1. Resumo Geral
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM products WHERE company_id = ?");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $report['summary']['total_products'] = $stmt->get_result()->fetch_assoc()['total'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM categories WHERE company_id = ?");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $report['summary']['total_categories'] = $stmt->get_result()->fetch_assoc()['total'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM suppliers WHERE company_id = ?");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $report['summary']['total_suppliers'] = $stmt->get_result()->fetch_assoc()['total'];
    
    // 2. Produtos com Estoque Baixo
    $stmt = $conn->prepare("
        SELECT p.name, p.stock as current_stock, p.min_stock, c.name as category 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.company_id = ? AND p.stock > 0 AND p.stock <= p.min_stock 
        ORDER BY p.stock ASC 
        LIMIT 20
    ");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $report['low_stock'][] = $row;
    }
    
    // 3. Produtos Sem Estoque
    $stmt = $conn->prepare("
        SELECT p.name, c.name as category 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.company_id = ? AND p.stock = 0 
        ORDER BY p.name ASC 
        LIMIT 20
    ");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $report['out_of_stock'][] = $row;
    }
    
    // 4. Movimentações Recentes (últimas 24h)
    $stmt = $conn->prepare("
        SELECT sm.type as movement_type, sm.quantity, sm.date as created_at, p.name as product_name, u.name as user_name
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.user_id = u.id
        WHERE p.company_id = ? AND sm.date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY sm.date DESC
        LIMIT 50
    ");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $report['recent_movements'][] = $row;
    }
    
    // 5. Valor Total do Estoque
    $stmt = $conn->prepare("
        SELECT SUM(stock * price) as total_value 
        FROM products 
        WHERE company_id = ?
    ");
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $report['total_value'] = $stmt->get_result()->fetch_assoc()['total_value'] ?? 0;
    
    return $report;
}

// Função para formatar relatório em HTML (para email)
function formatReportHTML($report) {
    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .section { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #10b981; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .stat { background: white; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #10b981; }
        .stat-label { font-size: 14px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background: #e5e7eb; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
        .danger { background: #fee2e2; border-left: 4px solid #ef4444; }
        .footer { text-align: center; color: #6b7280; margin-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Estoque</h1>
            <p>' . htmlspecialchars($report['company_name']) . '</p>
            <p>Gerado em: ' . $report['date'] . '</p>
        </div>
        
        <div class="section">
            <h2>📈 Resumo Geral</h2>
            <div class="summary">
                <div class="stat">
                    <div class="stat-value">' . $report['summary']['total_products'] . '</div>
                    <div class="stat-label">Produtos</div>
                </div>
                <div class="stat">
                    <div class="stat-value">' . $report['summary']['total_categories'] . '</div>
                    <div class="stat-label">Categorias</div>
                </div>
                <div class="stat">
                    <div class="stat-value">' . $report['summary']['total_suppliers'] . '</div>
                    <div class="stat-label">Fornecedores</div>
                </div>
            </div>
            <div class="stat" style="margin-top: 10px;">
                <div class="stat-value">R$ ' . number_format($report['total_value'], 2, ',', '.') . '</div>
                <div class="stat-label">Valor Total do Estoque</div>
            </div>
        </div>';
    
    // Produtos com Estoque Baixo
    if (count($report['low_stock']) > 0) {
        $html .= '<div class="section alert">
            <h2>⚠️ Produtos com Estoque Baixo (' . count($report['low_stock']) . ')</h2>
            <table>
                <tr><th>Produto</th><th>Categoria</th><th>Estoque Atual</th><th>Estoque Mínimo</th></tr>';
        foreach ($report['low_stock'] as $item) {
            $html .= '<tr>
                <td>' . htmlspecialchars($item['name']) . '</td>
                <td>' . htmlspecialchars($item['category'] ?? '-') . '</td>
                <td>' . $item['current_stock'] . '</td>
                <td>' . $item['min_stock'] . '</td>
            </tr>';
        }
        $html .= '</table></div>';
    }
    
    // Produtos Sem Estoque
    if (count($report['out_of_stock']) > 0) {
        $html .= '<div class="section danger">
            <h2>🚫 Produtos Sem Estoque (' . count($report['out_of_stock']) . ')</h2>
            <table>
                <tr><th>Produto</th><th>Categoria</th></tr>';
        foreach ($report['out_of_stock'] as $item) {
            $html .= '<tr>
                <td>' . htmlspecialchars($item['name']) . '</td>
                <td>' . htmlspecialchars($item['category'] ?? '-') . '</td>
            </tr>';
        }
        $html .= '</table></div>';
    }
    
    // Movimentações Recentes
    if (count($report['recent_movements']) > 0) {
        $html .= '<div class="section">
            <h2>📦 Movimentações Recentes (24h) - ' . count($report['recent_movements']) . ' registros</h2>
            <table>
                <tr><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Usuário</th><th>Data</th></tr>';
        foreach (array_slice($report['recent_movements'], 0, 10) as $item) {
            $typeLabel = $item['movement_type'] === 'IN' ? '➕ Entrada' : '➖ Saída';
            $html .= '<tr>
                <td>' . htmlspecialchars($item['product_name']) . '</td>
                <td>' . $typeLabel . '</td>
                <td>' . $item['quantity'] . '</td>
                <td>' . htmlspecialchars($item['user_name'] ?? '-') . '</td>
                <td>' . date('d/m/Y H:i', strtotime($item['created_at'])) . '</td>
            </tr>';
        }
        $html .= '</table></div>';
    }
    
    $html .= '<div class="footer">
        <p>Este é um relatório automático gerado pelo Sistema de Gestão de Estoque</p>
        <p>Para mais informações, acesse o sistema</p>
    </div>
    </div>
</body>
</html>';
    
    return $html;
}

// Função para formatar relatório em texto (para WhatsApp)
function formatReportText($report) {
    $text = "📊 *RELATÓRIO DE ESTOQUE*\n";
    $text .= "━━━━━━━━━━━━━━━━━━━━━━\n";
    $text .= "*Empresa:* " . $report['company_name'] . "\n";
    $text .= "*Data:* " . $report['date'] . "\n\n";
    
    $text .= "📈 *RESUMO GERAL*\n";
    $text .= "• Produtos: " . $report['summary']['total_products'] . "\n";
    $text .= "• Categorias: " . $report['summary']['total_categories'] . "\n";
    $text .= "• Fornecedores: " . $report['summary']['total_suppliers'] . "\n";
    $text .= "• Valor Total: R$ " . number_format($report['total_value'], 2, ',', '.') . "\n\n";
    
    if (count($report['low_stock']) > 0) {
        $text .= "⚠️ *ESTOQUE BAIXO* (" . count($report['low_stock']) . ")\n";
        foreach (array_slice($report['low_stock'], 0, 5) as $item) {
            $text .= "• " . $item['name'] . " - Atual: " . $item['current_stock'] . " / Mín: " . $item['min_stock'] . "\n";
        }
        if (count($report['low_stock']) > 5) {
            $text .= "... e mais " . (count($report['low_stock']) - 5) . " produtos\n";
        }
        $text .= "\n";
    }
    
    if (count($report['out_of_stock']) > 0) {
        $text .= "🚫 *SEM ESTOQUE* (" . count($report['out_of_stock']) . ")\n";
        foreach (array_slice($report['out_of_stock'], 0, 5) as $item) {
            $text .= "• " . $item['name'] . "\n";
        }
        if (count($report['out_of_stock']) > 5) {
            $text .= "... e mais " . (count($report['out_of_stock']) - 5) . " produtos\n";
        }
        $text .= "\n";
    }
    
    if (count($report['recent_movements']) > 0) {
        $text .= "📦 *MOVIMENTAÇÕES (24h)* - " . count($report['recent_movements']) . " registros\n";
        $in = 0;
        $out = 0;
        foreach ($report['recent_movements'] as $mov) {
            if ($mov['movement_type'] === 'IN') $in++;
            else $out++;
        }
        $text .= "• Entradas: " . $in . "\n";
        $text .= "• Saídas: " . $out . "\n\n";
    }
    
    $text .= "━━━━━━━━━━━━━━━━━━━━━━\n";
    $text .= "_Relatório automático do Sistema de Gestão de Estoque_";
    
    return $text;
}

// Função para enviar email com SMTP
function sendEmailReport($to, $subject, $htmlContent, $smtpSettings) {
    try {
        // Verificar se tem configurações SMTP
        if (empty($smtpSettings['smtp_host']) || empty($smtpSettings['smtp_username']) || empty($smtpSettings['smtp_password'])) {
            error_log("SMTP não configurado - tentando envio direto");
            // Fallback para mail() nativo
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: Sistema de Estoque <noreply@donasalada.com.br>" . "\r\n";
            return mail($to, $subject, $htmlContent, $headers);
        }
        
        // Usar SMTP
        $mailer = new SMTPMailer(
            $smtpSettings['smtp_host'],
            $smtpSettings['smtp_port'] ?? 587,
            $smtpSettings['smtp_username'],
            $smtpSettings['smtp_password'],
            $smtpSettings['smtp_from_email'] ?? $smtpSettings['smtp_username'],
            $smtpSettings['smtp_from_name'] ?? 'Sistema de Estoque',
            $smtpSettings['smtp_encryption'] ?? 'tls'
        );
        
        // Criar versão texto simples do HTML
        $textContent = strip_tags($htmlContent);
        
        $mailer->send($to, $subject, $htmlContent, $textContent);
        error_log("EMAIL SMTP ENVIADO: Para=$to | Assunto=$subject");
        return true;
        
    } catch (Exception $e) {
        error_log("ERRO SMTP: " . $e->getMessage());
        return false;
    }
}

// Função para enviar via Evolution API
function sendWhatsAppReport($evolutionUrl, $apiKey, $instanceName, $number, $message) {
    $url = rtrim($evolutionUrl, '/') . '/message/sendText/' . $instanceName;
    
    $data = [
        'number' => $number,
        'text' => $message
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Em produção, configure certificado correto
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    // Debug detalhado
    if ($httpCode === 0 || $error) {
        $errorMsg = "Erro de conexão: $error | URL: $url";
        return ['success' => false, 'http_code' => $httpCode, 'error' => $errorMsg, 'response' => $response];
    }
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['success' => true, 'http_code' => $httpCode, 'response' => $response];
    }
    
    return ['success' => false, 'http_code' => $httpCode, 'error' => 'HTTP error', 'response' => $response];
}

// Função principal
function processReports($conn) {
    $today = date('N'); // 1 = Monday, 7 = Sunday
    $dayOfMonth = date('j');
    $log = [];
    
    // Primeiro, vamos buscar todas as empresas
    $queryCompanies = "SELECT id, name FROM companies ORDER BY id";
    $resultCompanies = $conn->query($queryCompanies);
    
    if (!$resultCompanies) {
        echo "ERRO ao buscar empresas: " . $conn->error . "\n";
        return [];
    }
    
    echo "Total de empresas encontradas: " . $resultCompanies->num_rows . "\n\n";
    
    // Para cada empresa, buscar as configurações
    while ($company = $resultCompanies->fetch_assoc()) {
        $companyId = $company['id'];
        $companyName = $company['name'];
        
        // Buscar configurações da empresa
        $querySettings = "SELECT setting_key, setting_value FROM company_settings WHERE company_id = ?";
        $stmt = $conn->prepare($querySettings);
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $resultSettings = $stmt->get_result();
        
        $settings = [];
        while ($row = $resultSettings->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        $stmt->close();
        
        // Verificar se tem relatórios habilitados
        $hasEmailEnabled = isset($settings['report_email_enabled']) && $settings['report_email_enabled'] == '1';
        $hasWhatsappEnabled = isset($settings['report_whatsapp_enabled']) && $settings['report_whatsapp_enabled'] == '1';
        
        if (!$hasEmailEnabled && !$hasWhatsappEnabled) {
            echo "Empresa '{$companyName}' (ID: {$companyId}): Relatórios não habilitados\n";
            continue;
        }
        
        echo "Processando empresa: {$companyName} (ID: {$companyId})\n";
        
        $companyLog = [
            'company' => $companyName,
            'email' => null,
            'whatsapp' => null
        ];
        
        // Gerar relatório
        $report = generateStockReport($conn, $companyId, $companyName);
        
        // Processar Email
        if ($hasEmailEnabled && !empty($settings['report_email_address'])) {
            $shouldSend = false;
            $frequency = $settings['report_email_frequency'] ?? 'daily';
            
            if ($frequency === 'daily') {
                $shouldSend = true;
            } elseif ($frequency === 'weekly' && $today == 1) { // Monday
                $shouldSend = true;
            } elseif ($frequency === 'monthly' && $dayOfMonth == 1) {
                $shouldSend = true;
            }
            
            echo "  Email: Habilitado (Frequência: {$frequency}, Deve enviar hoje: " . ($shouldSend ? 'Sim' : 'Não') . ")\n";
            
            if ($shouldSend) {
                $htmlContent = formatReportHTML($report);
                $subject = "Relatório de Estoque - " . $companyName . " - " . date('d/m/Y');
                
                if (sendEmailReport($settings['report_email_address'], $subject, $htmlContent, $settings)) {
                    $companyLog['email'] = 'Enviado com sucesso para ' . $settings['report_email_address'];
                    echo "    ✓ " . $companyLog['email'] . "\n";
                } else {
                    $companyLog['email'] = 'Erro ao enviar para ' . $settings['report_email_address'];
                    echo "    ✗ " . $companyLog['email'] . "\n";
                }
            } else {
                $companyLog['email'] = 'Não é dia de envio (' . $frequency . ')';
            }
        }
        
        // Processar WhatsApp
        if ($hasWhatsappEnabled && !empty($settings['report_whatsapp_number']) && 
            !empty($settings['evolution_api_url']) && !empty($settings['evolution_api_key']) && 
            !empty($settings['evolution_instance_name'])) {
            
            $shouldSend = false;
            $frequency = $settings['report_whatsapp_frequency'] ?? 'daily';
            
            if ($frequency === 'daily') {
                $shouldSend = true;
            } elseif ($frequency === 'weekly' && $today == 1) {
                $shouldSend = true;
            } elseif ($frequency === 'monthly' && $dayOfMonth == 1) {
                $shouldSend = true;
            }
            
            echo "  WhatsApp: Habilitado (Frequência: {$frequency}, Deve enviar hoje: " . ($shouldSend ? 'Sim' : 'Não') . ")\n";
            
            if ($shouldSend) {
                $textContent = formatReportText($report);
                $whatsappResult = sendWhatsAppReport(
                    $settings['evolution_api_url'],
                    $settings['evolution_api_key'],
                    $settings['evolution_instance_name'],
                    $settings['report_whatsapp_number'],
                    $textContent
                );
                
                if ($whatsappResult['success']) {
                    $companyLog['whatsapp'] = 'Enviado com sucesso para ' . $settings['report_whatsapp_number'];
                    echo "    ✓ " . $companyLog['whatsapp'] . "\n";
                } else {
                    $errorDetail = isset($whatsappResult['error']) ? $whatsappResult['error'] : $whatsappResult['response'];
                    $companyLog['whatsapp'] = 'Erro ao enviar (HTTP ' . $whatsappResult['http_code'] . '): ' . $errorDetail;
                    echo "    ✗ " . $companyLog['whatsapp'] . "\n";
                }
            } else {
                $companyLog['whatsapp'] = 'Não é dia de envio (' . $frequency . ')';
            }
        } elseif ($hasWhatsappEnabled) {
            echo "  WhatsApp: Habilitado mas faltam configurações da Evolution API\n";
        }
        
        $log[] = $companyLog;
        echo "\n";
    }
    
    return $log;
}

// Execução
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        die("Erro de conexão: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    echo "=== PROCESSAMENTO DE RELATÓRIOS ===\n";
    echo "Data/Hora: " . date('d/m/Y H:i:s') . "\n\n";
    
    $results = processReports($conn);
    
    echo "\n=== RESUMO FINAL ===\n";
    echo "Total de empresas processadas: " . count($results) . "\n\n";
    
    if (count($results) > 0) {
        foreach ($results as $result) {
            echo "Empresa: " . $result['company'] . "\n";
            if ($result['email']) {
                echo "  📧 Email: " . $result['email'] . "\n";
            }
            if ($result['whatsapp']) {
                echo "  📱 WhatsApp: " . $result['whatsapp'] . "\n";
            }
            echo "\n";
        }
    } else {
        echo "Nenhuma empresa com relatórios configurados.\n";
    }
    
    echo "=== PROCESSAMENTO CONCLUÍDO ===\n";
    
    $conn->close();
    
} catch (Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
    exit(1);
}
