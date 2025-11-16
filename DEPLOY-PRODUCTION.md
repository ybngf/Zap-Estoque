# 🚀 Checklist de Deploy para Produção

## ✅ Arquivos Necessários no Servidor

Certifique-se de que estes arquivos estão no servidor:

```
public_html/
├── .htaccess
├── api.php
├── config.php
├── index.html
└── assets/
    └── index-DXxAxxDB.js
```

## ⚙️ Configurações Obrigatórias

### 1. **Editar `config.php`**

Atualize as credenciais do banco de dados no servidor:

```php
define('DB_HOST', 'localhost');           // Host do MySQL (geralmente localhost)
define('DB_USER', 'seu_usuario_cpanel');  // ⚠️ MUDAR!
define('DB_PASS', 'sua_senha_mysql');     // ⚠️ MUDAR!
define('DB_NAME', 'seu_database_name');   // ⚠️ MUDAR!
```

### 2. **Verificar `.htaccess`**

Se os arquivos estão na **raiz** do site (public_html):
- ✅ O arquivo atual está correto

Se os arquivos estão em um **subdiretório** (ex: public_html/sistema):
- Descomente e ajuste: `RewriteBase /sistema/`

### 3. **Permissões de Arquivos**

Execute no terminal do cPanel ou SSH:

```bash
chmod 644 index.html
chmod 644 .htaccess
chmod 644 config.php
chmod 644 api.php
chmod 755 assets
chmod 644 assets/index-DXxAxxDB.js
```

### 4. **Criar Banco de Dados**

**Opção A - Via cPanel:**
1. MySQL Databases → Create New Database
2. Nome: `estoque_gemini` (ou outro)
3. MySQL Users → Create New User
4. Vincular usuário ao banco
5. Dar permissão: ALL PRIVILEGES

**Opção B - Via PHPMyAdmin:**
1. Importar o dump do banco de dados
2. Verificar se todas as tabelas foram criadas

## 🔍 Testes Após Deploy

### 1. Teste de Acesso
- Acesse: `https://seusite.com/`
- Deve carregar a tela de login

### 2. Teste da API
- Acesse: `https://seusite.com/api/health`
- Deve retornar: `{"status":"ok","message":"Server is running"}`

### 3. Teste de Login
- Tente fazer login com suas credenciais
- Se falhar, verifique o console do navegador (F12)

### 4. Teste de Conexão com Banco
- Criar um arquivo temporário `test-db.php`:

```php
<?php
require_once 'config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("❌ Erro: " . $conn->connect_error);
}

echo "✅ Conexão com banco OK!<br>";
echo "Database: " . DB_NAME . "<br>";

$tables = $conn->query("SHOW TABLES");
echo "Tabelas encontradas: " . $tables->num_rows . "<br>";

while($row = $tables->fetch_array()) {
    echo "- " . $row[0] . "<br>";
}

$conn->close();
?>
```

- Acesse: `https://seusite.com/test-db.php`
- **IMPORTANTE**: Deletar este arquivo após teste!

## 🐛 Resolução de Problemas

### Página em Branco
- ✅ Já corrigido: removido `/index.css` e `/vite.svg`
- Verifique console do navegador (F12)
- Verifique se JavaScript está carregando

### Erro 500
- Verifique permissões dos arquivos
- Verifique logs de erro do PHP no cPanel
- Verifique se `mod_rewrite` está ativo

### API não funciona
- Verifique `.htaccess`
- Teste: `https://seusite.com/api.php?path=health`
- Verifique se `config.php` tem credenciais corretas

### Erro de Conexão com Banco
- Verifique credenciais em `config.php`
- Verifique se usuário tem permissões no banco
- Verifique se banco de dados existe

## 📋 Tabelas do Banco de Dados

O sistema precisa destas tabelas:

1. `companies` - Empresas
2. `users` - Usuários
3. `categories` - Categorias
4. `suppliers` - Fornecedores
5. `products` - Produtos
6. `stock_movements` - Movimentações de estoque
7. `activity_log` - Log de atividades

Se não existirem, importe o dump do banco ou rode o script de criação.

## 🔒 Segurança em Produção

- ✅ `config.php` já está configurado para não mostrar erros
- ✅ `.htaccess` já tem headers de segurança
- ⚠️ **Nunca** commitar `config.php` com senhas reais no GitHub
- ⚠️ Sempre usar HTTPS em produção

## 📞 Suporte

Se encontrar problemas:

1. Verifique console do navegador (F12)
2. Verifique logs de erro do PHP (cPanel → Error Logs)
3. Teste cada componente separadamente
4. Verifique credenciais do banco de dados

---

**Última atualização:** 15/11/2025
**Versão do Sistema:** 1.0.0
