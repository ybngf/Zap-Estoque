# 🔐 SOLUÇÃO: Credenciais Inválidas

## ✅ PROBLEMA IDENTIFICADO E CORRIGIDO

### O que estava errado:
1. ❌ Login.tsx usava email: `maria@donasalada.com.br`
2. ❌ Banco de dados tem emails diferentes: `admin@sistema.com`, `joao@empresa.com`, etc.
3. ❌ Email não existia no banco → Login sempre falhava

### O que foi corrigido:
1. ✅ Login.tsx atualizado para: `admin@sistema.com`
2. ✅ Build refeito com correção
3. ✅ Arquivo test-db.php criado para diagnóstico

---

## 🚀 CREDENCIAIS CORRETAS

Use qualquer um destes logins (todos com senha **123456**):

| Email | Senha | Permissão |
|-------|-------|-----------|
| **admin@sistema.com** | 123456 | Super Admin ⭐ |
| joao@empresa.com | 123456 | Admin |
| maria@empresa.com | 123456 | Manager |
| pedro@empresa.com | 123456 | Employee |

---

## 📋 CHECKLIST ANTES DE TESTAR

### 1. Banco de dados criado? ⚠️ IMPORTANTE!

```bash
# Você DEVE executar o SQL primeiro!
# Acesse: cPanel → phpMyAdmin → dona_estoqueg → SQL
# Cole e execute: server/database/schema.sql
```

### 2. Arquivos atualizados?

```bash
# Execute localmente:
npm run deploy

# Depois envie public_html/ para o servidor
# Sobrescreva os arquivos antigos
```

### 3. Testar conexão?

```bash
# Envie test-db.php para o servidor
# Acesse: https://seudominio.com/test-db.php
# Deve mostrar: "connection": true e lista de usuários
```

---

## 🧪 TESTE RÁPIDO

### DESENVOLVIMENTO (localhost):

```bash
# Terminal 1 - Backend
cd server
npm install
npm start

# Terminal 2 - Frontend
npm run dev
```

Acesse: http://localhost:5173
Login: `admin@sistema.com` / `123456`

### PRODUÇÃO (servidor):

1. **Upload arquivos**
   - Envie `public_html/*` para o servidor
   - Inclua `.htaccess` (arquivo oculto!)

2. **Execute SQL**
   - phpMyAdmin → SQL → Executar schema.sql

3. **Teste API**
   - Acesse: `https://seudominio.com/test-db.php`
   - Verifique: `"connection": true`

4. **Teste Login**
   - Acesse: `https://seudominio.com`
   - Login: `admin@sistema.com` / `123456`

---

## 🔧 SE AINDA NÃO FUNCIONAR

### Diagnóstico passo a passo:

```bash
# 1. Testar conexão do banco
https://seudominio.com/test-db.php
# Deve retornar JSON com "connection": true

# 2. Verificar se tabelas existem
# No phpMyAdmin:
SHOW TABLES;
# Deve listar: companies, users, categories, suppliers, products, stock_movements

# 3. Verificar se usuários existem
SELECT email FROM users;
# Deve listar 4 emails

# 4. Testar login manual no banco
SELECT * FROM users WHERE email = 'admin@sistema.com' AND password = '123456';
# Deve retornar 1 linha

# 5. Se nada funcionar
# Veja: TROUBLESHOOTING_LOGIN.md (guia completo)
```

---

## 📁 ARQUIVOS IMPORTANTES

```
Estoque Gemini/
│
├── public_html/
│   ├── test-db.php          ← NOVO! Use para testar banco
│   ├── api.php              ← Backend corrigido
│   ├── index.html           ← Frontend atualizado
│   └── .htaccess            ← NÃO ESQUEÇA!
│
├── server/database/
│   └── schema.sql           ← EXECUTE NO PHPMYADMIN
│
├── components/
│   └── Login.tsx            ← CORRIGIDO (admin@sistema.com)
│
└── TROUBLESHOOTING_LOGIN.md ← Guia completo de problemas
```

---

## ⚠️ ATENÇÃO SEGURANÇA

### Senhas em texto puro!

Atualmente as senhas são salvas **SEM CRIPTOGRAFIA** para facilitar testes.

**ANTES DE IR PARA PRODUÇÃO REAL:**

1. Implemente hash SHA256 ou bcrypt
2. Mude todas as senhas padrão
3. Ative SSL/HTTPS
4. Configure backup automático

Ver detalhes em: `TROUBLESHOOTING_LOGIN.md` → "ERRO COMUM: SENHA HASH vs TEXTO PURO"

---

## 🎉 RESUMO

### Para funcionar AGORA:

1. ✅ Execute `server/database/schema.sql` no phpMyAdmin
2. ✅ Faça upload de `public_html/` para servidor
3. ✅ Teste com: `admin@sistema.com` / `123456`

### Se tiver problemas:

1. 🧪 Use `test-db.php` para diagnóstico
2. 📚 Leia `TROUBLESHOOTING_LOGIN.md`
3. ✅ Verifique prefixo do cPanel no nome do banco

---

**Build atualizado em:** 14/Nov/2025
**Arquivos corrigidos:** Login.tsx, test-db.php criado
**Status:** ✅ PRONTO PARA TESTE
