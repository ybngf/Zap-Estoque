# Arquivos de Deploy - Estoque Gemini

Este diretório contém os arquivos preparados para deploy em servidor AlmaLinux com cPanel e Apache.

## 📁 Estrutura

```
public_html/
├── api.php          # API Backend em PHP (conecta ao MySQL localmente)
├── config.php       # Configurações do banco de dados
├── .htaccess        # Regras de rewrite do Apache + CORS
├── index.html       # Frontend React (gerado após build)
└── assets/          # CSS, JS, imagens (gerados após build)
```

## 🔧 Como usar

### 1. Fazer Build

Execute no terminal:
```bash
npm run deploy
```

Isso irá compilar o React e gerar os arquivos em `public_html/`

### 2. Upload para o servidor

Três opções:

**A) Via cPanel File Manager:**
- Faça upload de todos os arquivos desta pasta para `public_html/` do servidor

**B) Via FTP:**
- Use FileZilla ou similar
- Envie todo conteúdo desta pasta para `public_html/` do servidor

**C) Via SSH/SCP:**
```bash
scp -r public_html/* usuario@servidor:/home/usuario/public_html/
```

### 3. Configurar banco de dados

Edite `api.php` e ajuste as credenciais se necessário:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'dona_estoqueg');
define('DB_PASS', 'nYW0bHpnYW0bHp');
define('DB_NAME', 'dona_estoqueg');
```

### 4. Executar SQL

Via phpMyAdmin, execute o conteúdo de `../server/database/schema.sql`

## ⚙️ Configurações importantes

### api.php
- Backend completo em PHP
- Todas as rotas da API implementadas
- Conecta ao MySQL via localhost (padrão cPanel)

### .htaccess
- Rewrite rules para API routing
- CORS habilitado
- Compressão de arquivos
- Cache de browser
- Headers de segurança

### config.php
- Credenciais do banco de dados
- Configurações da aplicação
- Timezone (America/Sao_Paulo)

## 🧪 Testar

Após o deploy, teste:

1. **Health Check:**
   ```
   https://seudominio.com/api/health
   ```
   
2. **Login:**
   ```
   https://seudominio.com
   Email: admin@sistema.com
   Senha: 123456
   ```

## 📚 Documentação

Veja o guia completo em `../DEPLOY_GUIDE.md`

## 🔒 Segurança

**IMPORTANTE:** Após o deploy:
- Mude as senhas padrão
- Ative SSL/HTTPS
- Configure backups
- Considere implementar hash de senhas (bcrypt)
