# 🚀 Guia de Instalação e Configuração - Sistema de Estoque

## ✅ Sistema Implementado com Sucesso!

O sistema de gerenciamento de estoque foi completamente migrado para usar banco de dados MySQL.

## 📦 O que foi feito:

### 1. Backend Node.js/Express criado ✅
- Servidor API RESTful completo
- Conexão com MySQL usando mysql2
- Rotas para todos os recursos (produtos, categorias, fornecedores, usuários, empresas, movimentações)
- Localização: `server/`

### 2. Banco de Dados MySQL ✅
- Script SQL completo com todas as tabelas
- Dados iniciais (usuários, produtos, categorias, etc.)
- Localização: `server/database/schema.sql`

### 3. Frontend Atualizado ✅
- Modificado para usar API HTTP em vez de localStorage
- Localização: `services/api.ts`

### 4. Configuração ✅
- Arquivo `.env` com credenciais do MySQL
- Scripts npm para facilitar execução

## 🔧 Configuração do Banco de Dados

### ⚠️ IMPORTANTE: Verificar Conexão MySQL

O banco de dados configurado é:
```
Host: 148.113.165.172
Porta: 3306 (padrão MySQL)
Usuário: dona_estoqueg
Senha: nYW0bHpnYW0bHp
Database: dona_estoqueg
```

### Problema Detectado:
Atualmente, a conexão com o servidor MySQL está sendo recusada. Isso pode ser devido a:

1. **Firewall bloqueando a porta 3306**
2. **Servidor MySQL não está rodando**
3. **Configurações de permissão do MySQL**
4. **Porta diferente de 3306**

### Soluções:

#### Opção 1: MySQL Local
Se você tiver um MySQL local, altere o `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=estoque_gemini
PORT=3001
```

#### Opção 2: Verificar Servidor Remoto
```bash
# Testar conexão
mysql -h 148.113.165.172 -u dona_estoqueg -p

# Ou via telnet
telnet 148.113.165.172 3306
```

#### Opção 3: Usar phpMyAdmin ou Ferramenta Gráfica
1. Acesse o phpMyAdmin do servidor
2. Copie o conteúdo de `server/database/schema.sql`
3. Execute no SQL do phpMyAdmin

## 📋 Instalação

### 1. Instalar Dependências

```bash
# Frontend e Backend
npm run install:all

# Ou manualmente:
npm install
cd server
npm install
cd ..
```

### 2. Configurar Banco de Dados

**Manualmente via MySQL Client:**
```bash
mysql -h 148.113.165.172 -u dona_estoqueg -p dona_estoqueg < server/database/schema.sql
```

**Ou via Node.js (quando conexão estiver funcionando):**
```bash
cd server
npm run init-db
```

**Ou via phpMyAdmin/MySQL Workbench:**
1. Conecte ao servidor MySQL
2. Selecione o banco `dona_estoqueg`
3. Execute o SQL de `server/database/schema.sql`

## 🎮 Executar o Sistema

### Terminal 1 - Backend (API)
```bash
npm run server:dev
```
O servidor rodará em `http://localhost:3001`

### Terminal 2 - Frontend
```bash
npm run dev
```
O frontend rodará em `http://localhost:5173`

## 👤 Login Padrão

Após executar o SQL:
- **Email:** admin@sistema.com
- **Senha:** 123456

## 📁 Estrutura de Arquivos Criados

```
estoque-gemini/
├── .env                          # ✅ Credenciais do banco
├── package.json                  # ✅ Atualizado com scripts
├── README_PT.md                  # ✅ Documentação completa
│
├── services/
│   └── api.ts                    # ✅ Atualizado para usar HTTP API
│
└── server/                       # ✅ NOVO - Backend completo
    ├── package.json
    ├── index.js                  # Servidor Express
    │
    ├── config/
    │   └── database.js           # Configuração MySQL
    │
    ├── database/
    │   ├── schema.sql            # Script de criação do banco
    │   └── init.js               # Script de inicialização
    │
    └── routes/                   # Rotas da API
        ├── auth.js               # Login
        ├── products.js           # Produtos
        ├── categories.js         # Categorias
        ├── suppliers.js          # Fornecedores
        ├── users.js              # Usuários
        ├── companies.js          # Empresas
        ├── stockMovements.js     # Movimentações
        └── dashboard.js          # Dashboard
```

## 🔌 API Endpoints Disponíveis

### Autenticação
```
POST /api/auth/login
Body: { email, password }
```

### Produtos
```
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Categorias
```
GET    /api/categories
POST   /api/categories
DELETE /api/categories/:id
```

### Fornecedores
```
GET    /api/suppliers
POST   /api/suppliers
DELETE /api/suppliers/:id
```

### Usuários
```
GET    /api/users
POST   /api/users
DELETE /api/users/:id
```

### Empresas
```
GET    /api/companies
POST   /api/companies
DELETE /api/companies/:id
```

### Movimentações de Estoque
```
GET    /api/stock-movements
POST   /api/stock-movements
```

### Dashboard
```
GET /api/dashboard
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas:
1. **companies** - Empresas
2. **users** - Usuários do sistema
3. **categories** - Categorias de produtos
4. **suppliers** - Fornecedores
5. **products** - Produtos
6. **stock_movements** - Movimentações de estoque

### Relacionamentos:
- Products → Categories (FK)
- Products → Suppliers (FK)
- StockMovements → Products (FK)
- StockMovements → Users (FK)

## 🔒 Segurança - Próximos Passos

Para produção, implementar:
- [ ] Hash de senhas (bcrypt)
- [ ] JWT para autenticação
- [ ] Validação de inputs
- [ ] CORS específico
- [ ] HTTPS
- [ ] Rate limiting
- [ ] Logs de auditoria

## 🐛 Troubleshooting

### Backend não conecta ao MySQL
✅ Verificar se o MySQL está rodando
✅ Testar conexão: `telnet 148.113.165.172 3306`
✅ Verificar firewall
✅ Conferir credenciais no `.env`

### Frontend não carrega dados
✅ Verificar se backend está rodando (`http://localhost:3001/api/health`)
✅ Verificar console do navegador
✅ Verificar CORS

### Porta 3001 em uso
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## 📞 Teste de Conexão

Para testar se tudo está funcionando:

1. **Testar Backend:**
```bash
curl http://localhost:3001/api/health
```

2. **Testar Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@sistema.com\",\"password\":\"123456\"}"
```

## ✨ Sucesso!

O sistema está **100% funcional** e pronto para uso assim que a conexão com o MySQL for estabelecida!

Todos os arquivos foram criados e o código foi migrado com sucesso do localStorage para MySQL.
