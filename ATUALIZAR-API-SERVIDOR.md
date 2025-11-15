# ⚠️ SOLUÇÃO RÁPIDA - Atualizar api.php no Servidor

## 🔴 Problema Identificado

O arquivo `api.php` no servidor ainda tem as configurações antigas (hardcoded). Ele precisa usar o `config.php`.

---

## ✅ SOLUÇÃO - Editar api.php Diretamente no Servidor

### **Opção 1: Via File Manager do cPanel** (RECOMENDADO)

1. **Acesse o cPanel**
   - URL: `https://donasalada.com/cpanel` ou `https://donasalada.com:2083`

2. **Abra o File Manager**
   - Procure por "File Manager" ou "Gerenciador de Arquivos"
   - Clique para abrir

3. **Navegue até o arquivo**
   - Vá para: `public_html/EstoqueGemini/`
   - Encontre o arquivo: `api.php`

4. **Edite o arquivo**
   - Clique com botão direito em `api.php`
   - Selecione **"Edit"** ou **"Editar"**
   - Procure pelas linhas (por volta da linha 18-23):

   **ANTES (versão antiga):**
   ```php
   // Handle preflight requests
   if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
       http_response_code(200);
       exit();
   }

   // Database configuration
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'dona_estoqueg');

   // Database connection
   $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
   ```

   **DEPOIS (versão correta):**
   ```php
   // Handle preflight requests
   if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
       http_response_code(200);
       exit();
   }

   // Load database configuration
   require_once __DIR__ . '/config.php';

   // Database connection
   $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
   ```

5. **Salve o arquivo**
   - Clique em **"Save Changes"** ou **"Salvar Alterações"**
   - Feche o editor

6. **Teste novamente**
   - Acesse: `https://www.donasalada.com/EstoqueGemini/diagnostico-online.php`
   - Agora deve funcionar!

---

### **Opção 2: Re-upload do Arquivo** (MAIS FÁCIL)

1. **Baixe o arquivo atualizado**
   - Você já tem a versão correta na sua máquina local
   - Arquivo: `D:\Estoque Gemini\public_html\api.php`

2. **Faça upload no cPanel**
   - Acesse cPanel > File Manager
   - Vá para: `public_html/EstoqueGemini/`
   - Clique em **"Upload"** no topo
   - Selecione o arquivo `api.php` da sua máquina
   - Confirme para **substituir** o arquivo existente

3. **Teste**
   - Acesse o diagnóstico novamente

---

### **Opção 3: Via FTP** (se você usa FTP)

1. **Conecte via FTP**
   - Host: `donasalada.com`
   - Usuário: (seu usuário cPanel)
   - Porta: 21

2. **Navegue até a pasta**
   - `/public_html/EstoqueGemini/`

3. **Faça upload do api.php**
   - Arraste o arquivo `api.php` local para a pasta
   - Substitua o arquivo existente

---

## 📝 RESUMO DAS ALTERAÇÕES NECESSÁRIAS

### **Alterar em api.php (linhas ~18-23):**

**❌ REMOVER estas linhas:**
```php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');
```

**✅ ADICIONAR esta linha:**
```php
// Load database configuration
require_once __DIR__ . '/config.php';
```

---

## 🎯 RESULTADO ESPERADO

Depois da alteração:

1. **Todas as configurações** ficam no `config.php`
2. **Não precisa editar** `api.php` quando mudar banco
3. **Mais seguro** - um único arquivo para configurar
4. **Mais fácil** de manter

---

## ✅ VERIFICAÇÃO

Após fazer a alteração, teste:

1. **Diagnóstico:**
   ```
   https://www.donasalada.com/EstoqueGemini/diagnostico-online.php
   ```
   - Deve mostrar: "✅ Arquivo config.php encontrado"
   - Deve conectar com sucesso

2. **Login:**
   ```
   https://www.donasalada.com/EstoqueGemini/
   ```
   - Deve permitir login normalmente

---

## 💡 DICA

Se você já editou o `config.php` com os dados corretos do MySQL do cPanel, assim que atualizar o `api.php`, tudo deve funcionar automaticamente!

---

**Criado em:** 15/11/2025  
**Prioridade:** 🔴 URGENTE  
**Tempo estimado:** 2 minutos
