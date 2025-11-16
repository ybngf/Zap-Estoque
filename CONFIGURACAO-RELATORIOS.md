# Configuração de Relatórios Automáticos

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configuração no Sistema](#configuração-no-sistema)
3. [Configuração do CRON](#configuração-do-cron)
4. [Configuração da Evolution API](#configuração-da-evolution-api)
5. [Teste Manual](#teste-manual)
6. [Troubleshooting](#troubleshooting)

## 📊 Visão Geral

O sistema de relatórios automáticos envia diariamente, semanalmente ou mensalmente um resumo completo do estoque via:
- **Email**: Relatório HTML completo com gráficos e tabelas
- **WhatsApp**: Resumo em texto via Evolution API

### O que está incluído nos relatórios:
- ✅ Resumo geral (total de produtos, categorias, fornecedores)
- ✅ Produtos com estoque baixo (abaixo do mínimo)
- ✅ Produtos sem estoque (quantidade = 0)
- ✅ Movimentações recentes (últimas 24h)
- ✅ Valor total do estoque

---

## ⚙️ Configuração no Sistema

### 1. Acesse as Configurações da Empresa
- Faça login como **Admin** ou **Super Admin**
- Navegue até **Configurações da Empresa**
- Encontre a seção **"📊 Relatórios Automáticos"**

### 2. Configurar Envio por Email

```
✅ Ativar envio de relatórios por email
📧 Email: seuemail@empresa.com
⏰ Frequência: Diário / Semanal / Mensal
```

**Frequências disponíveis:**
- **Diário**: Todo dia às 08:00
- **Semanal**: Segundas-feiras às 08:00
- **Mensal**: Dia 1 de cada mês às 08:00

### 3. Configurar Envio por WhatsApp

```
✅ Ativar envio de relatórios por WhatsApp
📱 Número: 5511999999999 (com código do país + DDD)
⏰ Frequência: Diário / Semanal / Mensal

🔧 Configuração da Evolution API:
   - URL: https://sua-evolution-api.com
   - API Key: sua-chave-api
   - Instância: nome-da-instancia
```

---

## ⏰ Configuração do CRON

O script `send_reports.php` deve ser executado via CRON job no servidor.

### Linux / Ubuntu / CentOS

1. **Edite o crontab:**
```bash
crontab -e
```

2. **Adicione uma das seguintes linhas:**

**Opção 1: Executar todo dia às 08:00**
```bash
0 8 * * * /usr/bin/php /var/www/html/estoque/public_html/send_reports.php >> /var/log/estoque_reports.log 2>&1
```

**Opção 2: Executar a cada hora (verificação mais frequente)**
```bash
0 * * * * /usr/bin/php /var/www/html/estoque/public_html/send_reports.php >> /var/log/estoque_reports.log 2>&1
```

**Opção 3: Executar duas vezes ao dia (08:00 e 18:00)**
```bash
0 8,18 * * * /usr/bin/php /var/www/html/estoque/public_html/send_reports.php >> /var/log/estoque_reports.log 2>&1
```

3. **Salve e saia** (no vim: `:wq`, no nano: `Ctrl+X`)

### Explicação da Sintaxe do CRON
```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (0 = Domingo)
│ │ │ │ │
│ │ │ │ │
0 8 * * * comando-a-executar
```

### Windows (Task Scheduler)

1. **Abra o Agendador de Tarefas** (Task Scheduler)
2. **Criar Tarefa Básica**
   - Nome: "Relatórios de Estoque"
   - Descrição: "Envio automático de relatórios"
3. **Gatilho**: Diariamente às 08:00
4. **Ação**: Iniciar um programa
   - Programa: `C:\php\php.exe`
   - Argumentos: `C:\caminho\para\estoque\public_html\send_reports.php`
5. **Concluir**

### Verificar se o CRON está funcionando

```bash
# Ver logs do cron
tail -f /var/log/estoque_reports.log

# Verificar se o cron está ativo
sudo systemctl status cron

# Listar crons do usuário
crontab -l
```

---

## 🔧 Configuração da Evolution API

A Evolution API é necessária para enviar mensagens pelo WhatsApp.

### 1. Obter uma Instância da Evolution API

**Opções:**
- **Self-hosted**: Instale sua própria Evolution API
  - Repositório: https://github.com/EvolutionAPI/evolution-api
  - Documentação: https://doc.evolution-api.com/

- **Cloud/Gerenciada**: Use um provedor de Evolution API
  - Mais fácil, sem necessidade de servidor próprio
  - Custo mensal geralmente entre R$ 20-50

### 2. Criar uma Instância

1. Acesse o painel da Evolution API
2. Crie uma nova instância
3. Conecte seu WhatsApp (QR Code)
4. Anote as credenciais:
   - **URL**: `https://api.evolution.com` (ou sua URL)
   - **API Key**: Chave fornecida no painel
   - **Nome da Instância**: Nome que você definiu

### 3. Testar a Conexão

```bash
curl -X POST https://sua-evolution-api.com/message/sendText/sua-instancia \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_API_KEY" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de mensagem"
  }'
```

Se retornar status 200, está funcionando! ✅

### 4. Formato do Número

O número deve incluir:
- **Código do país** (Brasil: 55)
- **DDD** (ex: 11 para São Paulo)
- **Número** (9 dígitos para celular)

**Exemplo**: `5511999999999`

---

## 🧪 Teste Manual

Para testar o envio de relatórios sem aguardar o CRON:

### Via Terminal (Linux/Mac)
```bash
cd /var/www/html/estoque/public_html
php send_reports.php
```

### Via Navegador
⚠️ **Não recomendado em produção** (pode ter timeout)

Crie um arquivo temporário `test_report.php`:
```php
<?php
// REMOVER ESTE ARQUIVO APÓS TESTE!
require_once 'send_reports.php';
?>
```

Acesse: `https://seudominio.com/estoque/test_report.php`

### Verificar Logs

O script imprime informações sobre cada envio:
```
=== PROCESSAMENTO DE RELATÓRIOS ===
Data/Hora: 15/11/2025 08:00:00

Empresa: Minha Empresa Ltda
  Email: Enviado com sucesso para admin@empresa.com
  WhatsApp: Enviado com sucesso para 5511999999999

=== PROCESSAMENTO CONCLUÍDO ===
```

---

## 🔍 Troubleshooting

### ❌ Emails não estão sendo enviados

**Causa 1: Servidor não configurado para enviar emails**
```bash
# Teste se o servidor consegue enviar email
echo "Teste" | mail -s "Assunto" seu@email.com
```

**Solução**: Instale e configure um servidor SMTP (Postfix, SendGrid, etc.)

**Causa 2: Emails caindo no spam**
- Configure SPF, DKIM e DMARC no DNS
- Use um serviço de email profissional (SendGrid, Amazon SES)

### ❌ WhatsApp não está sendo enviado

**Causa 1: Evolution API não está conectada**
- Verifique se a instância está ativa
- Reconecte o QR Code se necessário

**Causa 2: Credenciais incorretas**
- Verifique URL, API Key e Nome da Instância
- Teste manualmente com curl (veja seção anterior)

**Causa 3: Número no formato errado**
- Use apenas números: `5511999999999`
- Não use: `+55 (11) 99999-9999`

### ❌ CRON não está executando

**Verificar se o cron está rodando:**
```bash
sudo systemctl status cron
```

**Ver logs do sistema:**
```bash
grep CRON /var/log/syslog
```

**Verificar permissões do arquivo:**
```bash
chmod +x /var/www/html/estoque/public_html/send_reports.php
```

**Testar caminho do PHP:**
```bash
which php  # Retorna: /usr/bin/php
```

### ❌ Erro de conexão com banco de dados

**Verifique o arquivo config.php:**
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'seu_usuario');
define('DB_PASS', 'sua_senha');
define('DB_NAME', 'nome_do_banco');
```

---

## 📚 Recursos Adicionais

### Links Úteis
- **Evolution API**: https://doc.evolution-api.com/
- **CRON Generator**: https://crontab.guru/
- **PHP mail()**: https://www.php.net/manual/en/function.mail.php

### Suporte
Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Execute o script manualmente para ver erros
3. Consulte a documentação da Evolution API

---

## 📝 Exemplo de Relatório

### Email (HTML)
![Email Report Example](relatório formatado com cabeçalho colorido, estatísticas em cards, tabelas organizadas)

### WhatsApp (Texto)
```
📊 RELATÓRIO DE ESTOQUE
━━━━━━━━━━━━━━━━━━━━━━
Empresa: Minha Empresa
Data: 15/11/2025 08:00:00

📈 RESUMO GERAL
• Produtos: 150
• Categorias: 12
• Fornecedores: 8
• Valor Total: R$ 45.320,50

⚠️ ESTOQUE BAIXO (5)
• Produto A - Atual: 3 / Mín: 10
• Produto B - Atual: 5 / Mín: 15
...

🚫 SEM ESTOQUE (3)
• Produto X
• Produto Y
...

📦 MOVIMENTAÇÕES (24h) - 15 registros
• Entradas: 8
• Saídas: 7

━━━━━━━━━━━━━━━━━━━━━━
Relatório automático do Sistema de Gestão de Estoque
```

---

**Última atualização**: Novembro 2025
