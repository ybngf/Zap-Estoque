# 📦 Instruções para Criar Novo Repositório "Zap-Estoque"

## 🎯 Objetivo

Criar um novo repositório no GitHub chamado **"Zap-Estoque"** e enviar todo o código do projeto renomeado.

---

## 📝 Passo a Passo Completo

### 1️⃣ Criar Repositório no GitHub (Via Web)

1. **Acesse:** https://github.com/new

2. **Preencha os campos:**
   - **Repository name:** `Zap-Estoque`
   - **Description:** `Sistema profissional de gestão de estoque multi-empresa com IA integrada`
   - **Visibility:** 
     - ✅ Public (recomendado) ou
     - ⚠️ Private (se preferir privado)
   - **Initialize:** 
     - ❌ NÃO marque "Add a README file"
     - ❌ NÃO marque "Add .gitignore"
     - ❌ NÃO marque "Choose a license"

3. **Clique:** "Create repository"

4. **Copie a URL** que aparecerá:
   ```
   https://github.com/ybngf/Zap-Estoque.git
   ```

---

### 2️⃣ Adicionar Novo Remote ao Projeto Local

Abra o PowerShell e execute:

```powershell
# Navegar até o diretório do projeto
cd "d:\Estoque Gemini"

# Adicionar o novo remote (Zap-Estoque)
git remote add zap-estoque https://github.com/ybngf/Zap-Estoque.git

# Verificar remotes configurados
git remote -v
```

**Saída esperada:**
```
origin          https://github.com/ybngf/Estoque-Gemini.git (fetch)
origin          https://github.com/ybngf/Estoque-Gemini.git (push)
zap-estoque     https://github.com/ybngf/Zap-Estoque.git (fetch)
zap-estoque     https://github.com/ybngf/Zap-Estoque.git (push)
```

---

### 3️⃣ Enviar Código para o Novo Repositório

```powershell
# Enviar todos os commits para o novo repositório
git push zap-estoque main

# Se pedir para configurar upstream:
git push -u zap-estoque main
```

---

### 4️⃣ Substituir README.md

```powershell
# Renomear o README atual
mv README.md README_OLD.md

# Renomear o novo README
mv README_ZAP_ESTOQUE.md README.md

# Adicionar e commitar
git add .
git commit -m "docs: Atualizar README para Zap Estoque"

# Enviar para ambos os repositórios
git push zap-estoque main
git push origin main  # (opcional - atualiza o antigo também)
```

---

### 5️⃣ Configurar Repositório no GitHub

Acesse: `https://github.com/ybngf/Zap-Estoque`

#### A) **Adicionar Descrição**
- Clique em ⚙️ (Settings) ou edite no topo
- **About → Description:** 
  ```
  Sistema profissional de gestão de estoque multi-empresa com IA integrada
  ```

#### B) **Adicionar Topics (Tags)**
Clique em ⚙️ ao lado da descrição e adicione:
```
react
typescript
php
mysql
inventory-management
stock-control
multi-tenant
artificial-intelligence
gemini-ai
whatsapp-api
erp
business-management
```

#### C) **Adicionar Website** (se tiver):
```
https://www.donasalada.com.br/estoque/
```

---

### 6️⃣ Criar Arquivo LICENSE (Opcional mas Recomendado)

No GitHub, clique em **"Add file" → "Create new file"**

**Nome do arquivo:** `LICENSE`

**Conteúdo (MIT License):**
```
MIT License

Copyright (c) 2025 ybngf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Commit direto no main: "Add MIT License"

---

### 7️⃣ Atualizar .gitignore (se necessário)

Certifique-se de que o `.gitignore` está correto:

```gitignore
# Dependencies
node_modules/
vendor/

# Build
dist/
build/
public_html/assets/*.js
!public_html/assets/index-B0dX1Ly6.js

# Environment
.env
.env.local
.env.production
config.php
public_html/config.php

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
*.sql
!database/schema.sql

# Sensitive
credentials.json
api_keys.txt
```

---

## 🔄 Comandos Resumidos (Copiar e Colar)

```powershell
# 1. Navegar para o projeto
cd "d:\Estoque Gemini"

# 2. Verificar status
git status

# 3. Adicionar remote do novo repo (substitua pela URL real)
git remote add zap-estoque https://github.com/ybngf/Zap-Estoque.git

# 4. Verificar remotes
git remote -v

# 5. Enviar código
git push -u zap-estoque main

# 6. Atualizar README (opcional)
mv README.md README_OLD.md
mv README_ZAP_ESTOQUE.md README.md
git add .
git commit -m "docs: Atualizar README para Zap Estoque"
git push zap-estoque main
```

---

## ✅ Verificação Final

Acesse: `https://github.com/ybngf/Zap-Estoque`

Confira se:
- [ ] Todos os arquivos foram enviados
- [ ] README.md está correto e formatado
- [ ] Imagens estão aparecendo (pasta `Imagens/`)
- [ ] Descrição do repositório está preenchida
- [ ] Topics/tags estão adicionadas
- [ ] LICENSE existe (se adicionou)
- [ ] .gitignore está correto

---

## 🎯 Resultado Esperado

Você terá **2 repositórios** no GitHub:

1. **estoque-gemini** (antigo)
   - https://github.com/ybngf/Estoque-Gemini
   - Histórico completo do projeto

2. **Zap-Estoque** (novo)
   - https://github.com/ybngf/Zap-Estoque
   - Nome atualizado e README novo
   - Mesmo código e histórico

---

## 🔀 Opção Alternativa: Fork + Rename

Se preferir, pode:

1. Fazer fork do repositório antigo
2. Renomear o fork para "Zap-Estoque"
3. Atualizar README e descrição

**Como renomear no GitHub:**
1. Acesse: Settings do repositório
2. Scroll até "Repository name"
3. Digite: `Zap-Estoque`
4. Clique: "Rename"

---

## 🚫 Manter ou Apagar o Antigo?

### Manter (Recomendado):
✅ Preserva histórico e links antigos  
✅ Issues e PRs continuam funcionando  
✅ Pode fazer redirect no README

### Apagar:
⚠️ Perde todo o histórico de issues/PRs  
⚠️ Links externos quebram  
⚠️ Não recomendado

**Melhor opção:** Manter ambos e adicionar aviso no antigo:

```markdown
# ⚠️ AVISO: Projeto Renomeado

Este repositório foi renomeado para **Zap Estoque**.

👉 **Novo repositório:** https://github.com/ybngf/Zap-Estoque

Por favor, atualize seus links e clones.
```

---

## 📞 Suporte

Se tiver problemas:

1. Verifique se o repositório foi criado no GitHub
2. Confira a URL do remote: `git remote -v`
3. Tente novamente o push: `git push -u zap-estoque main --force`
4. Verifique credenciais do GitHub

---

**✅ Pronto! Seu novo repositório "Zap-Estoque" estará online!**
