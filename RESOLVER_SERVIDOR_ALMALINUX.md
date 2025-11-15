# 🎯 GUIA DE RESOLUÇÃO - Servidor AlmaLinux

## ✅ SITUAÇÃO ATUAL

Você está testando **NO SERVIDOR AlmaLinux** e:
- ✅ MySQL está acessível
- ❌ Login continua dando "Credenciais inválidas"

---

## 🔍 DIAGNÓSTICO COMPLETO

Execute ESTES ARQUIVOS no servidor para identificar o problema:

### 1️⃣ Super Diagnóstico (MAIS COMPLETO)

```bash
# Envie para o servidor:
public_html/super-diagnostico.php

# Acesse no navegador:
https://seudominio.com/super-diagnostico.php
```

**O que ele faz:**
- ✅ Testa conexão MySQL
- ✅ Lista todas as tabelas
- ✅ Mostra estrutura da tabela users
- ✅ Lista TODOS os usuários com suas senhas
- ✅ Testa login com query exata do api.php
- ✅ Compara senhas byte-por-byte
- ✅ Mostra hex dump das senhas
- ✅ Verifica arquivos e permissões
- ✅ Dá diagnóstico final com soluções

### 2️⃣ Diagnóstico HTML (Interface Visual)

```bash
# Envie para o servidor:
public_html/diagnostico-servidor.html

# Acesse no navegador:
https://seudominio.com/diagnostico-servidor.html
```

**O que ele faz:**
- Interface visual com botões
- Testa cada componente separadamente
- Mostra resultados coloridos
- Guias passo a passo

### 3️⃣ Test-DB (JSON API)

```bash
# Já existe:
public_html/test-db.php

# Acesse:
https://seudominio.com/test-db.php
```

---

## 🎯 CAUSAS MAIS PROVÁVEIS

### ❌ PROBLEMA #1: Senhas com espaços em branco

```sql
-- No phpMyAdmin, execute:
SELECT 
    email, 
    CONCAT('[', password, ']') as senha_visual,
    LENGTH(password) as tamanho,
    HEX(password) as hex_senha
FROM users;

-- Se mostrar senha com tamanho > 6, tem espaços extras!
```

**SOLUÇÃO:**
```sql
UPDATE users SET password = TRIM(password);
```

### ❌ PROBLEMA #2: Senha está com hash (não texto puro)

```sql
-- Verifique se senha é "123456" ou algo como:
-- "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"

SELECT email, password FROM users;

-- Se for hash, precisa recriar:
UPDATE users SET password = '123456' WHERE email = 'admin@sistema.com';
```

### ❌ PROBLEMA #3: Charset/Encoding diferente

```sql
-- Verificar charset:
SHOW VARIABLES LIKE 'character_set%';

-- Corrigir se necessário:
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
UPDATE users SET password = '123456';
```

### ❌ PROBLEMA #4: Prefixo do cPanel

```php
// Verifique em api.php linha 18-21:

// Se no cPanel o usuário aparece como:
// "cpaneluser_dona_estoqueg"

// Atualize api.php:
define('DB_USER', 'cpaneluser_dona_estoqueg'); // ← Adicionar prefixo
define('DB_NAME', 'cpaneluser_dona_estoqueg'); // ← Adicionar prefixo
```

### ❌ PROBLEMA #5: api.php não recebe dados POST

```bash
# Via SSH, teste:
curl -X POST https://seudominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"123456"}'

# Se retornar erro 401, veja logs:
tail -f ~/logs/error_log
```

**Verifique nos logs:**
```
Login attempt - Email: admin@sistema.com | Password length: 6
Email exists but password mismatch - DB password: 123456
```

Se mostrar "password mismatch" mas as senhas parecem iguais, é problema de charset!

---

## 📋 CHECKLIST DE RESOLUÇÃO

Execute NA ORDEM:

### ☑️ 1. Upload de Arquivos Atualizados

```bash
# Certifique-se que enviou ESTES arquivos:

public_html/
├── api.php                      ← VERSÃO COM DEBUG
├── super-diagnostico.php        ← NOVO
├── diagnostico-servidor.html    ← NOVO
├── test-db.php                  ← Já existe
├── .htaccess                    ← IMPORTANTE!
├── index.html                   ← Build frontend
└── assets/                      ← Build frontend
```

### ☑️ 2. Execute Super Diagnóstico

```
Acesse: https://seudominio.com/super-diagnostico.php
```

**Analise a seção 6️⃣ "TESTE DE LOGIN - QUERY DIRETA"**

- ✅ Se mostrar "LOGIN OK" → O problema é no api.php ou .htaccess
- ❌ Se mostrar "LOGIN FALHOU" → Veja o que diz abaixo:
  - "Email EXISTE no banco" → Problema na senha
  - "Senha no banco: ' 123456 '" (com espaços) → Execute TRIM
  - "Hex senha DB diferente" → Problema de encoding

### ☑️ 3. Verifique Logs do Apache

```bash
# Via SSH:
tail -f ~/logs/error_log

# Em outro terminal, tente fazer login no site
# Veja as mensagens que aparecem no log
```

### ☑️ 4. Teste API Direto

```bash
# Via SSH ou terminal local:
curl -X POST https://seudominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"123456"}' \
  -v

# -v mostra headers completos
# Verifique se retorna 200 OK ou 401 Unauthorized
```

### ☑️ 5. Verifique Permissões

```bash
# Via SSH:
cd ~/public_html
chmod 644 api.php
chmod 644 .htaccess
chmod 644 index.html
chmod 755 .
```

### ☑️ 6. Limpe Cache

```bash
# No navegador:
# 1. Pressione Ctrl+Shift+Del
# 2. Limpe cache e cookies
# 3. Ou use navegador anônimo

# Via cPanel:
# Se tiver Redis/Memcached, limpe
```

---

## 🔧 SOLUÇÕES RÁPIDAS

### Se super-diagnostico.php mostrar que login funciona via SQL:

```bash
# Problema está no api.php recebendo dados POST

# 1. Verifique .htaccess existe:
ls -la ~/public_html/.htaccess

# 2. Se não existir, crie:
cat > ~/public_html/.htaccess << 'EOF'
RewriteEngine On
RewriteRule ^api/(.*)$ api.php [L,QSA]

<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
EOF

# 3. Teste novamente
```

### Se senhas estiverem com espaços:

```sql
-- No phpMyAdmin:
UPDATE users SET password = TRIM(password);

-- Ou recriar todos:
UPDATE users SET password = '123456' WHERE email LIKE '%@%';
```

### Se senha estiver com hash:

```sql
-- Deletar e recriar usuários:
DELETE FROM users;

INSERT INTO users (name, email, password, role, company, avatar) VALUES 
('Admin Sistema', 'admin@sistema.com', '123456', 'Super Admin', 'Tech Solutions', 'https://picsum.photos/seed/admin/100'),
('João Silva', 'joao@empresa.com', '123456', 'Admin', 'Tech Solutions', 'https://picsum.photos/seed/joao/100'),
('Maria Santos', 'maria@empresa.com', '123456', 'Manager', 'Retail Corp', 'https://picsum.photos/seed/maria/100'),
('Pedro Costa', 'pedro@empresa.com', '123456', 'Employee', 'Manufacturing Inc', 'https://picsum.photos/seed/pedro/100');
```

---

## 🚨 COMANDOS DE EMERGÊNCIA

### Reset Completo do Banco:

```sql
-- NO PHPMYADMIN:

-- 1. Dropar todas as tabelas
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

-- 2. Executar schema.sql completo novamente
-- (copie e cole TODO o conteúdo de server/database/schema.sql)
```

### Verificar se MySQL está realmente acessível:

```bash
# Via SSH:
mysql -u dona_estoqueg -p

# Digite a senha quando pedir
# Se conectar, MySQL está OK
# Se não conectar, problema nas credenciais

# Dentro do MySQL:
USE dona_estoqueg;
SELECT email, password FROM users;
exit;
```

---

## 📊 RESULTADO ESPERADO

Depois de executar `super-diagnostico.php`, você deve ver:

```
✅ ✅ ✅ TUDO OK! SISTEMA PRONTO! ✅ ✅ ✅

🎯 Próximos passos:
1. Acesse o sistema: seudominio.com
2. Faça login com: admin@sistema.com / 123456
3. 🔒 IMPORTANTE: Remova este arquivo (super-diagnostico.php) do servidor!
```

Se NÃO ver isso, o diagnóstico mostrará EXATAMENTE qual é o problema!

---

## 🆘 AINDA NÃO FUNCIONA?

**Me envie:**

1. Screenshot do `super-diagnostico.php` (seção 6️⃣)
2. Resultado de: `SELECT email, password FROM users;` (via phpMyAdmin)
3. Últimas linhas de: `tail -20 ~/logs/error_log`

Com essas 3 informações consigo identificar o problema! 🎯

---

## 📂 ARQUIVOS ATUALIZADOS

```
✅ public_html/api.php - COM DEBUG LOGS
✅ public_html/super-diagnostico.php - DIAGNÓSTICO COMPLETO
✅ public_html/diagnostico-servidor.html - INTERFACE VISUAL
✅ public_html/test-db.php - Teste básico
✅ components/Login.tsx - Email correto
```

**Envie todos para o servidor e execute super-diagnostico.php!** 🚀
