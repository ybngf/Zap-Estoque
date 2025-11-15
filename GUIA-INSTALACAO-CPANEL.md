# 🚀 GUIA DE INSTALAÇÃO - Estoque Gemini no cPanel

## 📋 Checklist Completo de Deploy

### ✅ 1. PREPARAR O BANCO DE DADOS NO cPanel

1. **Acesse o cPanel** em: https://donasalada.com/cpanel
2. **MySQL® Databases**
3. **Criar Novo Banco de Dados:**
   - Nome sugerido: `estoqueg` ou `estoque_gemini`
   - Anote o nome completo (será algo como: `donasala_estoqueg`)

4. **Criar Usuário do Banco:**
   - Usuário sugerido: `estoqueg_user`
   - Senha: **GERE UMA SENHA FORTE** (clique em "Password Generator")
   - ⚠️ **ANOTE USUÁRIO E SENHA!**

5. **Adicionar Usuário ao Banco:**
   - Banco: `donasala_estoqueg`
   - Usuário: `donasala_estoqueg_user`
   - Marque: **ALL PRIVILEGES** (Todos os Privilégios)

---

### ✅ 2. IMPORTAR O BANCO DE DADOS

1. **Exportar do Local (sua máquina):**
   - Abra phpMyAdmin local: http://localhost/phpmyadmin
   - Selecione banco: `dona_estoqueg`
   - Clique em **"Exportar"**
   - Método: **Rápido**
   - Formato: **SQL**
   - Clique em **"Executar"** → salva arquivo `.sql`

2. **Importar no cPanel:**
   - No cPanel, abra **phpMyAdmin**
   - Selecione o banco criado: `donasala_estoqueg`
   - Clique em **"Importar"**
   - Clique em **"Escolher arquivo"** → selecione o `.sql`
   - Clique em **"Executar"**
   - ✅ Sucesso: "Importação finalizada com sucesso"

---

### ✅ 3. CONFIGURAR O config.php

Edite o arquivo: `EstoqueGemini/config.php`

```php
<?php
/**
 * Database configuration for Estoque Gemini
 * Update these values according to your cPanel MySQL settings
 */

// Database credentials - ALTERE AQUI!
define('DB_HOST', 'localhost');                      // Geralmente é 'localhost'
define('DB_USER', 'donasala_estoqueg_user');         // Usuário do MySQL (com prefixo)
define('DB_PASS', 'SUA_SENHA_FORTE_AQUI');           // Senha que você criou
define('DB_NAME', 'donasala_estoqueg');              // Nome do banco (com prefixo)

// Application settings
define('APP_NAME', 'Estoque Gemini');
define('APP_VERSION', '1.0.0');
define('APP_ENV', 'production'); // production ou development

// Timezone
date_default_timezone_set('America/Sao_Paulo');

// Error reporting (disable in production)
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
?>
```

**⚠️ IMPORTANTE:**
- O **DB_USER** e **DB_NAME** geralmente tem um prefixo (ex: `donasala_`)
- Você encontra os nomes exatos no cPanel > MySQL Databases

---

### ✅ 4. EXECUTAR O DIAGNÓSTICO

Acesse no navegador:
```
https://www.donasalada.com/EstoqueGemini/diagnostico-online.php
```

**O que verificar:**

✅ **Conexão com MySQL** - deve estar verde  
✅ **Tabelas importadas** - deve listar: users, products, categories, etc.  
✅ **Usuários cadastrados** - deve mostrar os usuários  
✅ **Hash de senha** - deve ser bcrypt ($2y$...)  
✅ **Teste de senha** - alguma senha deve funcionar  

---

### ✅ 5. PROBLEMAS COMUNS E SOLUÇÕES

#### 🔴 **Erro: "Access denied for user"**
**Causa:** Usuário ou senha incorretos

**Solução:**
1. Volte no cPanel > MySQL Databases
2. Verifique o nome do usuário (tem prefixo?)
3. Clique em "Change Password" se esquecer a senha
4. Atualize o `config.php`

---

#### 🔴 **Erro: "Unknown database"**
**Causa:** Nome do banco incorreto

**Solução:**
1. No cPanel > MySQL Databases
2. Veja a lista "Current Databases"
3. Copie o nome EXATO (com prefixo)
4. Atualize `DB_NAME` no config.php

---

#### 🔴 **Tabelas não aparecem**
**Causa:** Importação falhou

**Solução:**
1. No phpMyAdmin, veja se há tabelas no banco
2. Se não, delete o banco e recrie
3. Re-importe o arquivo .sql
4. Verifique se o arquivo .sql não está vazio

---

#### 🔴 **Login não funciona**
**Causa:** Hash de senha incompatível

**Solução 1 - Recriar senha admin:**
```sql
-- Execute no phpMyAdmin do servidor online:
UPDATE users 
SET password = '$2y$10$YourNewHashHere' 
WHERE email = 'admin@sistema.com';
```

**Solução 2 - Usar script de reset:**
Acesse: `https://www.donasalada.com/EstoqueGemini/reset-password.php`

---

#### 🔴 **CORS Error no navegador**
**Causa:** Headers não configurados

**Solução:**
Verifique se o `api.php` tem estas linhas no topo:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

---

### ✅ 6. TESTAR O LOGIN

#### **Método 1: Via Frontend**
```
https://www.donasalada.com/EstoqueGemini/
```

#### **Método 2: Via Console do Navegador (F12)**
```javascript
fetch('https://www.donasalada.com/EstoqueGemini/api.php/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@sistema.com',
    password: '123456'
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

**Resposta esperada:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@sistema.com",
    ...
  }
}
```

---

### ✅ 7. ESTRUTURA DE ARQUIVOS NO SERVIDOR

```
public_html/
└── EstoqueGemini/
    ├── index.html                    ← Página inicial
    ├── config.php                    ← CONFIGURAR AQUI!
    ├── api.php                       ← Backend API
    ├── diagnostico-online.php        ← Ferramenta de diagnóstico
    ├── .htaccess                     ← Rotas do Apache
    └── assets/
        └── index-XXXX.js             ← Aplicação React
```

---

### ✅ 8. VERIFICAR PERMISSÕES

No cPanel > File Manager:

1. Selecione a pasta `EstoqueGemini`
2. Clique com botão direito > "Change Permissions"
3. Configuração recomendada:
   - **Pastas:** 755 (drwxr-xr-x)
   - **Arquivos .php:** 644 (-rw-r--r--)
   - **Arquivos .js/.html:** 644 (-rw-r--r--)

---

### ✅ 9. ATIVAR MODO DESENVOLVIMENTO (DEBUG)

Para ver erros detalhados, edite `config.php`:

```php
define('APP_ENV', 'development'); // Mude de 'production' para 'development'
```

**⚠️ IMPORTANTE:** Volte para `'production'` depois de resolver o problema!

---

### ✅ 10. URLS IMPORTANTES

| Recurso | URL |
|---------|-----|
| **Aplicação** | https://www.donasalada.com/EstoqueGemini/ |
| **API** | https://www.donasalada.com/EstoqueGemini/api.php |
| **Diagnóstico** | https://www.donasalada.com/EstoqueGemini/diagnostico-online.php |
| **cPanel** | https://donasalada.com:2083 |
| **phpMyAdmin** | https://donasalada.com/phpMyAdmin (ou via cPanel) |

---

### 📞 SUPORTE

Se ainda tiver problemas:

1. **Execute o diagnóstico** e anote as mensagens de erro
2. **Tire prints** das telas de erro
3. **Verifique os logs** no cPanel > Error Logs
4. **Teste cada passo** desta documentação

---

## 🎯 RESUMO RÁPIDO

```bash
1. cPanel > MySQL Databases > Criar banco + usuário
2. phpMyAdmin > Importar .sql
3. Editar EstoqueGemini/config.php com dados corretos
4. Acessar EstoqueGemini/diagnostico-online.php
5. Verificar se tudo está ✅ verde
6. Acessar EstoqueGemini/ e fazer login
```

---

**Data de criação:** Novembro 2025  
**Versão:** 1.0  
**Suporte:** Estoque Gemini System
