# 🐛 Debug: Atualização de Fotos (0 produtos atualizados)

## Problema Reportado
✅ Mensagem: "0 produtos tiveram suas fotos atualizadas com sucesso!"

## Possíveis Causas

### 1. **Nenhum produto encontrado nas categorias selecionadas**
- Verificar se há produtos cadastrados
- Verificar se os produtos pertencem às categorias selecionadas

### 2. **API Pixabay não retornando imagens**
- Chave de API inválida
- Limite de requisições excedido (5.000/hora)
- Nome do produto muito genérico ou mal formatado

### 3. **Erro de conexão com Pixabay**
- Timeout da requisição
- Bloqueio de firewall
- SSL verification failure

### 4. **Produtos já possuem imagens**
- Sistema pode estar pulando produtos que já têm `image_url` definido
- (Porém, o código atual **NÃO** verifica isso - atualiza todos)

## Logs Adicionados para Debug

### Local dos Logs

**Windows (XAMPP):**
```
C:\xampp\apache\logs\error.log
C:\xampp\php\logs\php_error_log
```

**Linux (Apache):**
```
/var/log/apache2/error.log
/var/log/php/error.log
```

**Console do Navegador:**
- Abrir DevTools (F12)
- Aba "Network"
- Procurar requisição `bulk-operations`
- Verificar resposta JSON

### O que os logs mostram:

**1. Início da operação:**
```
=== UPDATE IMAGES DEBUG ===
Company ID: 1
Category IDs: [1,2,3]
Placeholders: ?,?,?
SQL Query: SELECT id, name, image_url FROM products WHERE company_id = ? AND category_id IN (?,?,?)
Total products found: 5
```

**2. Processamento de cada produto:**
```
Processing product: ARROZ INTEGRAL 1KG (ID: 10)
Current image URL: NULL
=== SEARCH IMAGE FOR: ARROZ INTEGRAL 1KG ===
Cleaned name: ARROZ INTEGRAL
API Key: 46737899-b...
Pixabay URL: https://pixabay.com/api/?key=...&q=ARROZ+INTEGRAL&...
HTTP Code: 200
Response: {"total":150,"totalHits":150,"hits":[{"id":12345,...
✓ Found image: https://pixabay.com/get/...
✓ Updated product #10
```

**3. Produto sem imagem encontrada:**
```
Processing product: PRODUTO XPTO (ID: 20)
=== SEARCH IMAGE FOR: PRODUTO XPTO ===
Cleaned name: PRODUTO XPTO
HTTP Code: 200
✗ No hits found in API response
✗ Skipped product #20 - no image found
```

**4. Resultado final:**
```
=== RESULTS: Updated=3, Skipped=2 ===
```

## Como Verificar os Logs

### Opção 1: Ver logs do Apache/PHP em tempo real

**PowerShell (XAMPP):**
```powershell
Get-Content C:\xampp\apache\logs\error.log -Tail 50 -Wait
```

**CMD (XAMPP):**
```cmd
tail -f C:\xampp\apache\logs\error.log
```

**Linux:**
```bash
tail -f /var/log/apache2/error.log
```

### Opção 2: Verificar resposta da API no navegador

1. Abrir DevTools (F12)
2. Ir na aba **Network**
3. Clicar em **"🤖 Buscar Fotos por IA"**
4. Procurar requisição `bulk-operations`
5. Ver resposta:
```json
{
  "success": true,
  "message": "Imagens atualizadas com sucesso",
  "updated": 0,
  "skipped": 5
}
```

### Opção 3: Consultar banco de dados

```sql
-- Ver produtos das categorias selecionadas
SELECT 
  p.id,
  p.name,
  p.image_url,
  c.name as category_name,
  p.company_id
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.company_id = 1  -- Seu company_id
  AND p.category_id IN (1, 2, 3)  -- IDs das categorias selecionadas
ORDER BY p.id;

-- Verificar se há produtos sem fotos
SELECT COUNT(*) as sem_foto
FROM products
WHERE company_id = 1
  AND (image_url IS NULL OR image_url = '');

-- Ver últimas atividades do log
SELECT * FROM activity_log 
WHERE action = 'UPDATE' 
  AND entity_type = 'products'
ORDER BY created_at DESC
LIMIT 10;
```

## Checklist de Diagnóstico

Execute na ordem:

- [ ] **1. Verificar se há produtos cadastrados**
  ```sql
  SELECT COUNT(*) FROM products WHERE company_id = 1;
  ```
  - Se retornar 0 → Cadastrar produtos primeiro

- [ ] **2. Verificar se categorias foram selecionadas**
  - Ir em Produtos
  - Selecionar checkboxes das categorias
  - Verificar se botão "🤖 Buscar Fotos por IA" está habilitado

- [ ] **3. Verificar se produtos pertencem às categorias**
  ```sql
  SELECT p.*, c.name as category 
  FROM products p 
  JOIN categories c ON p.category_id = c.id
  WHERE p.company_id = 1;
  ```

- [ ] **4. Verificar resposta da API no Network**
  - F12 → Network
  - Clicar no botão
  - Ver resposta: `updated` e `skipped`

- [ ] **5. Verificar logs do PHP**
  ```powershell
  Get-Content C:\xampp\apache\logs\error.log -Tail 100
  ```

- [ ] **6. Testar API Pixabay manualmente**
  ```
  https://pixabay.com/api/?key=46737899-b38ce8e1a26a3f4110dae3156&q=arroz&image_type=photo
  ```
  - Abrir no navegador
  - Deve retornar JSON com imagens

- [ ] **7. Verificar chave de API do Pixabay**
  ```sql
  SELECT * FROM company_settings 
  WHERE setting_key = 'pixabay_api_key' 
    AND company_id = 1;
  ```
  - Se vazio → Está usando chave padrão
  - Se preenchido → Verificar se chave é válida

## Soluções Possíveis

### Se `updated=0, skipped=X`:
**Problema:** API Pixabay não encontra imagens para os produtos

**Soluções:**
1. Renomear produtos para nomes mais genéricos
   - ❌ "REF.123 ARROZ INTEGRAL 1KG PACOTE"
   - ✅ "Arroz Integral"

2. Usar API diferente (Unsplash, Google Custom Search)

3. Fazer upload manual das fotos

### Se produtos não aparecem:
**Problema:** Nenhum produto nas categorias selecionadas

**Soluções:**
1. Verificar se produtos estão cadastrados:
```sql
SELECT * FROM products WHERE company_id = 1;
```

2. Verificar se categorias estão corretas:
```sql
SELECT p.id, p.name, p.category_id, c.name as category
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.company_id = 1;
```

3. Cadastrar produtos se necessário

### Se API retorna erro 429:
**Problema:** Limite de 5.000 req/hora excedido

**Soluções:**
1. Configurar chave própria do Pixabay:
   - Ir em Configurações
   - Campo "Pixabay API Key"
   - Obter em https://pixabay.com/api/docs/
   - Colar e salvar

2. Aguardar 1 hora

3. Usar outra API de imagens

## Exemplo de Log Esperado (Sucesso)

```
=== UPDATE IMAGES DEBUG ===
Company ID: 1
Category IDs: [1,2,3]
Placeholders: ?,?,?
SQL Query: SELECT id, name, image_url FROM products WHERE company_id = 1 AND category_id IN (?,?,?)
Total products found: 5

Processing product: ARROZ INTEGRAL (ID: 1)
Current image URL: NULL
=== SEARCH IMAGE FOR: ARROZ INTEGRAL ===
Cleaned name: ARROZ INTEGRAL
API Key: 46737899-b...
Pixabay URL: https://pixabay.com/api/?key=...&q=ARROZ+INTEGRAL&image_type=photo&per_page=3&safesearch=true
HTTP Code: 200
Response: {"total":150,"totalHits":150,"hits":[{"id":12345,...
✓ Found image: https://pixabay.com/get/abc123.jpg
✓ Updated product #1

Processing product: FEIJÃO PRETO (ID: 2)
Current image URL: NULL
=== SEARCH IMAGE FOR: FEIJÃO PRETO ===
Cleaned name: FEIJÃO PRETO
API Key: 46737899-b...
Pixabay URL: https://pixabay.com/api/?key=...&q=FEIJ%C3%83O+PRETO&image_type=photo&per_page=3&safesearch=true
HTTP Code: 200
Response: {"total":85,"totalHits":85,"hits":[{"id":67890,...
✓ Found image: https://pixabay.com/get/def456.jpg
✓ Updated product #2

=== RESULTS: Updated=5, Skipped=0 ===
```

## Próximos Passos

1. **Testar novamente** com os logs ativados
2. **Copiar os logs** do arquivo de erro do PHP
3. **Verificar** qual das situações acima está ocorrendo
4. **Aplicar** a solução correspondente

## Comandos Úteis

```powershell
# Ver logs em tempo real (PowerShell)
Get-Content C:\xampp\apache\logs\error.log -Tail 50 -Wait

# Limpar logs antigos
Clear-Content C:\xampp\apache\logs\error.log

# Verificar produtos no banco
mysql -u root -e "SELECT COUNT(*) FROM products WHERE company_id = 1;" dona_estoqueg

# Testar API Pixabay
Invoke-WebRequest "https://pixabay.com/api/?key=46737899-b38ce8e1a26a3f4110dae3156&q=arroz" | Select-Object Content
```

---

**Status:** ✅ Logs de debug adicionados
**Build:** ✅ Compilado com sucesso
**Aguardando:** 📊 Teste + logs
