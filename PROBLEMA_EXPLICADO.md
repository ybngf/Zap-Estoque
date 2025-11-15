# 🔴 POR QUE "CREDENCIAIS INVÁLIDAS"?

## O Problema Real:

```
┌─────────────────────────────────────────────────────────────┐
│  SEU COMPUTADOR (Windows - localhost)                      │
│                                                              │
│  ┌──────────────┐         ┌───────────────┐                │
│  │   Frontend   │  →→→→   │  Backend API  │                │
│  │ localhost:   │         │  Node.js      │                │
│  │    5173      │         │  Port: 3001   │                │
│  └──────────────┘         └───────┬───────┘                │
│                                    │                         │
│                                    │ Tenta conectar...      │
│                                    ▼                         │
└────────────────────────────────────┼─────────────────────────┘
                                     │
                                     │ ❌ BLOQUEADO!
                                     │ Porta 3306 fechada
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVIDOR ALMALINUX (148.113.165.172)                      │
│                                                              │
│  ┌──────────────────────────────────────┐                  │
│  │  MySQL Database                      │                  │
│  │  Porta: 3306 (BLOQUEADA EXTERNAMENTE)│                  │
│  │  ❌ Firewall bloqueia conexões       │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘

RESULTADO: Backend não conecta → Não valida login → "Credenciais inválidas"
```

---

## ✅ Como Deve Funcionar (Produção):

```
┌─────────────────────────────────────────────────────────────┐
│  NAVEGADOR DO USUÁRIO                                       │
│                                                              │
│  Acessa: https://seudominio.com                            │
│                 │                                            │
│                 ▼                                            │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  │ Internet
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVIDOR ALMALINUX (mesmo lugar)                          │
│                                                              │
│  ┌──────────────┐         ┌───────────┐      ┌──────────┐  │
│  │   Frontend   │  →→→→   │    PHP    │  →→  │  MySQL   │  │
│  │  HTML/CSS/JS │         │  api.php  │      │localhost │  │
│  │  (estático)  │         │           │      │:3306 ✅  │  │
│  └──────────────┘         └───────────┘      └──────────┘  │
│                                                              │
│  TUDO NO MESMO SERVIDOR = SEM BLOQUEIO!                    │
└─────────────────────────────────────────────────────────────┘

RESULTADO: PHP conecta localhost → Valida login → ✅ Sucesso!
```

---

## 🎯 O QUE FAZER AGORA?

### VOCÊ TEM 2 OPÇÕES:

### 🌐 OPÇÃO A: Testar no SERVIDOR (Mais Fácil)

```bash
1. ✅ Build já está pronto (você rodou npm run deploy)
   
2. 📤 ENVIE para o servidor:
   - Acesse cPanel → File Manager
   - Navegue para public_html/
   - Envie TODOS os arquivos de: D:\Estoque Gemini\public_html\
   
3. 🗄️ CRIE as tabelas:
   - cPanel → phpMyAdmin
   - Database: dona_estoqueg
   - SQL tab
   - Cole: D:\Estoque Gemini\server\database\schema.sql
   - Execute
   
4. 🧪 TESTE:
   - Acesse: https://seudominio.com/test-db.php
   - Deve mostrar: "connection": true
   
5. 🎉 LOGIN:
   - Acesse: https://seudominio.com
   - Email: admin@sistema.com
   - Senha: 123456
```

---

### 🖥️ OPÇÃO B: MySQL LOCAL (Para Desenvolver)

```powershell
# 1. INSTALAR MySQL Windows
# Download: https://dev.mysql.com/downloads/installer/
# Escolha: MySQL Community Server
# Senha root: 123456

# 2. CRIAR BANCO E USUÁRIO
mysql -u root -p
# Digite senha: 123456

CREATE DATABASE dona_estoqueg;
CREATE USER 'dona_estoqueg'@'localhost' IDENTIFIED BY 'nYW0bHpnYW0bHp';
GRANT ALL PRIVILEGES ON dona_estoqueg.* TO 'dona_estoqueg'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. IMPORTAR DADOS
cd "D:\Estoque Gemini"
mysql -u dona_estoqueg -pnYW0bHpnYW0bHp dona_estoqueg < server\database\schema.sql

# 4. ATUALIZAR .env
# Edite D:\Estoque Gemini\.env:
DB_HOST=localhost
DB_USER=dona_estoqueg
DB_PASSWORD=nYW0bHpnYW0bHp
DB_NAME=dona_estoqueg
PORT=3001

# 5. INICIAR BACKEND (Terminal 1)
cd server
npm start

# 6. INICIAR FRONTEND (Terminal 2 - PowerShell novo)
cd "D:\Estoque Gemini"
npm run dev

# 7. TESTAR
# Acessar: http://localhost:5173
# Login: admin@sistema.com / 123456
```

---

## 🔥 TESTE RÁPIDO AGORA

Um arquivo HTML foi aberto no seu navegador!

1. **Selecione** o ambiente:
   - Para teste local: "Backend Node.js (localhost:3001)"  
   - Para produção: "Produção (mesmo domínio)"

2. **Clique** em um dos usuários da lista

3. **Veja** o resultado:
   - ✅ Verde = Funcionou
   - ❌ Vermelho = Veja o diagnóstico mostrado

---

## 📊 DIAGNÓSTICO ATUAL

Com base no teste que rodamos:

```
✅ Build do frontend: OK (808 KB)
✅ Arquivos PHP criados: OK
✅ Variáveis .env: OK (148.113.165.172)
❌ Conexão MySQL: FALHOU (porta 3306 bloqueada)
⚠️  Teste local: NÃO FUNCIONA (precisa MySQL local ou deploy)
```

---

## 💡 RECOMENDAÇÃO

**Para você que quer apenas VER FUNCIONANDO:**

👉 **USE OPÇÃO A** (deploy no servidor)
- Mais rápido (10 minutos)
- Não precisa instalar nada
- É onde vai funcionar de verdade

**Para você que quer DESENVOLVER:**

👉 **USE OPÇÃO B** (MySQL local)
- Demora mais (30 minutos)
- Precisa instalar MySQL
- Permite testar mudanças rapidamente

---

## ❓ QUAL VOCÊ PREFERE?

Me diga e eu te guio passo a passo! 🚀
