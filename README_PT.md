# Sistema de Gerenciamento de Estoque com MySQL

Sistema completo de gerenciamento de estoque com frontend React e backend Node.js + MySQL.

## 🚀 Funcionalidades

- ✅ Autenticação de usuários
- ✅ Gestão de produtos
- ✅ Controle de categorias
- ✅ Gerenciamento de fornecedores
- ✅ Controle de empresas
- ✅ Gestão de usuários
- ✅ Movimentações de estoque
- ✅ Dashboard com estatísticas
- ✅ Processador de faturas com IA (Gemini)

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- MySQL Server
- npm ou yarn

## 🔧 Instalação

### 1. Instalar dependências

```bash
# Instalar dependências do frontend e backend
npm run install:all
```

### 2. Configurar o banco de dados

O arquivo `.env` já está configurado com as credenciais do MySQL:

```env
DB_HOST=148.113.165.172
DB_USER=dona_estoqueg
DB_PASSWORD=nYW0bHpnYW0bHp
DB_NAME=dona_estoqueg
PORT=3001
```

### 3. Criar as tabelas do banco de dados

Execute o script SQL localizado em `server/database/schema.sql` no seu banco de dados MySQL:

```bash
# Via linha de comando MySQL
mysql -h 148.113.165.172 -u dona_estoqueg -p dona_estoqueg < server/database/schema.sql
```

Ou copie e execute o conteúdo do arquivo `server/database/schema.sql` no seu cliente MySQL favorito (MySQL Workbench, phpMyAdmin, etc.).

## 🎮 Como Usar

### Iniciar o backend (API)

Em um terminal:

```bash
npm run server:dev
```

O servidor backend estará rodando em `http://localhost:3001`

### Iniciar o frontend

Em outro terminal:

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## 👤 Login Padrão

Após executar o script SQL, você pode fazer login com:

- **Email:** `admin@sistema.com`
- **Senha:** `123456`

Outros usuários disponíveis:
- `joao@empresa.com` / `123456` (Admin)
- `maria@empresa.com` / `123456` (Manager)
- `pedro@empresa.com` / `123456` (Employee)

## 📁 Estrutura do Projeto

```
estoque-gemini/
├── components/          # Componentes React
├── services/           # Serviços de API
├── server/             # Backend Node.js
│   ├── config/         # Configuração do banco
│   ├── database/       # Scripts SQL
│   ├── routes/         # Rotas da API
│   └── index.js        # Servidor Express
├── .env               # Variáveis de ambiente
└── package.json       # Dependências
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `DELETE /api/categories/:id` - Deletar categoria

### Fornecedores
- `GET /api/suppliers` - Listar fornecedores
- `POST /api/suppliers` - Criar fornecedor
- `DELETE /api/suppliers/:id` - Deletar fornecedor

### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Empresas
- `GET /api/companies` - Listar empresas
- `POST /api/companies` - Criar empresa
- `DELETE /api/companies/:id` - Deletar empresa

### Movimentações de Estoque
- `GET /api/stock-movements` - Listar movimentações
- `POST /api/stock-movements` - Criar movimentação

### Dashboard
- `GET /api/dashboard` - Dados do dashboard

## 🛠️ Tecnologias Utilizadas

### Frontend
- React 19
- TypeScript
- Vite
- Recharts (gráficos)
- Google Generative AI (Gemini)

### Backend
- Node.js
- Express.js
- MySQL2
- CORS
- Dotenv

## 📝 Notas

- O sistema utiliza MySQL para persistência de dados
- As movimentações de estoque atualizam automaticamente o estoque dos produtos
- O dashboard exibe estatísticas em tempo real do banco de dados
- A API aceita requisições de qualquer origem (CORS habilitado)

## 🔒 Segurança

**IMPORTANTE:** Para produção, considere:
- Implementar hash de senhas (bcrypt)
- Adicionar JWT para autenticação
- Validar todas as entradas
- Configurar CORS adequadamente
- Usar HTTPS
- Não expor credenciais do banco de dados

## 📧 Suporte

Para problemas ou dúvidas, verifique os logs do servidor ou do navegador.
