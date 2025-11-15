# Novas Funcionalidades: Fornecedor e Categoria Inteligente

## Visão Geral

Adicionadas duas novas funcionalidades ao processamento de notas fiscais:
1. **Seleção de Fornecedor** - Escolha manual do fornecedor dos produtos
2. **Categoria Inteligente** - IA sugere automaticamente a categoria de cada produto

## 1. Seleção de Fornecedor

### Funcionalidade

Antes de processar a nota fiscal, o usuário pode selecionar qual fornecedor emitiu a nota. Todos os novos produtos criados serão automaticamente associados a este fornecedor.

### Interface

```tsx
<select value={selectedSupplierId} onChange={...}>
  <option>Fornecedor A</option>
  <option>Fornecedor B</option>
  <option>Fornecedor C</option>
</select>
```

**Localização:** Logo abaixo da pré-visualização da imagem, antes do botão "Analisar Nota Fiscal"

### Comportamento

- **Valor Padrão:** Carregado de `system_settings.default_supplier_id`
- **Persistência:** O fornecedor selecionado é usado para TODOS os produtos da nota
- **Produtos Existentes:** Se o produto já existe no sistema, mantém o fornecedor original
- **Produtos Novos:** Recebem o fornecedor selecionado

### Exemplo de Uso

```
Nota Fiscal do Fornecedor: "Distribuidora ABC"
↓
Usuário seleciona: "Distribuidora ABC" no dropdown
↓
Todos os produtos novos criados: supplierId = ID da "Distribuidora ABC"
```

## 2. Categoria Inteligente (IA)

### Funcionalidade

A IA do Gemini analisa cada produto e sugere automaticamente uma categoria apropriada. O sistema tenta mapear a sugestão para uma categoria existente no banco de dados.

### Categorias Sugeridas pela IA

A IA foi treinada para sugerir uma das seguintes categorias em português:

| Categoria | Produtos Típicos |
|-----------|------------------|
| Alimentos e Bebidas | Arroz, feijão, leite, suco, café, açúcar |
| Limpeza | Sabão, detergente, desinfetante, álcool |
| Higiene Pessoal | Shampoo, sabonete, creme dental, papel higiênico |
| Papelaria | Caneta, caderno, papel A4, lápis |
| Eletrônicos | Cabos, pilhas, adaptadores, fones |
| Móveis e Decoração | Cadeiras, mesas, quadros, vasos |
| Roupas e Acessórios | Camisas, calças, bolsas, sapatos |
| Ferramentas | Martelo, chave de fenda, furadeira |
| Automotivo | Óleo, filtros, pneus, lâmpadas |
| Outros | Produtos que não se encaixam nas categorias acima |

### Mapeamento Automático

O sistema tenta mapear a categoria sugerida pela IA para uma categoria existente:

```typescript
// Busca por nome (case-insensitive, partial match)
const matchingCategory = categories.find(cat => 
  cat.name.toLowerCase().includes(suggested) || 
  suggested.includes(cat.name.toLowerCase())
);

// Exemplos de mapeamento:
"Alimentos e Bebidas" (IA) → "Alimentos" (Banco)
"Limpeza" (IA) → "Limpeza" (Banco) ✓
"Higiene Pessoal" (IA) → "Higiene" (Banco)
```

### Interface - Exibição da Categoria

Cada item extraído mostra:

```
🏷️ Categoria sugerida: Alimentos e Bebidas → Alimentos
```

- **Azul:** Categoria sugerida pela IA
- **Verde:** Categoria mapeada no sistema

### Interface - Edição da Categoria

No modo de edição de item, há um dropdown para alterar a categoria:

```tsx
<select value={item.categoryId}>
  <option value={1}>Alimentos</option>
  <option value={2}>Limpeza</option>
  <option value={3}>Eletrônicos</option>
  ...
</select>
```

### Fluxo Completo

```
1. Upload da Nota Fiscal
↓
2. IA Analisa a Imagem
   - Produto: "Arroz Branco 5kg"
   - suggestedCategory: "Alimentos e Bebidas"
↓
3. Mapeamento Automático
   - Busca categoria "Alimentos e Bebidas" no banco
   - Encontra "Alimentos" (match parcial)
   - categoryId = ID da categoria "Alimentos"
↓
4. Exibição
   - "🏷️ Categoria sugerida: Alimentos e Bebidas → Alimentos"
↓
5. Criação do Produto
   - categoryId: ID da categoria mapeada
   - supplierId: ID do fornecedor selecionado
```

## Modificações no Gemini Service

### Prompt Atualizado

```typescript
const prompt = `
  ...
  - "suggestedCategory" (string): An appropriate category name in Portuguese
    Common categories include:
      * Alimentos e Bebidas (for food and drinks)
      * Limpeza (for cleaning products)
      * Higiene Pessoal (for personal hygiene)
      * Papelaria (for stationery)
      * Eletrônicos (for electronics)
      * Móveis e Decoração (for furniture and decoration)
      * Roupas e Acessórios (for clothing and accessories)
      * Ferramentas (for tools)
      * Automotivo (for automotive)
      * Outros (for other products)
  ...
`;
```

### Schema Atualizado

```typescript
responseSchema: {
  properties: {
    items: {
      items: {
        properties: {
          productName: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
          imageUrl: { type: Type.STRING },
          suggestedCategory: { type: Type.STRING }, // ← NOVO
        },
        required: ["productName", "quantity", "unitPrice", "imageUrl", "suggestedCategory"],
      },
    },
  },
}
```

## Interface ParsedItem Atualizada

```typescript
interface ParsedItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  suggestedCategory?: string;  // ← NOVO - Sugestão da IA
  categoryId?: number;          // ← NOVO - ID mapeado
  isEditing?: boolean;
}
```

## Estados Adicionados

```typescript
const [suppliers, setSuppliers] = useState<any[]>([]);
const [categories, setCategories] = useState<any[]>([]);
const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
```

## Carregamento de Dados

```typescript
React.useEffect(() => {
  const loadSuppliersAndCategories = async () => {
    const [suppliersData, categoriesData] = await Promise.all([
      api.getSuppliers(),
      api.getCategories()
    ]);
    setSuppliers(suppliersData);
    setCategories(categoriesData);
  };
  
  loadSuppliersAndCategories();
}, []);
```

## Exemplo Completo

### Entrada: Nota Fiscal

```
DISTRIBUIDORA XYZ LTDA
=============================
Item                Qtd    Valor
Arroz Branco 5kg    10     R$ 25,00
Feijão Preto 1kg    15     R$ 8,50
Detergente Limão    20     R$ 2,30
=============================
```

### Interface do Sistema

```
┌─────────────────────────────────┐
│ Fornecedor dos Produtos         │
│ [Distribuidora XYZ ▼]           │
└─────────────────────────────────┘

[Analisar Nota Fiscal]

Itens Extraídos (3 itens)
─────────────────────────────────

📦 Arroz Branco 5kg
🏷️ Categoria: Alimentos e Bebidas → Alimentos
Quantidade: 10 un. | Preço: R$ 25,00
Total: R$ 250,00
[Editar] [Remover]

📦 Feijão Preto 1kg
🏷️ Categoria: Alimentos e Bebidas → Alimentos
Quantidade: 15 un. | Preço: R$ 8,50
Total: R$ 127,50
[Editar] [Remover]

📦 Detergente Limão
🏷️ Categoria: Limpeza → Limpeza
Quantidade: 20 un. | Preço: R$ 2,30
Total: R$ 46,00
[Editar] [Remover]

─────────────────────────────────
💰 Total da Nota: R$ 423,50
[Confirmar e Adicionar ao Estoque]
```

### Resultado no Banco de Dados

```sql
-- 3 novos produtos criados (ou existentes atualizados)
INSERT INTO products (name, categoryId, supplierId, ...) VALUES
  ('Arroz Branco 5kg', 1, 5, ...),   -- Categoria: Alimentos, Fornecedor: Distribuidora XYZ
  ('Feijão Preto 1kg', 1, 5, ...),   -- Categoria: Alimentos, Fornecedor: Distribuidora XYZ
  ('Detergente Limão', 2, 5, ...);   -- Categoria: Limpeza,   Fornecedor: Distribuidora XYZ

-- 3 movimentações de estoque
INSERT INTO stock_movements (productId, type, quantity, ...) VALUES
  (101, 'in', 10, ...),
  (102, 'in', 15, ...),
  (103, 'in', 20, ...);

-- Atualização de estoque
UPDATE products SET stock = stock + 10 WHERE id = 101;
UPDATE products SET stock = stock + 15 WHERE id = 102;
UPDATE products SET stock = stock + 20 WHERE id = 103;
```

## Benefícios

### 1. Seleção de Fornecedor
- ✅ Rastreabilidade: Saber de qual fornecedor veio cada produto
- ✅ Relatórios: Análise de compras por fornecedor
- ✅ Gestão: Negociação e relacionamento com fornecedores
- ✅ Automação: Produtos automaticamente associados ao fornecedor correto

### 2. Categoria Inteligente
- ✅ Precisão: IA analisa o produto e sugere categoria apropriada
- ✅ Economia de Tempo: Não precisa categorizar manualmente cada produto
- ✅ Consistência: Categorização padronizada pela IA
- ✅ Flexibilidade: Pode editar a categoria se a IA errar
- ✅ Organização: Produtos corretamente categorizados desde a criação

## Casos de Uso

### Caso 1: Nota Fiscal de Supermercado
```
Fornecedor: Atacadão LTDA
Produtos:
- Arroz → Alimentos e Bebidas → Alimentos ✓
- Sabão em Pó → Limpeza → Limpeza ✓
- Shampoo → Higiene Pessoal → Higiene ✓
```

### Caso 2: Nota Fiscal de Papelaria
```
Fornecedor: Papelaria Central
Produtos:
- Caneta BIC → Papelaria → Papelaria ✓
- Papel A4 → Papelaria → Papelaria ✓
- Caderno → Papelaria → Papelaria ✓
```

### Caso 3: Categoria Não Encontrada
```
IA sugere: "Produtos Eletrônicos"
Sistema não tem categoria exata
Usa: defaultCategoryId (categoria padrão)
Usuário pode editar manualmente
```

## Arquivos Modificados

### 1. components/InvoiceProcessor.tsx (+80 linhas)
- **ParsedItem interface:** Adicionado `suggestedCategory`, `categoryId`
- **Estados:** `suppliers`, `categories`, `selectedSupplierId`
- **useEffect:** Carrega fornecedores e categorias
- **handleProcessInvoice:** Mapeia categoria sugerida para ID
- **handleConfirmAndAddToStock:** Usa `selectedSupplierId` e `item.categoryId`
- **UI:** Dropdown de fornecedor, exibição de categoria, seletor de categoria na edição

### 2. services/geminiService.ts (+15 linhas)
- **Prompt:** Instruções para sugerir categoria
- **Schema:** Campo `suggestedCategory` obrigatório
- **Retorno:** Cada item inclui `suggestedCategory`

## Build

```bash
npm run build
✓ 729 modules transformed.
✓ 917.62 kB (gzip: 235.08 kB)
✓ built in 9.42s
```

## Testes Recomendados

### Teste 1: Nota com Alimentos
- Upload nota com arroz, feijão, macarrão
- Verificar categoria "Alimentos e Bebidas" sugerida
- Confirmar mapeamento correto

### Teste 2: Nota com Produtos de Limpeza
- Upload nota com detergente, sabão, álcool
- Verificar categoria "Limpeza" sugerida
- Confirmar criação com fornecedor correto

### Teste 3: Edição Manual
- Processar nota
- Editar um item
- Alterar categoria no dropdown
- Confirmar que usa categoria editada

### Teste 4: Fornecedor Correto
- Selecionar fornecedor específico
- Processar nota
- Verificar no banco: supplierId correto

## Conclusão

Sistema agora possui:
1. ✅ **Seleção de Fornecedor** - Associação automática de produtos ao fornecedor correto
2. ✅ **Categoria Inteligente** - IA sugere e mapeia categorias automaticamente
3. ✅ **Edição Flexível** - Usuário pode ajustar categoria e outros campos
4. ✅ **Rastreabilidade** - Histórico completo: fornecedor + categoria + movimentação

O processo de importação de notas fiscais está mais inteligente e completo! 🎉
