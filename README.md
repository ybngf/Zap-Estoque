# 🚀 Zap Estoque

Sistema profissional de gestão de estoque multi-empresa com Inteligência Artificial integrada.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![PHP](https://img.shields.io/badge/PHP-8.x-777bb4)

---

## 📋 Sobre o Projeto

**Zap Estoque** é um sistema completo de gestão de estoque desenvolvido com tecnologias de ponta (2024/2025), incluindo processamento de notas fiscais com **Google Gemini AI**. 

Perfeito para empresas que precisam controlar estoque de múltiplas filiais em um único sistema com isolamento total de dados.

---

## ✨ Principais Funcionalidades

### 🏢 **Multi-Empresa**
- Gestão ilimitada de empresas em um único sistema
- Isolamento completo de dados por empresa
- Super Admin com visão consolidada
- Ativação/desativação de empresas e usuários

### 🤖 **Inteligência Artificial**
- Processamento automático de notas fiscais (Google Gemini)
- Extração de produtos, quantidades e valores
- Cadastro instantâneo de produtos via IA
- Economia de 90% do tempo de lançamento

### 📦 **Gestão de Estoque**
- Controle completo de produtos
- Movimentações (Entrada/Saída/Ajuste)
- Estoque mínimo com alertas
- Rastreabilidade total de movimentações
- Histórico detalhado com usuário e data

### 👥 **Controle de Usuários**
- 4 níveis de acesso (Super Admin, Admin, Gerente, Funcionário)
- Permissões granulares por role
- Usuários ilimitados
- Avatar personalizado
- Sistema de ativação/desativação

### 📊 **Relatórios Automáticos**
- Envio por E-mail (SMTP configurável)
- Envio por WhatsApp (Evolution API)
- Agendamento (Diário/Semanal/Mensal)
- Produtos em falta automático
- Dashboard com métricas em tempo real

### 🎨 **Interface Moderna**
- Design clean e profissional
- Dark mode nativo
- 100% responsivo (mobile/tablet/desktop)
- Animações suaves
- Experiência de usuário premium

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19.2.0** - Framework JavaScript mais moderno
- **TypeScript 5.x** - Tipagem estática e segurança
- **Tailwind CSS** - Design system responsivo
- **Vite 5.x** - Build tool ultrarrápido
- **Recharts** - Gráficos e visualizações

### Backend
- **PHP 8.x** - Linguagem server-side
- **MySQL 8.0** - Banco de dados relacional
- **API RESTful** - Arquitetura escalável
- **Session-based Auth** - Autenticação segura

### Integrações
- **Google Gemini AI** - Processamento de notas fiscais
- **Evolution API** - WhatsApp Business
- **SMTP** - E-mail customizável
- **CSV Import/Export** - Importação em massa

---

## 📦 Instalação

### Pré-requisitos

- PHP 8.0 ou superior
- MySQL 8.0 ou superior
- Node.js 18+ (para desenvolvimento)
- Servidor web (Apache/Nginx)
- cPanel ou acesso SSH (para produção)

### Passo a Passo

1. **Clone o repositório:**
```bash
git clone https://github.com/ybngf/Zap-Estoque.git
cd Zap-Estoque
```

2. **Configurar banco de dados:**
```bash
mysql -u root -p
CREATE DATABASE zap_estoque;
USE zap_estoque;
source database/schema.sql
```

3. **Configurar backend:**
```bash
cd public_html
cp config.example.php config.php
# Edite config.php com suas credenciais
```

4. **Instalar dependências (desenvolvimento):**
```bash
npm install
```

5. **Build do frontend:**
```bash
npm run build
```

6. **Configurar servidor web:**
- Aponte o DocumentRoot para `public_html/`
- Habilite mod_rewrite (Apache)
- Configure CORS se necessário

7. **Acessar o sistema:**
```
http://localhost
# Usuário padrão: admin@admin.com
# Senha padrão: admin123
```

---

## 🚀 Deploy em Produção

### cPanel

1. Upload dos arquivos via FTP ou File Manager
2. Importar banco de dados via phpMyAdmin
3. Configurar `config.php` com credenciais do cPanel
4. Acessar via domínio

### VPS/Servidor Dedicado

Consulte `DEPLOY_GUIDE.md` para instruções detalhadas.

---

## 📚 Documentação

- **[CONFIGURACAO-LOCALHOST.md](CONFIGURACAO-LOCALHOST.md)** - Setup em ambiente local
- **[GUIA-INSTALACAO-CPANEL.md](GUIA-INSTALACAO-CPANEL.md)** - Deploy em cPanel
- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Deploy completo
- **[CONFIGURACAO-RELATORIOS.md](CONFIGURACAO-RELATORIOS.md)** - Setup de relatórios
- **[DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)** - Sistema de ativação
- **[SUPER_ADMIN_MULTIEMPRESA.md](SUPER_ADMIN_MULTIEMPRESA.md)** - Multi-empresa
- **[RENOMEACAO_ZAP_ESTOQUE.md](RENOMEACAO_ZAP_ESTOQUE.md)** - Histórico de renomeação

---

## 🎯 Funcionalidades Detalhadas

### Dashboard
- Total de produtos
- Produtos em falta
- Movimentações recentes
- Gráficos de estoque
- Alertas importantes

### Produtos
- Cadastro completo (nome, SKU, categoria, fornecedor, preço, estoque)
- Upload de imagem
- Filtros avançados (categoria, fornecedor, estoque baixo)
- Importação CSV em massa
- Exportação de dados
- Multi-empresa (Super Admin vê todas)

### Categorias
- Gerenciamento completo
- Ordenação alfabética
- Contador de produtos por categoria
- Importação CSV
- Multi-empresa com filtro

### Fornecedores
- Cadastro com contato completo
- E-mail e telefone
- Pessoa de contato
- Contador de produtos
- Importação CSV
- Multi-empresa com filtro

### Movimentações de Estoque
- Entrada, Saída e Ajuste
- Motivo obrigatório
- Rastreamento de usuário
- Data e hora automáticos
- Histórico completo
- Multi-empresa (Super Admin)

### Processamento de NF com IA
- Upload de imagem da nota fiscal
- Google Gemini extrai dados automaticamente
- Preview antes de salvar
- Cadastro em lote
- Economia massiva de tempo

### Usuários
- 4 níveis (Super Admin, Admin, Gerente, Funcionário)
- Avatar personalizado
- Ativação/desativação
- Filtro por empresa
- Gerenciamento completo

### Empresas (Super Admin)
- Cadastro de múltiplas empresas
- Ativação/desativação em cascata
- CNPJ e endereço
- Contador de usuários
- Isolamento de dados

### Configurações do Sistema
- Nome do sistema customizável
- Logo personalizável
- Chave API do Gemini
- SMTP para e-mails
- Evolution API para WhatsApp
- Agendamento de relatórios

### Log de Atividades
- Auditoria completa (INSERT, UPDATE, DELETE)
- Registro de usuário e IP
- Dados antes/depois da alteração
- Paginação eficiente
- Filtro por entidade

---

## 🔐 Níveis de Acesso

### Super Admin
- Acesso total ao sistema
- Gerencia todas as empresas
- Visualiza dados consolidados
- Ativa/desativa empresas e usuários
- Configurações globais

### Admin
- Gerencia sua empresa
- Cadastra usuários da empresa
- Acessa todos os módulos
- Relatórios e configurações

### Gerente
- Visualiza e edita produtos
- Registra movimentações
- Acessa relatórios
- Sem acesso a usuários

### Funcionário
- Visualiza produtos
- Registra movimentações básicas
- Acesso limitado

---

## 🎨 Screenshots

### Dashboard
![Dashboard](Imagens/menu%20dashboard.png)

### Menu Super Admin
![Super Admin](Imagens/menu%20superadm.png)

### Importação com IA
![IA](Imagens/importar%20com%20ia.png)

### Importação CSV
![CSV](Imagens/importacao%20de%20csv.png)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fork o projeto
2. Criar uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**ybngf**

- GitHub: [@ybngf](https://github.com/ybngf)
- Repositório: [Zap-Estoque](https://github.com/ybngf/Zap-Estoque)

---

## 📞 Suporte

Para reportar bugs ou solicitar funcionalidades, abra uma [issue](https://github.com/ybngf/Zap-Estoque/issues).

---

## 🙏 Agradecimentos

- Google Gemini AI por processamento de NF
- Comunidade React
- Comunidade PHP
- Todos os contribuidores

---

## 📊 Status do Projeto

✅ **EM PRODUÇÃO** - Sistema estável e pronto para uso

### Próximas Features
- [ ] App mobile nativo (React Native)
- [ ] API pública para integrações
- [ ] Módulo de vendas integrado
- [ ] Relatórios avançados com BI
- [ ] Integração com e-commerce

---

**⭐ Se este projeto foi útil, deixe uma estrela!**

---

*Desenvolvido com ❤️ usando React, TypeScript e PHP*
