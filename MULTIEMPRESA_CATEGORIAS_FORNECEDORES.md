# Visualização Multi-Empresa - Categorias e Fornecedores

## Resumo da Implementação

Estendida a funcionalidade de visualização multi-empresa para as telas de **Categorias** e **Fornecedores**, permitindo que o Super Admin visualize dados de todas as empresas com filtros e colunas identificadoras.

---

## Funcionalidades Implementadas

### 1. **Categorias**
- ✅ Super Admin vê categorias de todas as empresas
- ✅ Coluna "Empresa" exibida apenas para Super Admin (badge roxo)
- ✅ Filtro dropdown para selecionar empresa específica
- ✅ Contador de categorias por empresa no dropdown
- ✅ Outros usuários continuam vendo apenas suas próprias categorias

### 2. **Fornecedores**
- ✅ Super Admin vê fornecedores de todas as empresas
- ✅ Coluna "Empresa" exibida apenas para Super Admin (badge roxo)
- ✅ Filtro dropdown para selecionar empresa específica
- ✅ Contador de fornecedores por empresa no dropdown
- ✅ Outros usuários continuam vendo apenas seus próprios fornecedores

---

## Modificações Técnicas

### Backend - `api.php`

#### 1. `handleCategories()` - Método GET (linha ~620)

**Antes:**
```php
if ($currentUser['role'] === 'Super Admin') {
    $result = $conn->query("SELECT * FROM categories ORDER BY id DESC");
} else {
    $stmt = $conn->prepare("SELECT * FROM categories WHERE company_id = ? ORDER BY id DESC");
}
```

**Depois:**
```php
if ($currentUser['role'] === 'Super Admin') {
    $result = $conn->query("
        SELECT cat.*, c.name as company_name 
        FROM categories cat
        LEFT JOIN companies c ON cat.company_id = c.id
        ORDER BY cat.id DESC
    ");
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $category = formatCategory($row);
        $category['companyName'] = $row['company_name'];
        $categories[] = $category;
    }
    echo json_encode($categories);
} else {
    $stmt = $conn->prepare("SELECT * FROM categories WHERE company_id = ? ORDER BY id DESC");
    // ... resto do código
}
```

**Mudanças:**
- Adicionado `LEFT JOIN` com tabela `companies`
- Retorna `company_name` para cada categoria
- Super Admin recebe campo `companyName` na resposta JSON

---

#### 2. `handleSuppliers()` - Método GET (linha ~750)

**Antes:**
```php
if ($currentUser['role'] === 'Super Admin') {
    $result = $conn->query("SELECT * FROM suppliers ORDER BY id DESC");
} else {
    $stmt = $conn->prepare("SELECT * FROM suppliers WHERE company_id = ? ORDER BY id DESC");
}
```

**Depois:**
```php
if ($currentUser['role'] === 'Super Admin') {
    $result = $conn->query("
        SELECT s.*, c.name as company_name 
        FROM suppliers s
        LEFT JOIN companies c ON s.company_id = c.id
        ORDER BY s.id DESC
    ");
    
    $suppliers = [];
    while ($row = $result->fetch_assoc()) {
        $supplier = formatSupplier($row);
        $supplier['companyName'] = $row['company_name'];
        $suppliers[] = $supplier;
    }
    echo json_encode($suppliers);
} else {
    $stmt = $conn->prepare("SELECT * FROM suppliers WHERE company_id = ? ORDER BY id DESC");
    // ... resto do código
}
```

**Mudanças:**
- Adicionado `LEFT JOIN` com tabela `companies`
- Retorna `company_name` para cada fornecedor
- Super Admin recebe campo `companyName` na resposta JSON

---

### TypeScript - `types.ts`

#### Interfaces Atualizadas

```typescript
export interface Category {
  id: number;
  name: string;
  description?: string;
  companyId?: number;
  companyName?: string; // ✅ NOVO - Added for Super Admin view
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  companyId?: number;
  companyName?: string; // ✅ NOVO - Added for Super Admin view
}
```

**Campos Adicionados:**
- `companyName?: string` - Nome da empresa (opcional, apenas para Super Admin)

---

### Frontend - `components/Categories.tsx`

#### State Adicionado

```typescript
const [companies, setCompanies] = useState<Company[]>([]);
const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
const isSuperAdmin = currentUser.role === Role.SuperAdmin;
```

#### useEffect Modificado

```typescript
useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    const categoriesData = await api.getCategories();
    const productsData = await api.getProducts();
    setCategories(categoriesData);
    setProducts(productsData);
    
    if (isSuperAdmin) {
      const companiesData = await api.getCompanies();
      setCompanies(companiesData);
    }
    
    setIsLoading(false);
  };
  fetchData();
}, [isSuperAdmin]);
```

#### Filtro Dropdown Adicionado

```tsx
{isSuperAdmin && companies.length > 0 && (
  <div className="mb-4 flex items-center gap-2">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Filtrar por empresa:
    </label>
    <select
      value={selectedCompanyId}
      onChange={(e) => setSelectedCompanyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      <option value="all">Todas as empresas ({categories.length})</option>
      {companies.map(company => {
        const count = categories.filter(cat => cat.companyId === company.id).length;
        return (
          <option key={company.id} value={company.id}>
            {company.name} ({count})
          </option>
        );
      })}
    </select>
  </div>
)}
```

#### Badge de Empresa Adicionado

```tsx
{categories
  .filter(category => {
    if (!isSuperAdmin || selectedCompanyId === 'all') return true;
    return category.companyId === selectedCompanyId;
  })
  .map(category => (
    <li key={category.id}>
      <div className="flex items-center space-x-4">
        <span>{category.name}</span>
        {isSuperAdmin && category.companyName && (
          <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200">
            {category.companyName}
          </span>
        )}
      </div>
    </li>
  ))
}
```

---

### Frontend - `components/Suppliers.tsx`

#### State Adicionado

```typescript
const [companies, setCompanies] = useState<Company[]>([]);
const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
const isSuperAdmin = currentUser.role === Role.SuperAdmin;
```

#### useEffect Modificado

```typescript
useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    const suppliersData = await api.getSuppliers();
    const productsData = await api.getProducts();
    setSuppliers(suppliersData);
    setProducts(productsData);
    
    if (isSuperAdmin) {
      const companiesData = await api.getCompanies();
      setCompanies(companiesData);
    }
    
    setIsLoading(false);
  };
  fetchData();
}, [isSuperAdmin]);
```

#### Filtro Dropdown Adicionado

```tsx
{isSuperAdmin && companies.length > 0 && (
  <div className="mb-4 flex items-center gap-2">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Filtrar por empresa:
    </label>
    <select
      value={selectedCompanyId}
      onChange={(e) => setSelectedCompanyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      <option value="all">Todas as empresas ({suppliers.length})</option>
      {companies.map(company => {
        const count = suppliers.filter(sup => sup.companyId === company.id).length;
        return (
          <option key={company.id} value={company.id}>
            {company.name} ({count})
          </option>
        );
      })}
    </select>
  </div>
)}
```

#### Coluna de Empresa Adicionada na Tabela

```tsx
<thead>
  <tr>
    <th>Nome</th>
    {isSuperAdmin && <th>Empresa</th>}
    <th>Contato</th>
    <th>Email</th>
    <th>Telefone</th>
    <th>Produtos</th>
    <th>Ações</th>
  </tr>
</thead>
<tbody>
  {suppliers
    .filter(supplier => {
      if (!isSuperAdmin || selectedCompanyId === 'all') return true;
      return supplier.companyId === selectedCompanyId;
    })
    .map(supplier => (
      <tr key={supplier.id}>
        <td>{supplier.name}</td>
        {isSuperAdmin && (
          <td>
            {supplier.companyName && (
              <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200">
                {supplier.companyName}
              </span>
            )}
          </td>
        )}
        {/* ... outras colunas */}
      </tr>
    ))
  }
</tbody>
```

---

## Design Visual

### Badges de Empresa

**Categorias e Fornecedores:**
- Cor: **Roxo** (`text-purple-800 bg-purple-100`)
- Dark mode: `text-purple-200 bg-purple-900`
- Formato: Badge arredondado com padding pequeno
- Exibição: Apenas para Super Admin

**Consistência com outras telas:**
- Produtos: Badge roxo para empresa
- Movimentações: Badge azul para empresa

---

## Comportamento do Sistema

### Para Super Admin:
1. **Categorias:**
   - Vê lista completa de categorias de todas as empresas
   - Dropdown mostra: "Todas as empresas (X)" + lista de empresas com contador
   - Badge roxo exibe nome da empresa ao lado de cada categoria
   - Pode filtrar por empresa específica

2. **Fornecedores:**
   - Vê lista completa de fornecedores de todas as empresas
   - Dropdown mostra: "Todas as empresas (X)" + lista de empresas com contador
   - Coluna "Empresa" com badge roxo na tabela
   - Pode filtrar por empresa específica

### Para Outros Usuários (Admin, Manager, Employee):
- Visualizam apenas categorias/fornecedores da própria empresa
- Não veem coluna de empresa
- Não veem filtro de empresa
- Comportamento inalterado

---

## Deployment

### Arquivos Modificados:

1. **Backend:**
   - `public_html/api.php` - Funções `handleCategories()` e `handleSuppliers()`

2. **Frontend:**
   - `types.ts` - Interfaces `Category` e `Supplier`
   - `components/Categories.tsx` - Lógica de filtro e exibição multi-empresa
   - `components/Suppliers.tsx` - Lógica de filtro e exibição multi-empresa

3. **Build:**
   - `public_html/index.html`
   - `public_html/assets/index-C5f_85We.js` (981.67 kB)

### Comandos de Deploy:

```bash
# 1. Upload do backend
scp d:/Estoque\ Gemini/public_html/api.php root@ns5023255:/home/donasala/public_html/estoque/

# 2. Upload do frontend (build)
scp d:/Estoque\ Gemini/public_html/index.html root@ns5023255:/home/donasala/public_html/estoque/
scp d:/Estoque\ Gemini/public_html/assets/* root@ns5023255:/home/donasala/public_html/estoque/assets/
```

---

## Testes Recomendados

### Teste 1: Super Admin - Categorias
- [ ] Login como Super Admin
- [ ] Acessar tela de Categorias
- [ ] Verificar se todas as categorias aparecem
- [ ] Verificar se badge roxo com nome da empresa é exibido
- [ ] Verificar se dropdown de filtro está presente
- [ ] Selecionar empresa específica no filtro
- [ ] Verificar se lista filtra corretamente
- [ ] Verificar contador no dropdown

### Teste 2: Super Admin - Fornecedores
- [ ] Login como Super Admin
- [ ] Acessar tela de Fornecedores
- [ ] Verificar se todos os fornecedores aparecem
- [ ] Verificar se coluna "Empresa" está presente
- [ ] Verificar se badge roxo com nome da empresa é exibido
- [ ] Verificar se dropdown de filtro está presente
- [ ] Selecionar empresa específica no filtro
- [ ] Verificar se lista filtra corretamente
- [ ] Verificar contador no dropdown

### Teste 3: Admin/Manager/Employee - Categorias
- [ ] Login como Admin/Manager/Employee
- [ ] Acessar tela de Categorias
- [ ] Verificar que APENAS categorias da própria empresa aparecem
- [ ] Verificar que badge de empresa NÃO aparece
- [ ] Verificar que filtro de empresa NÃO aparece

### Teste 4: Admin/Manager/Employee - Fornecedores
- [ ] Login como Admin/Manager/Employee
- [ ] Acessar tela de Fornecedores
- [ ] Verificar que APENAS fornecedores da própria empresa aparecem
- [ ] Verificar que coluna "Empresa" NÃO aparece
- [ ] Verificar que filtro de empresa NÃO aparece

### Teste 5: Performance
- [ ] Verificar tempo de carregamento com múltiplas empresas
- [ ] Testar filtro com grande volume de dados
- [ ] Verificar responsividade do dropdown

---

## Rollback

Se necessário reverter as mudanças:

### 1. Restaurar `api.php` (backup anterior)
```bash
cp ~/backup/api.php /home/donasala/public_html/estoque/api.php
```

### 2. Restaurar build anterior
```bash
cp ~/backup/index.html /home/donasala/public_html/estoque/
cp ~/backup/assets/* /home/donasala/public_html/estoque/assets/
```

---

## Queries SQL para Verificação

### Verificar categorias por empresa:
```sql
SELECT 
  c.id,
  c.name as company_name,
  COUNT(cat.id) as total_categories
FROM companies c
LEFT JOIN categories cat ON c.id = cat.company_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### Verificar fornecedores por empresa:
```sql
SELECT 
  c.id,
  c.name as company_name,
  COUNT(s.id) as total_suppliers
FROM companies c
LEFT JOIN suppliers s ON c.id = s.company_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### Verificar dados que Super Admin veria (Categorias):
```sql
SELECT 
  cat.*,
  c.name as company_name 
FROM categories cat
LEFT JOIN companies c ON cat.company_id = c.id
ORDER BY cat.id DESC;
```

### Verificar dados que Super Admin veria (Fornecedores):
```sql
SELECT 
  s.*,
  c.name as company_name 
FROM suppliers s
LEFT JOIN companies c ON s.company_id = c.id
ORDER BY s.id DESC;
```

---

## Integração com Funcionalidades Anteriores

Esta implementação complementa as funcionalidades já existentes:

1. ✅ **Produtos** - Multi-empresa com filtro (implementado anteriormente)
2. ✅ **Movimentações de Estoque** - Multi-empresa com filtro (implementado anteriormente)
3. ✅ **Categorias** - Multi-empresa com filtro (NOVA)
4. ✅ **Fornecedores** - Multi-empresa com filtro (NOVA)
5. ✅ **Empresas** - Ativação/desativação (implementado anteriormente)

**Status do Sistema Multi-Tenant:**
- Super Admin tem visão completa de todas as empresas
- Isolamento de dados mantido para usuários regulares
- Filtros e badges consistentes em todas as telas
- Sistema pronto para produção

---

## Observações Importantes

1. **Isolamento de Dados:** Usuários não-Super Admin continuam vendo apenas dados da própria empresa
2. **Performance:** Queries otimizadas com `LEFT JOIN` apenas quando necessário
3. **UX Consistente:** Badges roxos para empresa em todas as telas (Categorias, Fornecedores, Produtos)
4. **Filtros Dinâmicos:** Contadores atualizados em tempo real baseados nos dados carregados
5. **Sem Migração SQL:** Não há necessidade de alterar banco de dados, apenas código backend/frontend
6. **Dark Mode:** Todos os badges e filtros suportam tema escuro

---

## Próximos Passos (Sugestões)

- [ ] Adicionar exportação CSV com filtro de empresa
- [ ] Implementar relatórios consolidados multi-empresa
- [ ] Adicionar gráficos comparativos entre empresas
- [ ] Implementar permissões granulares por empresa
- [ ] Adicionar histórico de atividades cross-company

---

**Build Gerado:** `index-C5f_85We.js` (981.67 kB)  
**Data de Implementação:** 20 de Novembro de 2025  
**Status:** ✅ COMPLETO - Pronto para Deploy
