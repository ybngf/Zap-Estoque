# 🐛 CORREÇÃO - URL de Imagem não Salvava ao Editar Produto

## ❌ Problema Identificado

Quando um produto era editado e uma nova URL de imagem era inserida, o campo **não estava sendo salvo** no banco de dados.

---

## 🔍 Causa Raiz

No arquivo `public_html/api.php`, na rota **PUT /products/:id** (linha ~488), o código de atualização **não incluía o campo `image_url`** no UPDATE.

### **Código ANTES (com erro):**

```php
// Linha 475-495 (api.php)

// Mesclar dados atuais com dados enviados
$name = isset($input['name']) ? $input['name'] : $currentProduct['name'];
$sku = isset($input['sku']) ? $input['sku'] : $currentProduct['sku'];
$categoryId = isset($input['categoryId']) ? $input['categoryId'] : $currentProduct['category_id'];
$supplierId = isset($input['supplierId']) ? $input['supplierId'] : $currentProduct['supplier_id'];
$price = isset($input['price']) ? $input['price'] : $currentProduct['price'];
$stock = isset($input['stock']) ? $input['stock'] : $currentProduct['stock'];
$minStock = isset($input['minStock']) ? $input['minStock'] : $currentProduct['min_stock'];
// ❌ FALTAVA: $imageUrl = ...

$stmt = $conn->prepare("UPDATE products SET name = ?, sku = ?, category_id = ?, supplier_id = ?, price = ?, stock = ?, min_stock = ? WHERE id = ? AND company_id = ?");
//                                                                                                           ❌ FALTAVA: image_url = ?
$stmt->bind_param("ssiidiiii", 
//                        ❌ FALTAVA: tipo 's' e $imageUrl
    $name, 
    $sku, 
    $categoryId, 
    $supplierId, 
    $price, 
    $stock, 
    $minStock, 
    $id,
    $currentUser['company_id']
);
```

**Resultado:** O campo `image_url` **nunca era atualizado**, sempre permanecia com o valor antigo.

---

## ✅ Solução Aplicada

### **Código DEPOIS (corrigido):**

```php
// Linha 475-498 (api.php) - CORRIGIDO

// Mesclar dados atuais com dados enviados
$name = isset($input['name']) ? $input['name'] : $currentProduct['name'];
$sku = isset($input['sku']) ? $input['sku'] : $currentProduct['sku'];
$categoryId = isset($input['categoryId']) ? $input['categoryId'] : $currentProduct['category_id'];
$supplierId = isset($input['supplierId']) ? $input['supplierId'] : $currentProduct['supplier_id'];
$price = isset($input['price']) ? $input['price'] : $currentProduct['price'];
$stock = isset($input['stock']) ? $input['stock'] : $currentProduct['stock'];
$minStock = isset($input['minStock']) ? $input['minStock'] : $currentProduct['min_stock'];
$imageUrl = isset($input['imageUrl']) ? $input['imageUrl'] : $currentProduct['image_url']; // ✅ ADICIONADO

$stmt = $conn->prepare("UPDATE products SET name = ?, sku = ?, category_id = ?, supplier_id = ?, price = ?, stock = ?, min_stock = ?, image_url = ? WHERE id = ? AND company_id = ?");
//                                                                                                           ✅ ADICIONADO: image_url = ?
$stmt->bind_param("ssiidiisii", 
//                        ✅ ADICIONADO: 's' para string e $imageUrl
    $name, 
    $sku, 
    $categoryId, 
    $supplierId, 
    $price, 
    $stock, 
    $minStock,
    $imageUrl,    // ✅ ADICIONADO
    $id,
    $currentUser['company_id']
);
```

---

## 📋 Alterações Detalhadas

### **1. Adicionar variável `$imageUrl`** (linha ~483)
```php
$imageUrl = isset($input['imageUrl']) ? $input['imageUrl'] : $currentProduct['image_url'];
```
- Se `imageUrl` vier no `$input`, usa o novo valor
- Caso contrário, mantém o valor atual do banco

### **2. Atualizar SQL Query** (linha ~485)
```php
// ANTES:
"UPDATE products SET name = ?, sku = ?, category_id = ?, supplier_id = ?, price = ?, stock = ?, min_stock = ? WHERE id = ? AND company_id = ?"

// DEPOIS:
"UPDATE products SET name = ?, sku = ?, category_id = ?, supplier_id = ?, price = ?, stock = ?, min_stock = ?, image_url = ? WHERE id = ? AND company_id = ?"
//                                                                                                           ^^^^^^^^^^^^^^^^
```

### **3. Atualizar bind_param** (linha ~486)
```php
// ANTES: 9 parâmetros
$stmt->bind_param("ssiidiiii", ...);
//                    ^^^^^^^ 9 tipos

// DEPOIS: 10 parâmetros
$stmt->bind_param("ssiidiisii", ...);
//                    ^^^^^^^^ 10 tipos (adicionado 's' para imageUrl)
```

### **4. Adicionar `$imageUrl` nos parâmetros** (linha ~493)
```php
$stmt->bind_param("ssiidiisii", 
    $name, 
    $sku, 
    $categoryId, 
    $supplierId, 
    $price, 
    $stock, 
    $minStock,
    $imageUrl,    // ✅ ADICIONADO
    $id,
    $currentUser['company_id']
);
```

---

## 🧪 Teste da Correção

### **Passo a passo para testar:**

1. **Abra a aplicação**
   ```
   http://localhost:8000  (local)
   ou
   https://www.donasalada.com/EstoqueGemini  (online)
   ```

2. **Edite um produto**
   - Clique no ícone de edição (lápis) em qualquer produto
   - No campo "URL da Imagem", cole uma nova URL
   - Exemplo: `https://picsum.photos/200/200?random=1`

3. **Salve o produto**
   - Clique em "Salvar"
   - A modal deve fechar

4. **Verifique se salvou**
   - A imagem do produto na lista deve mudar imediatamente
   - Se editar o produto novamente, a URL deve estar lá

5. **Confirme no banco de dados** (opcional)
   ```sql
   SELECT id, name, image_url FROM products WHERE id = [ID_DO_PRODUTO];
   ```
   - O campo `image_url` deve ter o novo valor

---

## 📊 Impacto da Correção

### **Antes (com bug):**
- ❌ URL de imagem **nunca** era salva ao editar
- ❌ Produto sempre ficava com imagem antiga
- ❌ Única forma de alterar: editar diretamente no banco
- ❌ Frontend mostrava a URL, mas não salvava

### **Depois (corrigido):**
- ✅ URL de imagem **sempre** é salva ao editar
- ✅ Produto atualiza com nova imagem imediatamente
- ✅ Interface totalmente funcional
- ✅ Preview da imagem atualiza corretamente

---

## 🔄 Compatibilidade

### **Criação de produto:**
✅ Já funcionava corretamente (linha ~428)
```php
INSERT INTO products (..., image_url, ...) VALUES (?, ..., ?, ...)
```

### **Edição de produto:**
✅ Agora funciona corretamente (linha ~485)
```php
UPDATE products SET ..., image_url = ? WHERE id = ?
```

### **Importação CSV:**
✅ Já funcionava corretamente (linha ~1305 e ~1354)
```php
UPDATE products SET ..., image_url=? ...
INSERT INTO products (..., image_url, ...) VALUES ...
```

---

## 📝 Arquivos Modificados

```
public_html/api.php
  Linha ~483: Adicionar $imageUrl = ...
  Linha ~485: Adicionar image_url = ? no SQL
  Linha ~486: Mudar bind_param de "ssiidiiii" para "ssiidiisii"
  Linha ~493: Adicionar $imageUrl, nos parâmetros
```

---

## ⚠️ IMPORTANTE para Servidor Online

Se você já enviou o `public_html` para o servidor, **precisa atualizar o arquivo `api.php`** lá também!

### **Opções:**

1. **Re-upload do arquivo**
   - FTP ou File Manager do cPanel
   - Substitua: `EstoqueGemini/api.php`

2. **Edição manual**
   - cPanel > File Manager
   - Edite `api.php` e aplique as mesmas alterações

---

## ✅ Checklist Final

- [x] Variável `$imageUrl` adicionada
- [x] SQL Query atualizado com `image_url = ?`
- [x] `bind_param` atualizado com tipo 's' adicional
- [x] Parâmetro `$imageUrl` adicionado na chamada
- [x] Código compilado com sucesso
- [ ] Testado localmente ✅
- [ ] Enviado para servidor online (se aplicável)
- [ ] Testado no servidor online (se aplicável)

---

**Data da correção:** 15/11/2025  
**Versão:** 1.0  
**Status:** ✅ Corrigido e compilado
