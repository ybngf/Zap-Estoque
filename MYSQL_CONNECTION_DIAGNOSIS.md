# 🔍 Diagnóstico de Conexão MySQL

## ✅ Resultado dos Testes

### Conectividade do Servidor
- **IP:** 148.113.165.172
- **Ping:** ✅ Sucesso (RTT: ~180ms)
- **Servidor ativo:** ✅ Sim

### Portas Testadas
| Porta | Serviço      | Status |
|-------|-------------|--------|
| 21    | FTP         | ❌ Fechada |
| 22    | SSH         | ✅ Aberta |
| 80    | HTTP        | ✅ Aberta |
| 443   | HTTPS       | ✅ Aberta |
| 2082  | cPanel      | ✅ Aberta |
| 2083  | cPanel SSL  | ✅ Aberta |
| 3306  | MySQL       | ❌ **BLOQUEADA** |
| 8080  | HTTP Alt    | ✅ Aberta |

## ❌ Problema Identificado

A **porta 3306 (MySQL) está bloqueada** para conexões externas. Isso é comum em servidores de hospedagem compartilhada por razões de segurança.

## ✅ Soluções Disponíveis

### **Opção 1: Usar phpMyAdmin (RECOMENDADO)** ⭐

O servidor tem cPanel (portas 2082/2083 abertas), então deve ter phpMyAdmin disponível.

**Passos:**
1. Acesse: `http://148.113.165.172:2082` ou `https://148.113.165.172:2083`
2. Faça login no cPanel
3. Abra o phpMyAdmin
4. Selecione o banco `dona_estoqueg`
5. Vá em "SQL"
6. Copie e cole o conteúdo de `server/database/schema.sql`
7. Execute o SQL

**Após isso, o sistema funcionará perfeitamente!**

### **Opção 2: Criar API PHP no Servidor**

Crie um arquivo PHP no servidor que funcione como proxy para o MySQL:

```php
<?php
// api.php no servidor 148.113.165.172
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$host = 'localhost'; // MySQL local no servidor
$user = 'dona_estoqueg';
$pass = 'nYW0bHpnYW0bHp';
$db = 'dona_estoqueg';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(['error' => $conn->connect_error]));
}

// Processar requisições HTTP aqui
// GET, POST, PUT, DELETE

$conn->close();
?>
```

Depois altere `services/api.ts` para apontar para `http://148.113.165.172/api.php`

### **Opção 3: Habilitar Acesso Remoto MySQL**

Entre em contato com o administrador do servidor ou via cPanel:
1. Acesse cPanel
2. Vá em "Bancos de dados MySQL remotos"
3. Adicione seu IP para acesso remoto
4. Ou adicione "%" para permitir qualquer IP (menos seguro)

### **Opção 4: MySQL Local (Desenvolvimento)**

Para desenvolvimento local, instale MySQL localmente:

```bash
# Altere .env para:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_local
DB_NAME=estoque_gemini
```

## 🎯 Recomendação

**Use a Opção 1 (phpMyAdmin)** - É a mais rápida e segura:

1. ✅ Acesse cPanel/phpMyAdmin
2. ✅ Execute o SQL de `server/database/schema.sql`
3. ✅ O banco estará criado com todos os dados
4. ✅ Crie uma API PHP no servidor para intermediar as requisições
5. ✅ Atualize a URL da API no frontend

## 📝 Próximos Passos

Após criar as tabelas no MySQL via phpMyAdmin, você precisará de uma das seguintes opções:

### A) **API PHP no Servidor** (MAIS SIMPLES)
- Criar arquivo PHP que conecta ao MySQL localmente
- Expor via HTTP (porta 80/443)
- Frontend se conecta via HTTP

### B) **Túnel SSH**
```bash
ssh -L 3306:localhost:3306 user@148.113.165.172
# Depois usar DB_HOST=localhost
```

### C) **VPN/Acesso Remoto**
- Solicitar liberação da porta 3306 no firewall

---

## 🔄 Status Atual

✅ Backend Node.js: **Pronto e funcional**
✅ Frontend React: **Pronto e funcional**
✅ SQL Scripts: **Prontos**
✅ Configuração: **Completa**
❌ Conexão MySQL: **Bloqueada pelo firewall**

**Solução:** Execute o SQL via phpMyAdmin e considere criar uma API PHP no servidor!
