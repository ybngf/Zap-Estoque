# 🚀 Guia de Deploy - AlmaLinux + cPanel + Apache

## 📦 Arquivos Preparados para Deploy

O sistema foi completamente adaptado para funcionar em servidor AlmaLinux com cPanel e Apache.

### ✅ O que foi criado:

1. **Backend PHP** (`public_html/api.php`) - API completa em PHP
2. **Configuração Apache** (`public_html/.htaccess`) - Regras de rewrite e CORS
3. **Build do Frontend** - Configurado para gerar em `public_html/`
4. **Configuração de produção** - API dinâmica detecta ambiente

---

## 📋 PASSO A PASSO DO DEPLOY

### **1️⃣ PREPARAR O BANCO DE DADOS**

#### Via cPanel - phpMyAdmin:

1. Acesse o cPanel: `https://seudominio.com:2083`
2. Vá em **MySQL® Databases**
3. Crie um banco de dados (ou use o existente `dona_estoqueg`)
4. Anote as credenciais:
   - Host: `localhost`
   - Usuário: `dona_estoqueg`
   - Senha: `nYW0bHpnYW0bHp`
   - Database: `dona_estoqueg`

5. Abra **phpMyAdmin**
6. Selecione o banco `dona_estoqueg`
7. Clique em **SQL**
8. Copie todo o conteúdo de `server/database/schema.sql`
9. Cole e clique em **Executar**

✅ O banco de dados estará criado com todas as tabelas e dados iniciais!

---

### **2️⃣ FAZER BUILD DO FRONTEND**

No seu computador local, execute:

```bash
cd "d:\Estoque Gemini"
npm run deploy
```

Isso irá:
- Compilar o React/TypeScript
- Minificar os arquivos
- Gerar tudo dentro de `public_html/`

---

### **3️⃣ UPLOAD DOS ARQUIVOS**

#### Opção A: Via cPanel File Manager

1. Acesse cPanel → **File Manager**
2. Vá para a pasta `public_html/` (ou `www/` dependendo da configuração)
3. **Delete tudo** que estiver lá (ou faça backup antes)
4. Faça upload de **todos os arquivos** da pasta `public_html/` local:
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── *.js
   │   ├── *.css
   │   └── *.svg
   ├── api.php
   ├── config.php
   └── .htaccess
   ```

#### Opção B: Via FTP/SFTP

```bash
# Usando FileZilla ou similar
Host: seudominio.com ou 148.113.165.172
Porta: 21 (FTP) ou 22 (SFTP)
Usuário: seu_usuario_cpanel
Senha: sua_senha_cpanel

# Upload todos os arquivos de public_html/ para public_html/ do servidor
```

#### Opção C: Via SSH (Recomendado)

```bash
# Conectar via SSH
ssh usuario@148.113.165.172

# No servidor, criar backup
cd ~/public_html
tar -czf backup_$(date +%Y%m%d).tar.gz *
mv backup_*.tar.gz ~/

# Limpar pasta
rm -rf ~/public_html/*

# Do seu computador, fazer upload via SCP
scp -r "d:\Estoque Gemini\public_html\*" usuario@148.113.165.172:~/public_html/
```

---

### **4️⃣ CONFIGURAR PERMISSÕES**

Via cPanel File Manager ou SSH:

```bash
# Via SSH
cd ~/public_html
chmod 644 *.php
chmod 644 *.html
chmod 644 .htaccess
chmod 755 assets/
```

Via cPanel File Manager:
- Selecione todos os arquivos .php e .html
- Clique em **Permissions**
- Defina como `644`

---

### **5️⃣ CONFIGURAR O ARQUIVO API.PHP**

Edite `public_html/api.php` e verifique as credenciais do banco:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'dona_estoqueg');
define('DB_PASS', 'nYW0bHpnYW0bHp');
define('DB_NAME', 'dona_estoqueg');
```

Se o cPanel criou um prefixo no usuário (ex: `cpanel_dona_estoqueg`), atualize!

---

### **6️⃣ VERIFICAR .HTACCESS**

Certifique-se que o `.htaccess` foi enviado e está configurado:

```apache
# Deve conter estas regras:
RewriteEngine On
RewriteRule ^api/(.*)$ api.php [L,QSA]
```

Se o arquivo não foi enviado (às vezes é oculto), crie manualmente no cPanel File Manager.

---

### **7️⃣ TESTAR A APLICAÇÃO**

#### Teste 1: API Health Check
Acesse: `https://seudominio.com/api/health`

Deve retornar:
```json
{"status":"ok","message":"Server is running"}
```

#### Teste 2: Login
Acesse: `https://seudominio.com`

Faça login com:
- **Email:** admin@sistema.com
- **Senha:** 123456

✅ Se funcionar, está tudo pronto!

---

## 🔧 TROUBLESHOOTING

### ❌ Erro 500 - Internal Server Error

**Causa:** Problema no .htaccess ou PHP

**Solução:**
```bash
# Verificar logs do Apache
tail -f ~/logs/error_log

# Ou via cPanel → Error Log

# Testar se mod_rewrite está ativo
# No .htaccess, adicione no topo:
Options +FollowSymLinks
```

### ❌ API não responde (404)

**Causa:** Rewrite rules não estão funcionando

**Solução:**
1. Verifique se o `.htaccess` existe
2. Teste diretamente: `https://seudominio.com/api.php`
3. Se funcionar, o problema é no mod_rewrite
4. Contate o suporte do hosting para habilitar mod_rewrite

### ❌ CORS Error no navegador

**Causa:** Headers CORS não configurados

**Solução:**
Edite `api.php` e verifique se tem:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

### ❌ Erro de conexão com banco de dados

**Causa:** Credenciais incorretas ou prefixo do cPanel

**Solução:**
1. Verifique no cPanel → MySQL Databases o nome exato do usuário
2. O cPanel pode adicionar prefixo: `cpaneluser_dona_estoqueg`
3. Teste a conexão:
```php
<?php
$conn = new mysqli('localhost', 'usuario', 'senha', 'banco');
if ($conn->connect_error) {
    die("Erro: " . $conn->connect_error);
}
echo "Conectado!";
?>
```

### ❌ Página em branco / Assets não carregam

**Causa:** Caminho base incorreto

**Solução:**
1. Verifique se `vite.config.ts` tem `base: './'`
2. Refaça o build: `npm run deploy`
3. Reenvie os arquivos

---

## 📁 ESTRUTURA NO SERVIDOR

```
~/public_html/
├── index.html              # ← Frontend React (build)
├── assets/                 # ← CSS, JS, Images
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── ...
├── api.php                 # ← Backend PHP (API REST)
├── config.php              # ← Configurações
└── .htaccess               # ← Regras Apache
```

---

## 🔐 SEGURANÇA PÓS-DEPLOY

### Recomendações imediatas:

1. **Mudar senhas padrão:**
   ```sql
   UPDATE users SET password = 'nova_senha_forte' WHERE email = 'admin@sistema.com';
   ```

2. **HTTPS:**
   - Ative SSL/TLS no cPanel (Let's Encrypt é grátis)
   - Force HTTPS no .htaccess:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

3. **Firewall:**
   - Configure CSF/ConfigServer no cPanel
   - Bloqueie países/IPs suspeitos

4. **Backup:**
   - Configure backup automático no cPanel
   - Backup do banco de dados semanalmente

5. **Hash de senhas:**
   - Implemente bcrypt/password_hash() no PHP
   - Atualize a função de login

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy completo:

- [ ] Banco de dados criado e populado
- [ ] Build do frontend executado
- [ ] Arquivos enviados para public_html/
- [ ] Permissões configuradas (644/755)
- [ ] .htaccess enviado e funcionando
- [ ] Credenciais do banco corretas no api.php
- [ ] Teste: /api/health retorna OK
- [ ] Teste: Login funciona
- [ ] Teste: CRUD de produtos funciona
- [ ] SSL/HTTPS configurado
- [ ] Senhas padrão alteradas
- [ ] Backup configurado

---

## 🎉 SUCESSO!

Seu sistema de estoque está no ar em:
**`https://seudominio.com`**

### Credenciais de acesso:
- **Super Admin:** admin@sistema.com / 123456
- **Admin:** joao@empresa.com / 123456
- **Manager:** maria@empresa.com / 123456
- **Employee:** pedro@empresa.com / 123456

**⚠️ ALTERE AS SENHAS IMEDIATAMENTE APÓS O PRIMEIRO LOGIN!**

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: cPanel → Error Log
2. Teste a API diretamente: /api/health
3. Verifique permissões dos arquivos
4. Confirme mod_rewrite está ativo

Boa sorte! 🚀
