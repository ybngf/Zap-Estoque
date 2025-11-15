# ⚙️ CONFIGURAÇÃO PARA SUBDIRETÓRIO

## 🎯 URL DO SEU SISTEMA

```
https://www.donasalada.com.br/EstoqueGemini
```

---

## ✅ ALTERAÇÕES FEITAS

### 1. **services/api.ts** - Detecção automática de subdiretório
```typescript
// Antes:
const API_URL = '/api';

// Depois:
const getBasePath = () => {
  const path = window.location.pathname;
  const baseDir = path.substring(0, path.lastIndexOf('/'));
  return baseDir ? `${baseDir}/api` : '/api';
};
// Agora funciona em: /EstoqueGemini/api
```

### 2. **.htaccess** - RewriteBase ajustado
```apache
# Antes:
RewriteBase /

# Depois:
RewriteBase /EstoqueGemini/
```

### 3. **vite.config.ts** - Caminhos relativos
```typescript
base: './'  // Gera caminhos relativos (./assets/)
```

---

## 🏗️ ESTRUTURA NO SERVIDOR

```
/home/usuario/public_html/
└── EstoqueGemini/           ← Seu subdiretório
    ├── index.html           ← Frontend
    ├── assets/              ← CSS/JS
    │   └── index-xxx.js
    ├── api.php              ← Backend
    ├── .htaccess            ← ATUALIZADO!
    ├── test-db.php
    ├── super-diagnostico.php
    └── diagnostico-servidor.html
```

---

## 📋 URLS CORRETAS

Após deploy, estas URLs devem funcionar:

```
✅ Frontend:
https://www.donasalada.com.br/EstoqueGemini

✅ API Health:
https://www.donasalada.com.br/EstoqueGemini/api/health

✅ API Login:
https://www.donasalada.com.br/EstoqueGemini/api/auth/login

✅ Test DB:
https://www.donasalada.com.br/EstoqueGemini/test-db.php

✅ Super Diagnóstico:
https://www.donasalada.com.br/EstoqueGemini/super-diagnostico.php

✅ Diagnóstico Visual:
https://www.donasalada.com.br/EstoqueGemini/diagnostico-servidor.html
```

---

## 🔧 COMO FUNCIONA

### Detecção Automática de Caminho:

```javascript
// URL atual: https://www.donasalada.com.br/EstoqueGemini/
window.location.pathname = '/EstoqueGemini/'

// Extrai base dir:
const baseDir = '/EstoqueGemini'

// API URL final:
API_URL = '/EstoqueGemini/api'
```

### .htaccess Rewrite:

```apache
# Requisição: /EstoqueGemini/api/auth/login
# RewriteBase: /EstoqueGemini/
# RewriteRule: ^api/(.*)$ api.php
# Resultado: /EstoqueGemini/api.php com PATH_INFO=/auth/login
```

---

## ⚠️ IMPORTANTE: REBUILD NECESSÁRIO!

Execute novamente o build:

```powershell
npm run deploy
```

Isso vai gerar os arquivos com as novas configurações!

---

## 📤 ARQUIVOS PARA ENVIAR

Após o rebuild, envie para `/EstoqueGemini/` no servidor:

```
✅ index.html              (atualizado)
✅ assets/                 (atualizado)
✅ .htaccess               (CRÍTICO - atualizado!)
✅ api.php                 (com debug)
✅ test-db.php             (atualizado)
✅ super-diagnostico.php
✅ diagnostico-servidor.html
```

---

## 🧪 TESTE APÓS DEPLOY

### 1. Teste API Health:
```bash
curl https://www.donasalada.com.br/EstoqueGemini/api/health
```

**Esperado:**
```json
{"status":"ok","message":"Server is running"}
```

### 2. Teste Database:
```
https://www.donasalada.com.br/EstoqueGemini/test-db.php
```

**Esperado:**
```json
{
  "connection": true,
  "tables": [...],
  "users": [...]
}
```

### 3. Teste Login:
```bash
curl -X POST https://www.donasalada.com.br/EstoqueGemini/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"123456"}'
```

**Esperado:**
```json
{
  "id": 1,
  "name": "Admin Sistema",
  "email": "admin@sistema.com",
  ...
}
```

### 4. Teste Frontend:
```
https://www.donasalada.com.br/EstoqueGemini
```

Login: `admin@sistema.com` / `123456`

---

## 🔍 SE NÃO FUNCIONAR

### Erro: "404 Not Found" na API

**Causa:** .htaccess não está sendo processado

**Solução:**
```apache
# Verifique se AllowOverride está habilitado no Apache
# Ou teste sem rewrite:
https://www.donasalada.com.br/EstoqueGemini/api.php?request=health
```

### Erro: Assets não carregam (404)

**Causa:** Caminhos absolutos em vez de relativos

**Solução:**
```bash
# Rebuild com base: './'
npm run deploy

# Verifique no index.html se tem:
# <script src="./assets/index-xxx.js">  ✅
# E NÃO:
# <script src="/assets/index-xxx.js">   ❌
```

### Erro: "Credenciais inválidas" ainda

**Causa:** Problema no banco, não no caminho

**Solução:**
```
Acesse: https://www.donasalada.com.br/EstoqueGemini/super-diagnostico.php
```

---

## 🎯 CHECKLIST FINAL

- [ ] 1. Executou `npm run deploy` após as alterações
- [ ] 2. Enviou TODOS os arquivos para `/EstoqueGemini/`
- [ ] 3. Incluiu o `.htaccess` atualizado
- [ ] 4. Testou `/EstoqueGemini/api/health`
- [ ] 5. Testou `/EstoqueGemini/test-db.php`
- [ ] 6. Executou `/EstoqueGemini/super-diagnostico.php`
- [ ] 7. Acessou `/EstoqueGemini/` e fez login

---

## 💡 DICA PRO

Se quiser mover para raiz depois:

```bash
# Basta mudar .htaccess:
RewriteBase /

# E funcionará em:
# https://www.donasalada.com.br/
```

O código detecta automaticamente o caminho! 🚀
