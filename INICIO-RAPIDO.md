# 🚀 Configuração Rápida - MySQL Localhost

## ✅ Arquivos Já Atualizados

- ✅ `public_html/config.php` → MySQL localhost
- ✅ `public_html/api.php` → MySQL localhost  
- ✅ `vite.config.ts` → Proxy configurado
- ✅ `services/api.ts` → Usa proxy em desenvolvimento

**Credenciais:** `root` / `(sem senha)` / `dona_estoqueg`

---

## 🎯 3 Passos para Iniciar

### 1️⃣ Criar o Banco de Dados

**Opção A - Automático (Recomendado):**

Acesse no navegador:
```
http://localhost/EstoqueGemini/public_html/setup-database.php
```

Deve mostrar: ✅ BANCO DE DADOS CONFIGURADO COM SUCESSO!

**Opção B - Manual (phpMyAdmin):**

1. Acesse: http://localhost/phpmyadmin
2. Importe: `database/schema.sql`

---

### 2️⃣ Testar Conexão

Acesse:
```
http://localhost/EstoqueGemini/public_html/test-connection-local.php
```

Deve mostrar:
```
✅ Conectado ao servidor MySQL!
✅ Banco de dados existe!
✅ Todas as tabelas necessárias existem!
```

---

### 3️⃣ Iniciar a Aplicação

No terminal (PowerShell):

```powershell
cd "D:\Estoque Gemini"
npm run dev
```

Acesse:
```
http://localhost:5173
```

**Login:**
- Email: `admin@estoque.com`
- Senha: `admin123`

---

## ✅ Pronto!

Agora você pode:
- ✅ Gerenciar produtos
- ✅ Ajustar estoque com botões + e -
- ✅ Ver histórico de movimentações
- ✅ Gerenciar categorias, fornecedores e usuários

---

## 🆘 Problemas?

**MySQL não conecta:**
- Verifique se XAMPP/WAMP está rodando
- Inicie o módulo MySQL

**Erro nas tabelas:**
- Execute novamente: `setup-database.php`

**API não responde:**
- Verifique se o Apache está rodando
- Teste: http://localhost/EstoqueGemini/public_html/api.php/users

---

## 📄 Documentação Completa

Veja: `CONFIGURACAO-LOCALHOST.md`
