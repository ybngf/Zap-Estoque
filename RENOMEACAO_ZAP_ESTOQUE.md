# 🔄 Renomeação: Estoque Gemini → Zap Estoque

## Resumo da Alteração

Todo o sistema foi renomeado de **"Estoque Gemini"** para **"Zap Estoque"** em 20/11/2025.

---

## ✅ Arquivos Modificados

### 1. **Backend (PHP)**
- ✅ `public_html/api.php` - Comentário do cabeçalho
- ✅ `public_html/config.php` - APP_NAME e comentário

### 2. **Frontend (React/TypeScript)**
- ✅ `components/Sidebar.tsx` - Estado inicial do nome
- ✅ `components/Header.tsx` - Estado inicial do nome
- ✅ `components/Login.tsx` - Estado inicial do nome
- ✅ `components/Settings.tsx` - Placeholder do campo

### 3. **HTML**
- ✅ `index.html` - Título da página (dev)
- ✅ `public_html/index.html` - Título da página (build)

### 4. **Scripts de Deploy**
- ✅ `deploy.ps1` - Banner do script
- ✅ `deploy.sh` - Banner do script

### 5. **Documentação**
- ✅ `ANUNCIO_MERCADO_LIVRE.md` - Rodapé do documento

### 6. **Build Gerado**
- ✅ `public_html/index.html` - Nova build com título atualizado
- ✅ `public_html/assets/index-B0dX1Ly6.js` - Novo arquivo de build (981.66 kB)

---

## 📝 Alterações Específicas

### Backend

**api.php (linha 3):**
```php
// ANTES:
 * API Backend for Estoque Gemini

// DEPOIS:
 * API Backend for Zap Estoque
```

**config.php (linha 3 e 14):**
```php
// ANTES:
 * Database configuration for Estoque Gemini
define('APP_NAME', 'Estoque Gemini');

// DEPOIS:
 * Database configuration for Zap Estoque
define('APP_NAME', 'Zap Estoque');
```

### Frontend

**Sidebar.tsx, Header.tsx, Login.tsx:**
```typescript
// ANTES:
const [systemName, setSystemName] = useState<string>('Estoque Gemini');

// DEPOIS:
const [systemName, setSystemName] = useState<string>('Zap Estoque');
```

**Settings.tsx:**
```typescript
// ANTES:
placeholder="Ex: Estoque Gemini"

// DEPOIS:
placeholder="Ex: Zap Estoque"
```

**index.html:**
```html
<!-- ANTES: -->
<title>Estoque Gemini - Sistema de Gestão de Estoque</title>

<!-- DEPOIS: -->
<title>Zap Estoque - Sistema de Gestão de Estoque</title>
```

---

## 🔍 Arquivos NÃO Alterados (Referências Contextuais)

Os seguintes arquivos contêm referências a "Estoque Gemini" mas NÃO foram alterados pois são:
- Documentação de histórico/procedimentos
- Caminhos de diretório (D:\Estoque Gemini)
- URLs do GitHub (estoque-gemini)
- Referências em tutoriais

### Lista:
- `DEPLOYMENT_INSTRUCTIONS.md`
- `ATUALIZAR-API-SERVIDOR.md`
- `CONFIGURACAO-LOCALHOST.md`
- `CONFIGURACOES-SISTEMA.md`
- `DEPLOY_GUIDE.md`
- `ENVIAR-PARA-GITHUB.md`
- `GUIA-INSTALACAO-CPANEL.md`
- `README.md`
- `README_PT.md`
- `SETUP_INSTRUCTIONS.md`

**Nota:** Estes arquivos mantêm referências históricas e de caminho. Se precisar, podem ser atualizados manualmente.

---

## 🎯 Onde o Nome Aparece Agora

### 1. **Tela de Login**
- Título: "Zap Estoque"
- (Pode ser alterado nas configurações do sistema)

### 2. **Cabeçalho do Sistema**
- Nome padrão: "Zap Estoque"
- (Pode ser alterado nas configurações do sistema)

### 3. **Sidebar**
- Nome padrão: "Zap Estoque"
- (Pode ser alterado nas configurações do sistema)

### 4. **Título do Navegador**
- "Zap Estoque - Sistema de Gestão de Estoque"

### 5. **Configurações do Sistema**
- Campo padrão sugere: "Ex: Zap Estoque"
- Valor inicial no banco: "Zap Estoque" (se nova instalação)

---

## 🗃️ Banco de Dados

### Tabela: `system_settings`

**Campo `system_name`:**
```sql
-- Para atualizar em instalações existentes:
UPDATE system_settings 
SET value = 'Zap Estoque' 
WHERE setting_key = 'system_name';
```

**⚠️ IMPORTANTE:** 
- Instalações existentes mantêm o nome anterior no banco
- Usuários podem alterar o nome via Configurações → Sistema
- O novo padrão "Zap Estoque" aparece em novas instalações

---

## 📦 Nova Build

### Arquivo Gerado:
- `public_html/assets/index-B0dX1Ly6.js` (981.66 kB)
- `public_html/index.html` (atualizado)

### Diferenças da Build Anterior:
- Hash do arquivo mudou: `C5f_85We` → `B0dX1Ly6`
- Título da página atualizado
- Estados iniciais dos componentes atualizados

---

## 🚀 Próximos Passos

### Para Deploy em Produção:

1. **Upload dos Arquivos:**
```bash
# Backend
scp d:/Estoque\ Gemini/public_html/api.php root@servidor:/path/
scp d:/Estoque\ Gemini/public_html/config.php root@servidor:/path/

# Frontend (build)
scp d:/Estoque\ Gemini/public_html/index.html root@servidor:/path/
scp d:/Estoque\ Gemini/public_html/assets/index-B0dX1Ly6.js root@servidor:/path/assets/
```

2. **Atualizar Banco de Dados (Opcional):**
```sql
UPDATE system_settings 
SET value = 'Zap Estoque' 
WHERE setting_key = 'system_name';
```

3. **Limpar Cache do Navegador:**
- Ctrl + F5 ou Ctrl + Shift + R
- Ou limpar cache manualmente

---

## ✅ Checklist de Testes

Após o deploy, testar:

- [ ] Título da aba do navegador mostra "Zap Estoque"
- [ ] Tela de login mostra "Zap Estoque"
- [ ] Cabeçalho do sistema mostra "Zap Estoque"
- [ ] Sidebar mostra "Zap Estoque"
- [ ] Configurações → Sistema permite alterar o nome
- [ ] Ao alterar nas configurações, nome muda em todo o sistema

---

## 📊 Impacto da Mudança

### ✅ SEM Impacto:
- Funcionalidades do sistema
- Banco de dados
- APIs e integrações
- Permissões de usuários
- Dados armazenados

### ⚠️ COM Impacto:
- Título do navegador
- Nome exibido na interface
- Estados iniciais dos componentes
- Documentação futura

---

## 🔄 Reversão (Se Necessário)

Para voltar ao nome anterior:

1. Restaurar arquivos do commit anterior
2. Fazer nova build
3. Atualizar no servidor

Ou simplesmente alterar via:
**Configurações → Sistema → Nome do Sistema**

---

## 📝 Observações

1. **Customização:** O nome pode ser alterado a qualquer momento via Configurações do Sistema
2. **Multi-empresa:** Cada empresa pode ter seu próprio nome exibido
3. **Logo:** O sistema suporta logo customizado que substitui o nome textual
4. **Tema:** O nome se adapta automaticamente ao dark mode

---

**Data da Alteração:** 20/11/2025  
**Build Gerada:** index-B0dX1Ly6.js (981.66 kB)  
**Status:** ✅ COMPLETO
