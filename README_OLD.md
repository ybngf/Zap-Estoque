# 📦 Estoque Gemini - Sistema de Gestão de Estoque

Sistema completo de gestão de estoque com suporte multi-empresa, desenvolvido com React + TypeScript + PHP + MySQL.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178c6.svg)
![PHP](https://img.shields.io/badge/PHP-8.x-777bb4.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1.svg)

## 🚀 Funcionalidades

### 📊 Gestão de Produtos
- ✅ Cadastro completo de produtos (nome, SKU, categoria, fornecedor, preço, estoque)
- ✅ Upload de imagens via URL
- ✅ Controle de estoque mínimo com alertas
- ✅ Importação em massa via CSV/Excel
- ✅ Impressão de etiquetas e relatórios
- ✅ Visualização em cards responsivos (mobile-friendly)

### 📋 Categorias e Fornecedores
- ✅ Gestão de categorias de produtos
- ✅ Cadastro de fornecedores com informações completas
- ✅ Importação em massa
- ✅ Ordenação alfabética automática

### 📈 Movimentações de Estoque
- ✅ Registro de entradas, saídas e ajustes
- ✅ Histórico completo de movimentações
- ✅ Rastreabilidade por usuário e data
- ✅ Atualização automática de estoque

### 🤖 Processamento Inteligente
- ✅ OCR de notas fiscais usando Google Gemini AI
- ✅ Extração automática de produtos
- ✅ Importação facilitada de dados

### 👥 Multi-empresa e Usuários
- ✅ Suporte para múltiplas empresas
- ✅ Hierarquia de permissões (Super Admin, Admin, Manager, Employee)
- ✅ Isolamento completo de dados por empresa
- ✅ Gestão de usuários por empresa

### 📊 Relatórios e Dashboard
- ✅ Dashboard com métricas em tempo real
- ✅ Gráficos de produtos em estoque baixo
- ✅ Estatísticas de movimentações
- ✅ Relatórios personalizados
- ✅ Exportação em Excel/CSV

### 🔒 Log de Atividades
- ✅ Registro completo de todas as ações (INSERT, UPDATE, DELETE)
- ✅ Rastreamento por usuário, IP e navegador
- ✅ Filtros avançados (ação, entidade, usuário, data)
- ✅ Visualização de dados antigos vs. novos
- ✅ Relatório de atividades críticas (Super Admin)

### ⚙️ Configurações
- ✅ Personalização do nome do sistema
- ✅ Upload de logo customizado
- ✅ Configurações por empresa
- ✅ Ativação/desativação de funcionalidades

## 🛠️ Tecnologias

### Frontend
- **React 19.2.0** - Biblioteca UI
- **TypeScript 5.6.2** - Tipagem estática
- **Vite 5.4.21** - Build tool
- **Tailwind CSS 3.4.17** - Estilização
- **Heroicons** - Ícones

### Backend
- **PHP 8.x** - Server-side
- **MySQL 8.0** - Banco de dados
- **Google Gemini AI** - OCR e processamento inteligente

### Bibliotecas Adicionais
- **xlsx** - Manipulação de planilhas
- **jspdf** - Geração de PDFs
- **react-to-print** - Impressão de componentes

## 📋 Pré-requisitos

- Node.js 18+ 
- PHP 8.0+
- MySQL 8.0+
- Composer (opcional)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/estoque-gemini.git
cd estoque-gemini
```

### 2. Instale as dependências do frontend
```bash
npm install
```

### 3. Configure o banco de dados

Execute o script SQL para criar as tabelas:
```bash
# Importe o arquivo database.sql no MySQL
mysql -u seu_usuario -p seu_banco < database.sql
```

Ou crie manualmente as tabelas principais:
- `companies` - Empresas
- `users` - Usuários
- `categories` - Categorias
- `suppliers` - Fornecedores
- `products` - Produtos
- `stock_movements` - Movimentações
- `activity_log` - Log de atividades
- `settings` - Configurações do sistema
- `company_settings` - Configurações por empresa

### 4. Configure o arquivo de conexão

Edite `public_html/api.php` com as credenciais do banco:
```php
$servername = "localhost";
$username = "seu_usuario";
$password = "sua_senha";
$dbname = "seu_banco";
```

### 5. Configure a API do Gemini (opcional)

Para usar o processamento de notas fiscais, configure a chave da API:
```typescript
// Em services/geminiService.ts
const API_KEY = 'sua_chave_api_gemini';
```

## 💻 Desenvolvimento

### Rodar em modo desenvolvimento
```bash
# Frontend (Vite dev server)
npm run dev

# Backend (PHP built-in server)
cd public_html
php -S localhost:8000
```

Acesse: `http://localhost:5173`

### Build para produção
```bash
npm run build
```

Os arquivos serão gerados em `public_html/`.

## 🌐 Deploy

### Deploy em cPanel/Hospedagem compartilhada

1. Faça o build do projeto:
```bash
npm run build
```

2. Faça upload dos arquivos de `public_html/` para o servidor

3. Configure o banco de dados MySQL no painel da hospedagem

4. Edite `api.php` com as credenciais do banco

5. Ajuste o `API_URL` em `services/api.ts` se necessário

6. Acesse o sistema pela URL configurada

**Documentação detalhada:** Veja `GUIA-INSTALACAO-CPANEL.md`

## 👤 Usuários Padrão

Após instalação, crie um Super Admin:
- Use o arquivo `public_html/reset-password.php` para criar o primeiro usuário

## 📚 Documentação Adicional

- `GUIA-INSTALACAO-CPANEL.md` - Guia completo de instalação em cPanel
- `RESOLVER-PROBLEMA-LOGIN.md` - Solução de problemas de login
- `ATUALIZAR-API-SERVIDOR.md` - Como atualizar api.php em produção
- `CORRECAO-IMAGEM-PRODUTO.md` - Documentação da correção de URLs de imagem
- `CORRECAO-LOG-ATIVIDADES.md` - Documentação do Log de Atividades

## 🔐 Hierarquia de Permissões

```
Super Admin (Nível 3)
├── Gerencia múltiplas empresas
├── Acesso a todas as configurações
├── Relatório de atividades críticas
└── Visualiza logs de todas as empresas

Admin (Nível 2)
├── Gerencia usuários da empresa
├── Configurações da empresa
├── Log de atividades da empresa
└── Todas as funcionalidades operacionais

Manager (Nível 1)
├── Gerencia produtos, categorias e fornecedores
├── Processa notas fiscais
├── Visualiza relatórios
└── Registra movimentações

Employee (Nível 0)
├── Visualiza produtos
├── Registra movimentações
├── Acessa dashboard
└── Visualiza relatórios básicos
```

## 🎨 Recursos Responsivos

✅ Menu lateral retrátil em mobile
✅ Cards de produtos adaptáveis
✅ Tabelas com scroll horizontal
✅ Formulários otimizados para toque
✅ Dashboard responsivo

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🐛 Suporte

Para relatar bugs ou solicitar novas funcionalidades, abra uma [issue](https://github.com/seu-usuario/estoque-gemini/issues).

## 📧 Contato

Desenvolvido com ❤️ usando React + TypeScript + PHP

---

**Última atualização:** 15/11/2025
**Versão:** 1.0.0
**Build:** 951.45 kB (gzip: 241.68 kB)
