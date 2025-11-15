# 🎯 TESTE RÁPIDO - Subdiretório EstoqueGemini

## ✅ CORREÇÕES APLICADAS

Sistema agora funciona em: **https://www.donasalada.com.br/EstoqueGemini**

### O que foi corrigido:
- ✅ API detecta subdiretório automaticamente
- ✅ .htaccess configurado para /EstoqueGemini/
- ✅ Caminhos relativos para assets
- ✅ Build atualizado (808 KB)

---

## 📤 ARQUIVOS PARA ENVIAR

Envie TODO o conteúdo de `public_html/` para `/EstoqueGemini/` no servidor:

```
/home/usuario/public_html/EstoqueGemini/
├── index.html                         ← Frontend (0.90 KB)
├── assets/
│   └── index-jQwg9XhL.js             ← JS (808 KB)
├── .htaccess                          ← CRÍTICO! RewriteBase ajustado
├── api.php                            ← Backend com debug
├── test-db.php                        ← Teste básico
├── super-diagnostico.php              ← Diagnóstico completo
└── diagnostico-servidor.html          ← Interface visual
```

---

## 🧪 TESTES A EXECUTAR

### ✅ 1. Health Check
```bash
curl https://www.donasalada.com.br/EstoqueGemini/api/health
```
**Esperado:** `{"status":"ok"...}`

### ✅ 2. Test Database
```
https://www.donasalada.com.br/EstoqueGemini/test-db.php
```
**Esperado:** JSON com `"connection": true`

### ✅ 3. Super Diagnóstico (MAIS IMPORTANTE!)
```
https://www.donasalada.com.br/EstoqueGemini/super-diagnostico.php
```
**Esperado:** "✅ ✅ ✅ TUDO OK!"

### ✅ 4. Teste Login
```bash
curl -X POST https://www.donasalada.com.br/EstoqueGemini/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"123456"}'
```
**Esperado:** Dados do usuário em JSON

### ✅ 5. Acesso ao Sistema
```
https://www.donasalada.com.br/EstoqueGemini
```
**Login:** admin@sistema.com / 123456

---

## 🔍 VERIFICAÇÕES IMPORTANTES

### .htaccess foi enviado?
```bash
# Via SSH:
ls -la /home/usuario/public_html/EstoqueGemini/.htaccess

# Deve existir e ter estas linhas:
# RewriteBase /EstoqueGemini/
```

### Assets carregam?
```
# Abra DevTools (F12) → Network
# Verifique se index-jQwg9XhL.js carrega
# URL deve ser: .../EstoqueGemini/assets/index-jQwg9XhL.js
```

### API está acessível?
```bash
# Teste direto (sem rewrite):
curl https://www.donasalada.com.br/EstoqueGemini/api.php

# Deve retornar erro 404 (normal, precisa do path)
# Mas não deve dar 403 ou 500
```

---

## 🚨 PROBLEMAS COMUNS

### ❌ "404 Not Found" na API

**Causa:** .htaccess não está ativo ou tem erro

**Solução 1 - Verificar arquivo:**
```bash
cat /home/usuario/public_html/EstoqueGemini/.htaccess
```

**Solução 2 - Testar sem rewrite:**
```bash
# Acesse direto (temporário para teste):
https://www.donasalada.com.br/EstoqueGemini/api.php?PATH_INFO=/health
```

**Solução 3 - .htaccess alternativo:**
```apache
# Se não funcionar, use este .htaccess simplificado:
RewriteEngine On
RewriteBase /EstoqueGemini/

# API
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^api/(.*)$ api.php [L,QSA]

# Frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.html [L]
```

### ❌ Assets não carregam (Página em branco)

**Causa:** Caminhos absolutos

**Verificar index.html:**
```html
<!-- CORRETO (relativo): -->
<script type="module" src="./assets/index-jQwg9XhL.js"></script>

<!-- ERRADO (absoluto): -->
<script type="module" src="/assets/index-jQwg9XhL.js"></script>
```

**Solução:** Já está corrigido no build. Re-envie o index.html.

### ❌ "Credenciais inválidas"

**Causa:** Problema no banco, NÃO no subdiretório

**Solução:**
```
https://www.donasalada.com.br/EstoqueGemini/super-diagnostico.php
```

---

## 📝 LOGS PARA DEBUG

### Ver logs do Apache:
```bash
tail -f ~/logs/error_log
```

### Ativar mais logs no PHP:
```php
// Adicione no topo de api.php (temporário):
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Ver requisições no navegador:
```
F12 → Network → Refresh
Veja todas as URLs sendo chamadas
```

---

## 🎯 SEQUÊNCIA DE TESTE RECOMENDADA

Execute NESTA ORDEM:

1. **Upload** → Envie todos arquivos para /EstoqueGemini/
2. **Health** → Teste /api/health
3. **DB Test** → Acesse test-db.php
4. **Diagnóstico** → Execute super-diagnostico.php
5. **Login API** → Teste curl login
6. **Frontend** → Acesse a URL e faça login

Se algum passo falhar, **PARE** e corrija antes de continuar!

---

## ✅ RESULTADO ESPERADO

Depois de tudo configurado:

```
✅ Health Check: OK
✅ Database: Conectado
✅ Usuários: 4 encontrados
✅ Login API: Funcionando
✅ Frontend: Carregando
✅ Login Web: SUCESSO!
```

---

## 📞 PRECISA DE AJUDA?

Execute e me envie:

1. **Resultado de:**
   ```
   https://www.donasalada.com.br/EstoqueGemini/super-diagnostico.php
   ```

2. **Output do curl:**
   ```bash
   curl -v https://www.donasalada.com.br/EstoqueGemini/api/health
   ```

3. **Console do navegador:** (F12 → Console)
   - Erros em vermelho
   - Network tab → Failed requests

Com isso consigo diagnosticar! 🚀

---

**Build pronto:** 808.13 KB (213.49 KB gzip)
**Data:** 14/Nov/2025
**Status:** ✅ Pronto para deploy em /EstoqueGemini/
