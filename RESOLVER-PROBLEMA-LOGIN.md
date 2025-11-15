# 🚨 RESOLUÇÃO DE PROBLEMA - Login não funciona no servidor

## 📋 Situação Atual

- ✅ Pasta `public_html` copiada para: `www.donasalada.com/EstoqueGemini`
- ✅ `config.php` modificado com dados do MySQL do cPanel
- ✅ Banco de dados importado do local para online
- ❌ **Login não funciona**

---

## 🔧 FERRAMENTAS CRIADAS PARA DIAGNÓSTICO

### 1️⃣ **Diagnóstico Completo** (USE PRIMEIRO!)
```
https://www.donasalada.com/EstoqueGemini/diagnostico-online.php
```

**O que faz:**
- ✅ Testa conexão com MySQL
- ✅ Lista todas as tabelas importadas
- ✅ Verifica usuários cadastrados
- ✅ Testa hash de senhas
- ✅ Identifica problemas de configuração

**👉 ACESSE AGORA e veja onde está o problema!**

---

### 2️⃣ **Reset de Senha**
```
https://www.donasalada.com/EstoqueGemini/reset-password.php
```

**O que faz:**
- ✅ Cria novo usuário admin (se não existir)
- ✅ Reseta senha de admin existente
- ✅ Usa criptografia bcrypt correta

**👉 Use se o diagnóstico mostrar problema com senha**

---

## 🎯 PASSO A PASSO PARA RESOLVER

### **PASSO 1: Execute o Diagnóstico**

1. Acesse: `https://www.donasalada.com/EstoqueGemini/diagnostico-online.php`
2. Leia TODAS as seções
3. Anote os erros em VERMELHO (❌)

---

### **PASSO 2: Verifique a Conexão MySQL**

Se aparecer erro tipo:
```
❌ ERRO na conexão: Access denied for user 'root'@'localhost'
```

**Solução:**
1. Abra o **cPanel**
2. Vá em **MySQL® Databases**
3. Veja o nome EXATO do:
   - Banco de dados (ex: `donasala_estoqueg`)
   - Usuário (ex: `donasala_estoqueg_user`)
4. Edite `EstoqueGemini/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'donasala_estoqueg_user');  // Nome exato
   define('DB_PASS', 'sua_senha_aqui');
   define('DB_NAME', 'donasala_estoqueg');       // Nome exato
   ```
5. Recarregue o diagnóstico

---

### **PASSO 3: Verifique as Tabelas**

Se aparecer:
```
❌ Nenhuma tabela encontrada no banco de dados!
```

**Solução:**
1. Banco não foi importado corretamente
2. Abra **cPanel > phpMyAdmin**
3. Selecione o banco `donasala_estoqueg`
4. Clique em **Importar**
5. Escolha o arquivo `.sql` exportado do local
6. Clique em **Executar**

---

### **PASSO 4: Verifique os Usuários**

Se aparecer:
```
❌ Nenhum usuário encontrado na tabela!
```

**Solução:**
1. A tabela `users` está vazia
2. Acesse: `EstoqueGemini/reset-password.php`
3. Crie um novo admin:
   - Nome: `Admin`
   - Email: `admin@sistema.com`
   - Senha: `123456` (mude depois)
4. Clique em **Resetar/Criar**

---

### **PASSO 5: Teste o Hash de Senha**

Se aparecer:
```
❌ Hash NÃO é bcrypt!
```

**Solução:**
1. As senhas foram importadas incorretamente
2. Acesse: `EstoqueGemini/reset-password.php`
3. Resete a senha do admin existente
4. Use o email que apareceu no diagnóstico
5. Defina nova senha

---

### **PASSO 6: Teste o Login**

Depois de resolver os problemas acima:

1. Acesse: `https://www.donasalada.com/EstoqueGemini/`
2. Use as credenciais:
   - Email: (o que você criou/resetou)
   - Senha: (a que você definiu)
3. Clique em **Entrar**

---

## 🔍 CHECKLIST DE CONFIGURAÇÃO

Marque cada item conforme resolver:

- [ ] **Banco de dados criado** no cPanel
- [ ] **Usuário do banco criado** no cPanel
- [ ] **Usuário adicionado ao banco** (ALL PRIVILEGES)
- [ ] **Arquivo .sql importado** via phpMyAdmin
- [ ] **config.php editado** com dados corretos (com prefixo!)
- [ ] **Diagnóstico mostra conexão OK** (✅ verde)
- [ ] **Diagnóstico lista tabelas** (users, products, etc)
- [ ] **Diagnóstico mostra usuários** cadastrados
- [ ] **Hash de senha é bcrypt** ($2y$...)
- [ ] **Login funciona** no frontend

---

## ⚠️ ERROS MAIS COMUNS

### **1. "Access denied for user 'root'"**
➡️ **Problema:** Você está usando `'root'` no servidor online  
✅ **Solução:** Mudar para o usuário do cPanel (com prefixo)

### **2. "Unknown database 'dona_estoqueg'"**
➡️ **Problema:** Nome do banco sem o prefixo do cPanel  
✅ **Solução:** Usar nome completo (ex: `donasala_estoqueg`)

### **3. "Table 'users' doesn't exist"**
➡️ **Problema:** Banco não foi importado  
✅ **Solução:** Re-importar o .sql no phpMyAdmin

### **4. "Invalid credentials" ao fazer login**
➡️ **Problema:** Hash de senha incompatível  
✅ **Solução:** Usar o reset-password.php

---

## 📞 AINDA COM PROBLEMAS?

Se após seguir TODOS os passos ainda não funcionar:

1. **Tire print do diagnóstico completo**
2. **Anote TODOS os erros vermelhos**
3. **Verifique os Error Logs** no cPanel
4. **Confirme que seguiu o guia completo**: `GUIA-INSTALACAO-CPANEL.md`

---

## 🎯 EXEMPLO DE config.php CORRETO

```php
<?php
// ⚠️ NUNCA use 'root' no servidor de produção!
define('DB_HOST', 'localhost');
define('DB_USER', 'donasala_estoqueg_user');  // ← COM PREFIXO!
define('DB_PASS', 'SuaSenhaForte123!@#');     // ← Senha real
define('DB_NAME', 'donasala_estoqueg');       // ← COM PREFIXO!
?>
```

---

## ✅ APÓS RESOLVER

**Por segurança:**

1. Delete ou renomeie os arquivos de diagnóstico:
   - `diagnostico-online.php` → `_diagnostico-online.php.bak`
   - `reset-password.php` → `_reset-password.php.bak`

2. Mude `APP_ENV` no config.php:
   ```php
   define('APP_ENV', 'production'); // Desativa erros detalhados
   ```

3. Crie uma senha FORTE para o admin

---

**Criado em:** 15/11/2025  
**Versão:** 1.0  
**Sistema:** Estoque Gemini
