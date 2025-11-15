# 🔐 TROUBLESHOOTING - Credenciais Inválidas

## ❌ PROBLEMA

Ao tentar fazer login, aparece: **"Credenciais inválidas. Tente novamente."**

---

## 🔍 CAUSAS POSSÍVEIS

### 1. **Banco de dados não criado** ⚠️
O arquivo `schema.sql` ainda não foi executado no MySQL.

**Solução:**
```bash
# Via phpMyAdmin:
1. Acesse cPanel → phpMyAdmin
2. Selecione database "dona_estoqueg"
3. Clique na aba "SQL"
4. Cole TODO o conteúdo de: server/database/schema.sql
5. Clique em "Executar"
6. Verifique se 6 tabelas foram criadas
```

### 2. **Tabela users vazia**
A tabela existe mas não tem usuários.

**Como verificar:**
```sql
SELECT * FROM users;
```

**Solução:**
Execute novamente a parte de INSERT do schema.sql:
```sql
INSERT INTO users (name, email, password, role, company, avatar) VALUES 
('Admin Sistema', 'admin@sistema.com', '123456', 'Super Admin', 'Tech Solutions', 'https://picsum.photos/seed/admin/100'),
('João Silva', 'joao@empresa.com', '123456', 'Admin', 'Tech Solutions', 'https://picsum.photos/seed/joao/100'),
('Maria Santos', 'maria@empresa.com', '123456', 'Manager', 'Retail Corp', 'https://picsum.photos/seed/maria/100'),
('Pedro Costa', 'pedro@empresa.com', '123456', 'Employee', 'Manufacturing Inc', 'https://picsum.photos/seed/pedro/100')
ON DUPLICATE KEY UPDATE name=name;
```

### 3. **Prefixo do cPanel no nome do banco**
O cPanel adiciona prefixo ao usuário e banco de dados.

**Exemplo:**
- Nome configurado: `dona_estoqueg`
- Nome real: `cpaneluser_dona_estoqueg`

**Solução:**
Edite `public_html/api.php` linha 18-21:
```php
// ANTES:
define('DB_USER', 'dona_estoqueg');
define('DB_NAME', 'dona_estoqueg');

// DEPOIS (com prefixo):
define('DB_USER', 'cpaneluser_dona_estoqueg');
define('DB_NAME', 'cpaneluser_dona_estoqueg');
```

### 4. **Senha do banco incorreta**
A senha no `api.php` não bate com a senha real do MySQL.

**Como verificar:**
No cPanel → MySQL Databases → Verifique a senha do usuário

**Solução:**
Edite `public_html/api.php` linha 20:
```php
define('DB_PASS', 'SUA_SENHA_REAL_AQUI');
```

---

## 🧪 TESTE DE CONEXÃO

### Via navegador (TESTE RÁPIDO):
1. Suba o arquivo `test-db.php` para o servidor
2. Acesse: `https://seudominio.com/test-db.php`

Resultado esperado:
```json
{
    "connection": true,
    "tables": ["companies", "users", "categories", "suppliers", "products", "stock_movements"],
    "users": [
        {
            "id": 1,
            "name": "Admin Sistema",
            "email": "admin@sistema.com",
            "role": "Super Admin",
            "company": "Tech Solutions"
        }
    ],
    "test_login": {
        "success": true,
        "user": {
            "id": 1,
            "name": "Admin Sistema",
            "email": "admin@sistema.com"
        }
    }
}
```

### Via API diretamente:
```bash
# Windows PowerShell:
Invoke-RestMethod -Uri "https://seudominio.com/api/auth/login" -Method POST -Body '{"email":"admin@sistema.com","password":"123456"}' -ContentType "application/json"

# Linux/Mac:
curl -X POST https://seudominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"123456"}'
```

Resultado esperado:
```json
{
    "id": 1,
    "name": "Admin Sistema",
    "email": "admin@sistema.com",
    "role": "Super Admin",
    "company": "Tech Solutions",
    "avatar": "https://picsum.photos/seed/admin/100"
}
```

---

## ✅ CREDENCIAIS PADRÃO

Após executar o SQL, existem 4 usuários:

| Email | Senha | Permissão |
|-------|-------|-----------|
| admin@sistema.com | 123456 | Super Admin |
| joao@empresa.com | 123456 | Admin |
| maria@empresa.com | 123456 | Manager |
| pedro@empresa.com | 123456 | Employee |

**⚠️ TODOS usam a senha: `123456`**

---

## 🔧 CHECKLIST DE SOLUÇÃO

Execute na ordem:

- [ ] 1. **Verificar conexão ao banco**
  ```bash
  # Teste via test-db.php
  ```

- [ ] 2. **Confirmar tabelas criadas**
  ```sql
  SHOW TABLES;
  -- Deve listar 6 tabelas
  ```

- [ ] 3. **Verificar usuários existem**
  ```sql
  SELECT email, role FROM users;
  -- Deve listar 4 usuários
  ```

- [ ] 4. **Testar login manual**
  ```sql
  SELECT * FROM users WHERE email = 'admin@sistema.com' AND password = '123456';
  -- Deve retornar 1 linha
  ```

- [ ] 5. **Verificar prefixo do cPanel**
  ```bash
  # No cPanel → MySQL Databases
  # Copie o nome EXATO do banco e usuário
  ```

- [ ] 6. **Atualizar api.php se necessário**
  ```php
  // Ajuste as linhas 18-21 com valores corretos
  ```

- [ ] 7. **Testar API**
  ```bash
  # Use curl ou test-db.php
  ```

- [ ] 8. **Rebuild frontend**
  ```bash
  npm run deploy
  # Upload novamente
  ```

---

## 🚨 ERRO COMUM: SENHA HASH vs TEXTO PURO

### ⚠️ ATENÇÃO SEGURANÇA

Atualmente o sistema salva senhas em **texto puro** (sem hash).

Isso foi feito para **simplificar o setup inicial**, mas em **PRODUÇÃO** você deve:

### Implementar hash de senha:

**1. Atualizar inserção de usuários:**
```sql
-- Em vez de:
INSERT INTO users (email, password) VALUES ('teste@email.com', '123456');

-- Use:
INSERT INTO users (email, password) VALUES ('teste@email.com', SHA2('123456', 256));
```

**2. Atualizar api.php:**
```php
// Linha 105 - handleAuth function
// ANTES:
$stmt = $conn->prepare("SELECT id, name, email, role, company, avatar FROM users WHERE email = ? AND password = ?");

// DEPOIS:
$stmt = $conn->prepare("SELECT id, name, email, role, company, avatar FROM users WHERE email = ? AND password = SHA2(?, 256)");
```

**3. Recriar usuários com hash:**
```sql
-- Deletar usuários antigos
DELETE FROM users;

-- Inserir com senha hash
INSERT INTO users (name, email, password, role, company, avatar) VALUES 
('Admin Sistema', 'admin@sistema.com', SHA2('123456', 256), 'Super Admin', 'Tech Solutions', 'https://picsum.photos/seed/admin/100');
```

---

## 📞 SUPORTE RÁPIDO

### Erro: "Connection failed"
→ Verifique credenciais do banco em `api.php`

### Erro: "Table doesn't exist"
→ Execute `schema.sql` no phpMyAdmin

### Erro: "Credenciais inválidas"
→ Use `test-db.php` para verificar se usuários existem

### Erro: CORS
→ Verifique se `.htaccess` foi enviado para o servidor

---

## 🎯 SOLUÇÃO RÁPIDA (90% dos casos)

```bash
# 1. Acesse phpMyAdmin
# 2. Execute schema.sql completo
# 3. Teste login com: admin@sistema.com / 123456
# 4. Pronto!
```

Se ainda não funcionar, use `test-db.php` para diagnóstico completo.
