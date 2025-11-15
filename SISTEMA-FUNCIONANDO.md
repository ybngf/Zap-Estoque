# ✅ Sistema Funcionando - Configuração Apache

## 🎯 URL de Acesso
**http://localhost/estoque/**

## 🔑 Credenciais de Login

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@estoque.com | admin123 | Super Admin |
| joao@estoque.com | joao123 | Admin |
| maria@estoque.com | maria123 | Manager |
| pedro@estoque.com | pedro123 | Employee |
| ana@estoque.com | ana123 | Employee |

## 📁 Estrutura de Arquivos

```
D:\Estoque Gemini\
├── public_html\              ← Link simbólico: C:\xampp\htdocs\estoque\
│   ├── index.html           ← Frontend build
│   ├── api.php              ← API Backend
│   ├── config.php           ← Configurações do banco
│   ├── assets\              ← JS/CSS compilados
│   └── ...
├── src\                     ← Código fonte React
├── services\                ← API client
└── vite.config.ts
```

## 🔧 Configurações Importantes

### 1. Banco de Dados (config.php)
```php
DB_HOST: localhost
DB_USER: root
DB_PASS: (vazio)
DB_NAME: dona_estoqueg
```

### 2. API Backend (api.php)
- **Path Parsing:** Funciona com qualquer subdiretório
- **Autenticação:** password_verify() com bcrypt
- **Rotas suportadas:**
  - POST `/api.php/auth/login`
  - GET/POST/PUT/DELETE `/api.php/products`
  - GET/POST/PUT/DELETE `/api.php/categories`
  - GET/POST/PUT/DELETE `/api.php/suppliers`
  - GET/POST/PUT/DELETE `/api.php/users`
  - GET/POST/PUT/DELETE `/api.php/companies`
  - GET/POST `/api.php/stock-movements`
  - GET `/api.php/dashboard`

### 3. Frontend (api.ts)
**Auto-detecção do ambiente:**
- **Vite Dev (porta 5173/5174):** Usa proxy `/api` → `http://localhost:8000/api.php`
- **Apache (localhost sem porta):** Detecta base path automaticamente (`/estoque/api.php`)
- **Produção:** Fallback para `/EstoqueGemini/api.php`

## 🚀 Como Usar

### Desenvolvimento com Vite
```powershell
npm run dev
# Acesse: http://localhost:5174
```

### Produção via Apache
```powershell
npm run build
# Acesse: http://localhost/estoque/
```

## 🧪 Testes da API

### Testar Login Manual
```powershell
$body = '{"email":"admin@estoque.com","password":"admin123"}'
Invoke-WebRequest -Uri "http://localhost/estoque/api.php/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Páginas de Teste Disponíveis
- http://localhost/estoque/test-api-routes.php (Teste de parsing de rotas)
- http://localhost/estoque/debug-login.php (Debug de autenticação)
- http://localhost/estoque/test-api-login.html (Teste visual de login)

## 📊 Dados do Sistema

### Empresas (3)
- Empresa Principal
- Empresa Filial
- Empresa Teste

### Categorias (8)
- Alimentos
- Bebidas
- Limpeza
- Higiene
- Papelaria
- Eletrônicos
- Vestuário
- Outros

### Fornecedores (6)
- Distribuidora ABC
- Fornecedor XYZ
- Importadora Global
- Comercial Local
- Atacadão Produtos
- Distribuidora Regional

### Produtos (16)
Diversos produtos com preços de R$ 2,50 a R$ 2.899,00

### Movimentações (9)
Histórico de entradas, saídas e ajustes de estoque

## 🔄 Reset do Banco de Dados

Se precisar resetar completamente o banco:
```
http://localhost/estoque/reset-database.php
```

⚠️ **ATENÇÃO:** Isso apaga TODOS os dados e recria tudo do zero!

## ✅ Sistema 100% Funcional!

Tudo está configurado e pronto para uso em:
**http://localhost/estoque/**

Login: **admin@estoque.com** / **admin123**
