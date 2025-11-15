# 🎯 SOLUÇÃO DEFINITIVA - Credenciais Inválidas

## 🔴 PROBLEMA IDENTIFICADO!

Você está tentando testar **LOCALMENTE**, mas o banco MySQL está em um **SERVIDOR REMOTO** que **BLOQUEIA** conexões externas na porta 3306!

```
Seu computador (localhost) ❌ BLOQUEADO ❌ → MySQL (148.113.165.172:3306)
```

### ⚠️ Por isso o erro "Credenciais inválidas":
- Frontend localhost tenta conectar em localhost:3001 (backend Node.js)
- Backend Node.js tenta conectar em 148.113.165.172:3306 (MySQL remoto)
- **MySQL remoto RECUSA a conexão** (porta bloqueada por firewall)
- Backend não consegue validar login
- Frontend recebe erro "Credenciais inválidas"

---

## ✅ SOLUÇÕES DISPONÍVEIS

### **OPÇÃO 1: Testar no Servidor (RECOMENDADO)** 🌐

Você PRECISA fazer deploy completo no servidor AlmaLinux:

```bash
# 1. Build local
npm run deploy

# 2. Upload para servidor
# Envie public_html/ via FTP/cPanel File Manager

# 3. Criar tabelas no servidor
# cPanel → phpMyAdmin → Executar schema.sql

# 4. Testar no servidor
https://seudominio.com
Login: admin@sistema.com / 123456
```

**Por que funciona:**
```
Navegador → seudominio.com → PHP (mesmo servidor) → MySQL localhost ✅
```

---

### **OPÇÃO 2: MySQL Local para Desenvolvimento** 🖥️

Instale MySQL localmente para poder desenvolver:

#### Windows:

```powershell
# 1. Baixar MySQL
# https://dev.mysql.com/downloads/installer/

# 2. Instalar MySQL Community Server
# Use senha: 123456 (para desenvolvimento)

# 3. Criar banco
mysql -u root -p
CREATE DATABASE dona_estoqueg;
CREATE USER 'dona_estoqueg'@'localhost' IDENTIFIED BY 'nYW0bHpnYW0bHp';
GRANT ALL PRIVILEGES ON dona_estoqueg.* TO 'dona_estoqueg'@'localhost';
FLUSH PRIVILEGES;
exit;

# 4. Importar schema
cd "D:\Estoque Gemini\server"
mysql -u dona_estoqueg -p dona_estoqueg < database\schema.sql

# 5. Atualizar .env
DB_HOST=localhost
DB_USER=dona_estoqueg
DB_PASSWORD=nYW0bHpnYW0bHp
DB_NAME=dona_estoqueg
PORT=3001

# 6. Iniciar backend
cd server
npm start

# 7. Iniciar frontend (outro terminal)
npm run dev

# 8. Testar
http://localhost:5173
Login: admin@sistema.com / 123456
```

---

### **OPÇÃO 3: Arquivo de Teste HTML (SEM BACKEND)** 📄

Use o arquivo `test-login-local.html` que criei:

```bash
# 1. Abra o arquivo no navegador
start test-login-local.html

# 2. Mude para "Produção (mesmo domínio)"

# 3. Teste cada usuário clicando neles
```

---

## 🎯 QUAL OPÇÃO USAR?

### Você quer apenas TESTAR se funciona?
→ **USE OPÇÃO 1** (deploy no servidor)

### Você quer DESENVOLVER localmente?
→ **USE OPÇÃO 2** (MySQL local)

### Você já fez deploy mas não funciona?
→ **Continue lendo abaixo** ⬇️

---

## 🔍 CHECKLIST - Deploy no Servidor

Se você já fez upload para o servidor mas continua dando erro:

### ✅ 1. Arquivos enviados corretamente?

```bash
# Verifique se existem no servidor via cPanel File Manager:
public_html/
├── index.html          ← Build do frontend
├── assets/             ← CSS/JS minificado
├── api.php             ← Backend PHP
├── config.php          ← (se existir)
├── .htaccess           ← MUITO IMPORTANTE!
└── test-db.php         ← Arquivo de teste
```

### ✅ 2. Tabelas criadas no MySQL?

```sql
-- No phpMyAdmin, execute:
SHOW TABLES;

-- Deve retornar:
categories
companies
products
stock_movements
suppliers
users
```

Se não retornar, **execute schema.sql completo**!

### ✅ 3. Usuários existem no banco?

```sql
-- No phpMyAdmin:
SELECT email, password, role FROM users;

-- Deve retornar:
admin@sistema.com | 123456 | Super Admin
joao@empresa.com  | 123456 | Admin
maria@empresa.com | 123456 | Manager
pedro@empresa.com | 123456 | Employee
```

Se vazio, **execute os INSERTs do schema.sql**!

### ✅ 4. Teste a conexão do banco

```bash
# Acesse no navegador:
https://seudominio.com/test-db.php

# Deve retornar JSON com:
{
  "connection": true,
  "tables": [...],
  "users": [...],
  "test_login": {
    "success": true,
    ...
  }
}
```

**Se retornar erro:**
- ❌ `"connection": false` → Credenciais do banco incorretas em api.php
- ❌ `"tables": []` → Execute schema.sql
- ❌ `"users": []` → Execute INSERTs do schema.sql
- ❌ `"test_login": { "success": false }` → Senha incorreta ou usuário não existe

### ✅ 5. Prefixo do cPanel

O cPanel pode adicionar prefixo ao usuário/banco:

```php
// Verifique em cPanel → MySQL Databases
// Se mostrar: cpaneluser_dona_estoqueg

// Edite public_html/api.php linha 18-21:
define('DB_USER', 'cpaneluser_dona_estoqueg');  // ← Adicionar prefixo
define('DB_NAME', 'cpaneluser_dona_estoqueg');  // ← Adicionar prefixo
```

### ✅ 6. Teste a API diretamente

```bash
# Windows PowerShell:
$body = @{
    email = "admin@sistema.com"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://seudominio.com/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

# Deve retornar dados do usuário
# Se retornar erro 401: Credenciais incorretas
# Se retornar erro 404: API não configurada (.htaccess)
# Se retornar erro 500: Erro no PHP (veja logs)
```

---

## 🚨 ERROS COMUNS

### ❌ "Credenciais inválidas" no servidor

**Causa:** Tabela users vazia ou senha incorreta

**Solução:**
```sql
-- No phpMyAdmin:
SELECT * FROM users WHERE email = 'admin@sistema.com';

-- Se retornar vazio:
INSERT INTO users (name, email, password, role, company, avatar) VALUES 
('Admin Sistema', 'admin@sistema.com', '123456', 'Super Admin', 'Tech Solutions', 'https://picsum.photos/seed/admin/100');
```

### ❌ "CORS error" no console

**Causa:** .htaccess não foi enviado

**Solução:**
```bash
# Certifique-se que .htaccess existe em public_html/
# No File Manager, marque "Mostrar arquivos ocultos"
# Re-envie o arquivo se necessário
```

### ❌ "404 Not Found" na API

**Causa:** .htaccess não está funcionando

**Solução:**
```apache
# Verifique se mod_rewrite está ativo no Apache
# Adicione em .htaccess:
RewriteEngine On
RewriteRule ^api/(.*)$ api.php [L,QSA]
```

### ❌ Backend localhost não conecta

**Causa:** MySQL remoto bloqueado (porta 3306)

**Solução:**
- Use MySQL local (OPÇÃO 2)
- Ou faça deploy no servidor (OPÇÃO 1)

---

## 📝 RESUMO EXECUTIVO

### Você está testando LOCALMENTE?
```
❌ NÃO VAI FUNCIONAR!
→ MySQL remoto bloqueia conexão
→ Use MySQL local OU faça deploy no servidor
```

### Você está testando NO SERVIDOR?
```
✅ DEVE FUNCIONAR!
→ Verifique checklist acima
→ Use test-db.php para diagnosticar
→ Execute schema.sql se necessário
```

---

## 🎯 AÇÃO IMEDIATA

Execute AGORA para resolver:

```bash
# 1. Teste se banco está acessível no servidor
# Acesse: https://seudominio.com/test-db.php

# 2a. Se funcionar → Use credenciais mostradas
# 2b. Se não funcionar → Execute schema.sql no phpMyAdmin

# 3. Teste login no site
# Acesse: https://seudominio.com
# Login: admin@sistema.com / 123456
```

---

## 📞 NEED HELP?

1. **Execute test-db.php** e me mostre o resultado
2. **Execute no phpMyAdmin**: `SELECT * FROM users;` e me mostre
3. **Me diga**: Está testando local ou no servidor?

Com essas informações posso ajudar melhor! 🚀
