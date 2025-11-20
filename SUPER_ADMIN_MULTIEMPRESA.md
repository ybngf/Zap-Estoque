# Funcionalidade Multi-Empresa para Super Admin

## Resumo das Alterações

Implementado sistema completo para que o **Super Admin** visualize e filtre dados de **todas as empresas** em Produtos e Movimentações de Estoque.

---

## Funcionalidades Implementadas

### 1. ✅ Produtos - Visualização Multi-Empresa

**Para Super Admin:**
- ✅ Lista produtos de TODAS as empresas
- ✅ Nova coluna "Empresa" com badge roxo
- ✅ Novo filtro "Empresa" nos filtros avançados
- ✅ Contador de produtos por empresa no dropdown
- ✅ Filtro integrado com busca, categoria, fornecedor e estoque

**Para outros usuários:**
- ✅ Funcionalidade mantida (vê apenas produtos da própria empresa)

### 2. ✅ Movimentações de Estoque - Visualização Multi-Empresa

**Para Super Admin:**
- ✅ Lista movimentações de TODAS as empresas
- ✅ Nova coluna "Empresa" com badge azul
- ✅ Filtro dropdown de empresas no topo da tela
- ✅ Contador de movimentações por empresa
- ✅ Ordenação por data (mais recente primeiro)

**Para outros usuários:**
- ✅ Funcionalidade mantida (vê apenas movimentações da própria empresa)

---

## Mudanças Técnicas

### Backend (api.php)

#### 1. handleProducts() - Linha ~437
```php
// Super Admin vê todos os produtos de todas as empresas
if ($currentUser['role'] === 'Super Admin') {
    $result = $conn->query("
        SELECT p.*, c.name as company_name 
        FROM products p
        LEFT JOIN companies c ON p.company_id = c.id
        ORDER BY p.id DESC
    ");
    
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $product = formatProduct($row);
        $product['companyName'] = $row['company_name'];
        $products[] = $product;
    }
    echo json_encode($products);
}
```

**Comportamento:**
- Super Admin: `SELECT p.*, c.name FROM products LEFT JOIN companies`
- Outros: `SELECT * FROM products WHERE company_id = ?`

#### 2. handleStockMovements() - Linha ~1095
```php
// Super Admin vê todas as empresas
if ($currentUser['role'] === 'Super Admin') {
    $stmt = $conn->prepare("
        SELECT 
            sm.*,
            p.name as product_name,
            p.company_id,
            c.name as company_name,
            u.name as user_name
        FROM stock_movements sm
        INNER JOIN products p ON sm.product_id = p.id
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON sm.user_id = u.id
        ORDER BY sm.date DESC
    ");
}
```

**Campos adicionados na resposta:**
- `companyName`: nome da empresa
- `companyId`: ID da empresa

---

### Frontend

#### 1. types.ts

**Product interface:**
```typescript
export interface Product {
  // ... campos existentes
  companyName?: string; // Added for Super Admin view
}
```

**StockMovement interface:**
```typescript
export interface StockMovement {
  // ... campos existentes
  companyName?: string; // Added for Super Admin view
  companyId?: number;   // Added for Super Admin view
}
```

#### 2. components/Products.tsx

**Estados adicionados:**
```typescript
const [companies, setCompanies] = useState<Company[]>([]);
const [filterCompany, setFilterCompany] = useState<number | 'all'>('all');
const isSuperAdmin = currentUser.role === Role.SuperAdmin;
```

**useEffect modificado:**
```typescript
// Carrega empresas se for Super Admin
if (isSuperAdmin) {
  const companiesData = await api.getCompanies();
  setCompanies(companiesData || []);
}
```

**Filtro adicionado:**
```typescript
const matchesCompany = !isSuperAdmin || 
                       filterCompany === 'all' || 
                       p.companyId === filterCompany;
```

**UI - Filtros Avançados:**
```tsx
{/* Filtro por Empresa (apenas para Super Admin) */}
{isSuperAdmin && (
  <div>
    <label>🏭 Empresa</label>
    <select value={filterCompany} onChange={...}>
      <option value="all">Todas as empresas ({products.length})</option>
      {companies.map(company => (
        <option value={company.id}>
          {company.name} ({count})
        </option>
      ))}
    </select>
  </div>
)}
```

**UI - Tabela:**
```tsx
<thead>
  <th>Produto</th>
  <th>SKU</th>
  <th>Categoria</th>
  {isSuperAdmin && <th>Empresa</th>}
  <th>Preço</th>
  ...
</thead>

<tbody>
  <td>{product.name}</td>
  <td>{product.sku}</td>
  <td>{category?.name}</td>
  {isSuperAdmin && (
    <td>
      <span className="badge-purple">
        {product.companyName || 'N/A'}
      </span>
    </td>
  )}
  ...
</tbody>
```

#### 3. components/StockMovements.tsx

**Estados adicionados:**
```typescript
const [companies, setCompanies] = useState<Company[]>([]);
const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
const isSuperAdmin = currentUser.role === Role.SuperAdmin;
```

**useEffect modificado:**
```typescript
// Se for Super Admin, carregar lista de empresas
if (isSuperAdmin) {
  const companiesData = await api.getCompanies();
  setCompanies(companiesData);
}
```

**Filtro adicionado:**
```typescript
const filteredMovements = isSuperAdmin && selectedCompanyId !== 'all'
  ? movements.filter(m => m.companyId === selectedCompanyId)
  : movements;
```

**UI - Filtro no topo:**
```tsx
{isSuperAdmin && (
  <div className="flex items-center gap-2">
    <label>Filtrar por empresa:</label>
    <select value={selectedCompanyId} onChange={...}>
      <option value="all">Todas as empresas ({movements.length})</option>
      {companies.map(company => {
        const count = movements.filter(m => m.companyId === company.id).length;
        return (
          <option value={company.id}>
            {company.name} ({count})
          </option>
        );
      })}
    </select>
  </div>
)}
```

**UI - Tabela:**
```tsx
<thead>
  <th>Data</th>
  <th>Produto</th>
  {isSuperAdmin && <th>Empresa</th>}
  <th>Tipo</th>
  ...
</thead>

<tbody>
  <td>{new Date(movement.date).toLocaleString()}</td>
  <td>{movement.productName}</td>
  {isSuperAdmin && (
    <td>
      <span className="badge-blue">
        {movement.companyName || 'N/A'}
      </span>
    </td>
  )}
  ...
</tbody>
```

---

## Deployment

### Passo 1: Upload api.php
```bash
# Fazer backup
cp /home/donasala/public_html/estoque/api.php ~/backup/api.php.bkp_$(date +%Y%m%d)

# Upload novo arquivo
scp d:/Estoque\ Gemini/public_html/api.php root@ns5023255:/home/donasala/public_html/estoque/
```

### Passo 2: Upload Build Frontend
```bash
# Build já gerado: public_html/assets/index-ft911UmU.js (979.63 kB)

# Upload
scp d:/Estoque\ Gemini/public_html/index.html root@ns5023255:/home/donasala/public_html/estoque/
scp d:/Estoque\ Gemini/public_html/assets/* root@ns5023255:/home/donasala/public_html/estoque/assets/
```

### Passo 3: Testar

**Teste 1 - Super Admin vê todas empresas:**
1. Login como Super Admin
2. Acessar "Produtos"
3. ✅ Verificar coluna "Empresa" visível
4. ✅ Abrir filtros avançados → Verificar dropdown "Empresa"
5. ✅ Selecionar uma empresa → Lista filtra corretamente
6. Acessar "Movimentações"
7. ✅ Verificar coluna "Empresa" visível
8. ✅ Verificar dropdown de filtro no topo
9. ✅ Selecionar empresa → Lista filtra corretamente

**Teste 2 - Admin/Manager vê apenas sua empresa:**
1. Login como Admin ou Manager
2. Acessar "Produtos"
3. ✅ Coluna "Empresa" NÃO deve aparecer
4. ✅ Filtro de empresa NÃO deve aparecer
5. ✅ Lista mostra apenas produtos da própria empresa
6. Acessar "Movimentações"
7. ✅ Coluna "Empresa" NÃO deve aparecer
8. ✅ Filtro NÃO deve aparecer
9. ✅ Lista mostra apenas movimentações da própria empresa

---

## Queries SQL Úteis

### Verificar produtos por empresa
```sql
SELECT 
  c.name as empresa,
  COUNT(p.id) as total_produtos
FROM companies c
LEFT JOIN products p ON c.id = p.company_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### Verificar movimentações por empresa
```sql
SELECT 
  c.name as empresa,
  COUNT(sm.id) as total_movimentacoes
FROM companies c
LEFT JOIN products p ON c.id = p.company_id
LEFT JOIN stock_movements sm ON p.id = sm.product_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### Ver últimas movimentações de todas as empresas
```sql
SELECT 
  sm.date,
  p.name as produto,
  c.name as empresa,
  sm.type,
  sm.quantity,
  u.name as usuario
FROM stock_movements sm
INNER JOIN products p ON sm.product_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN users u ON sm.user_id = u.id
ORDER BY sm.date DESC
LIMIT 50;
```

---

## Rollback (Se necessário)

```bash
# Restaurar api.php
cp ~/backup/api.php.bkp_YYYYMMDD /home/donasala/public_html/estoque/api.php

# Restaurar build anterior
cp -r ~/backup/build_anterior/* /home/donasala/public_html/estoque/
```

---

## Observações Importantes

1. **Performance**: Super Admin pode ter listas muito grandes se houver muitas empresas
2. **Permissões**: Apenas visualização - Super Admin NÃO pode editar produtos de outras empresas
3. **Filtros**: Filtros de empresa são independentes dos outros filtros (categoria, fornecedor, etc)
4. **Badges**: 
   - Empresa em Produtos: badge ROXO
   - Empresa em Movimentações: badge AZUL
5. **Contadores**: Dropdowns mostram quantidade de itens por empresa

---

## Arquivos Modificados

- ✅ `public_html/api.php` - handleProducts() e handleStockMovements()
- ✅ `types.ts` - interfaces Product e StockMovement
- ✅ `components/Products.tsx` - UI e filtros
- ✅ `components/StockMovements.tsx` - UI e filtros
- ✅ Build gerado: `public_html/assets/index-ft911UmU.js` (979.63 kB)

---

## Checklist de Deployment

- [ ] Backup do api.php criado
- [ ] Novo api.php enviado para servidor
- [ ] Build do frontend enviado
- [ ] Teste com Super Admin (vê todas empresas)
- [ ] Teste com Admin (vê apenas sua empresa)
- [ ] Teste filtros funcionando
- [ ] Teste contadores de produtos/movimentações
- [ ] Verificar logs de erro

---

**Implementação concluída com sucesso! 🎉**
