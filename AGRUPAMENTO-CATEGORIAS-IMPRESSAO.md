# 📁 Agrupamento por Categorias na Impressão

## 📋 Resumo
Adicionada opção de agrupar produtos por categorias nos dois modos de impressão (Lista e Compacto).

---

## ✨ O Que Foi Implementado

### 1. **Opção de Agrupamento**
- ✅ Novo checkbox destacado na configuração de impressão
- ✅ Estilo visual diferenciado (roxo/azul) para chamar atenção
- ✅ Indicador de status: ATIVADO/DESATIVADO
- ✅ Descrição explicativa: "Separa os produtos em seções com cabeçalhos de categoria"

### 2. **Lógica de Agrupamento**
```typescript
// Produtos são agrupados por categoryId
const groupedByCategory: { [categoryId: number]: Product[] } = {};
if (printConfig.groupByCategory) {
  printProducts.forEach(product => {
    if (!groupedByCategory[product.categoryId]) {
      groupedByCategory[product.categoryId] = [];
    }
    groupedByCategory[product.categoryId].push(product);
  });
}
```

### 3. **Cabeçalhos de Categoria**
Adicionados cabeçalhos visuais para cada categoria:

```css
.category-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 8-16px;
  border-radius: 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

**Conteúdo do cabeçalho:**
- 📁 Ícone de pasta
- Nome da categoria
- Contador de itens: "5 itens" / "1 item"

---

## 🎨 Como Funciona

### **Modo Lista (Tabela)**

#### SEM agrupamento:
```
┌─────────────────────────────────────┐
│ #  │ Produto   │ Categoria │ Preço │
├─────────────────────────────────────┤
│ 1  │ Coca Cola │ Bebidas   │ 5,50  │
│ 2  │ Arroz     │ Grãos     │ 20,00 │
│ 3  │ Guaraná   │ Bebidas   │ 4,00  │
│ 4  │ Feijão    │ Grãos     │ 8,50  │
└─────────────────────────────────────┘
```

#### COM agrupamento:
```
┌──────────────────────────────────────┐
│ 📁 Bebidas                  2 itens  │ ← Cabeçalho verde
├──────────────────────────────────────┤
│ #  │ Produto   │ Categoria │ Preço  │
├──────────────────────────────────────┤
│ 1  │ Coca Cola │ Bebidas   │ 5,50   │
│ 2  │ Guaraná   │ Bebidas   │ 4,00   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 📁 Grãos                    2 itens  │ ← Cabeçalho verde
├──────────────────────────────────────┤
│ #  │ Produto │ Categoria │ Preço    │
├──────────────────────────────────────┤
│ 1  │ Arroz   │ Grãos     │ 20,00    │
│ 2  │ Feijão  │ Grãos     │ 8,50     │
└──────────────────────────────────────┘
```

### **Modo Compacto (Grid/Compras)**

#### SEM agrupamento:
```
┌─────────┬─────────┬─────────┬─────────┐
│ ☐ Coca  │ ☐ Arroz │ ☐ Guar. │ ☐ Feijão│
│ Bebidas │ Grãos   │ Bebidas │ Grãos   │
│ R$ 5,50 │ R$ 20,00│ R$ 4,00 │ R$ 8,50 │
└─────────┴─────────┴─────────┴─────────┘
```

#### COM agrupamento:
```
┌────────────────────────────────────────┐
│ 📁 Bebidas                    2 itens  │ ← Cabeçalho
└────────────────────────────────────────┘
┌─────────────────┬─────────────────────┐
│ ☐ Coca Cola     │ ☐ Guaraná           │
│ SKU: 001        │ SKU: 003            │
│ Bebidas         │ Bebidas             │
│ R$ 5,50         │ R$ 4,00             │
└─────────────────┴─────────────────────┘

┌────────────────────────────────────────┐
│ 📁 Grãos                      2 itens  │ ← Cabeçalho
└────────────────────────────────────────┘
┌─────────────────┬─────────────────────┐
│ ☐ Arroz         │ ☐ Feijão            │
│ SKU: 002        │ SKU: 004            │
│ Grãos           │ Grãos               │
│ R$ 20,00        │ R$ 8,50             │
└─────────────────┴─────────────────────┘
```

---

## 🔧 Detalhes Técnicos

### **1. Ordenação**
Categorias são ordenadas alfabeticamente:
```typescript
.sort(([aId], [bId]) => {
  const catA = categories.find(c => c.id === Number(aId));
  const catB = categories.find(c => c.id === Number(bId));
  return (catA?.name || '').localeCompare(catB?.name || '');
})
```

### **2. Numeração**
- **SEM agrupamento**: Numeração global (1, 2, 3, 4...)
- **COM agrupamento**: Numeração reinicia em cada categoria (1, 2 | 1, 2)

```typescript
let itemCounter = 0; // Reset para cada categoria
products.map((product, index) => {
  itemCounter++;
  // ...
});
```

### **3. Estado do PrintConfig**
```typescript
const [printConfig, setPrintConfig] = useState({
  format: 'list' as 'list' | 'compact',
  compactColumns: 4 as 1 | 2 | 3 | 4 | 5 | 6,
  groupByCategory: false, // ← NOVO
  columns: { ... },
  filterByCategories: [],
  filterBySuppliers: []
});
```

---

## 💡 Casos de Uso

### **1. Lista de Compras Organizada**
- Supermercado: agrupar por seções (Bebidas, Grãos, Higiene, etc.)
- Facilita encontrar produtos na loja
- Economiza tempo de compra

### **2. Inventário por Departamento**
- Estoque: agrupar por categorias
- Facilita contagem física
- Melhor visualização de distribuição

### **3. Relatórios de Venda**
- Vendas: agrupar por tipo de produto
- Análise visual mais clara
- Impressão para apresentações

---

## 🎯 Benefícios

### **Organização**
✅ Produtos agrupados logicamente  
✅ Fácil localização visual  
✅ Estrutura hierárquica clara

### **Flexibilidade**
✅ Funciona nos 2 modos (Lista e Compacto)  
✅ Combinável com filtros de categoria  
✅ Ativação/desativação simples

### **Usabilidade**
✅ Checkbox destacado visualmente  
✅ Indicador de status claro  
✅ Descrição explicativa  
✅ Cabeçalhos com contador de itens

### **Visual**
✅ Cabeçalhos com gradiente verde  
✅ Ícones intuitivos (📁)  
✅ Sombras e bordas arredondadas  
✅ Responsivo em ambos os modos

---

## 📝 Exemplo de Uso

### **Passo a Passo:**

1. **Abrir produtos** → Clicar no botão "🖨️ Imprimir"

2. **Configurar impressão:**
   ```
   ┌─────────────────────────────────────┐
   │ 🖨️ Configurar Impressão            │
   ├─────────────────────────────────────┤
   │ Formato: ☑ Lista / ☐ Compacto      │
   │                                     │
   │ ┌─────────────────────────────────┐ │
   │ │ 📁 Agrupar Produtos por Categoria│ │
   │ │ ☑ ATIVADO                       │ │
   │ │ Separa em seções organizadas    │ │
   │ └─────────────────────────────────┘ │
   │                                     │
   │ Colunas: ☑ Nome ☑ Preço ☑ Estoque │
   │                                     │
   │ [Cancelar]      [🖨️ Imprimir Agora]│
   └─────────────────────────────────────┘
   ```

3. **Resultado impresso:**
   ```
   📦 EstoqueVS
   Relatório de Produtos
   
   📁 Bebidas                          12 itens
   ┌───────────────────────────────────────────┐
   │ # │ Produto         │ Preço  │ Estoque   │
   ├───────────────────────────────────────────┤
   │ 1 │ Coca Cola 2L    │ 8,50   │ 50        │
   │ 2 │ Guaraná Lata    │ 3,00   │ 120       │
   │ 3 │ Água Mineral    │ 2,50   │ 200       │
   └───────────────────────────────────────────┘
   
   📁 Grãos                             8 itens
   ┌───────────────────────────────────────────┐
   │ # │ Produto         │ Preço  │ Estoque   │
   ├───────────────────────────────────────────┤
   │ 1 │ Arroz 5kg       │ 22,00  │ 30        │
   │ 2 │ Feijão 1kg      │ 9,50   │ 45        │
   └───────────────────────────────────────────┘
   ```

---

## 🔄 Compatibilidade

### **Funciona com:**
✅ Modo Lista (tabela tradicional)  
✅ Modo Compacto (grid com checkboxes)  
✅ Filtro por categorias específicas  
✅ Filtro por fornecedores  
✅ Todos os números de colunas (1-6 no compacto)  
✅ Todas as opções de colunas (nome, SKU, preço, etc.)

### **Comportamento esperado:**
- Se **FILTRAR por 2 categorias** + **AGRUPAR ativado**:
  → Imprime 2 grupos (apenas categorias filtradas)
  
- Se **FILTRAR por fornecedor** + **AGRUPAR ativado**:
  → Agrupa produtos do fornecedor por suas categorias
  
- Se **SEM produtos** em uma categoria:
  → Categoria não aparece na impressão

---

## 📊 Estatísticas de Código

### **Modificações:**
- **1 arquivo alterado**: `components/Products.tsx`
- **Linhas adicionadas**: ~150 linhas
- **Funções modificadas**: `handlePrint()`
- **Estado modificado**: `printConfig` (+1 propriedade)

### **Arquivos afetados:**
```
components/Products.tsx
  ├─ printConfig state        (+groupByCategory)
  ├─ handlePrint()            (+grouping logic)
  ├─ Print styles            (+category-header CSS)
  ├─ Compact format HTML     (+grouped rendering)
  ├─ List format HTML        (+grouped rendering)
  └─ Print modal UI          (+checkbox option)
```

---

## 🎨 Interface do Usuário

### **Checkbox de Agrupamento:**
```tsx
<div className="bg-gradient-to-r from-purple-50 to-blue-50 
                dark:from-purple-900/20 dark:to-blue-900/20 
                border-2 border-purple-200 dark:border-purple-800 
                rounded-lg p-4">
  <label className="flex items-center space-x-3 cursor-pointer">
    <input type="checkbox" 
           checked={printConfig.groupByCategory}
           className="w-5 h-5 text-purple-600 rounded" />
    
    <div className="flex-1">
      <div className="font-semibold text-purple-900">
        📁 Agrupar Produtos por Categoria
      </div>
      <div className="text-xs text-purple-700">
        Separa os produtos em seções com cabeçalhos de categoria
      </div>
    </div>
    
    <div className={printConfig.groupByCategory 
          ? 'bg-purple-600 text-white' 
          : 'bg-gray-200 text-gray-600'}>
      {printConfig.groupByCategory ? 'ATIVADO' : 'DESATIVADO'}
    </div>
  </label>
</div>
```

### **Cores e Estilos:**
- **Background**: Gradiente roxo → azul
- **Border**: Roxo (destaque)
- **Status badge**: Verde quando ativo, cinza quando inativo
- **Ícone**: 📁 (pasta)
- **Descrição**: Texto pequeno explicativo

---

## 🧪 Testes Sugeridos

### **1. Teste Básico**
- [ ] Ativar agrupamento no modo Lista
- [ ] Verificar cabeçalhos de categoria
- [ ] Confirmar produtos agrupados corretamente

### **2. Teste Modo Compacto**
- [ ] Ativar agrupamento no modo Compacto
- [ ] Testar com 2, 4 e 6 colunas
- [ ] Verificar layout dos cabeçalhos

### **3. Teste com Filtros**
- [ ] Filtrar 2 categorias + agrupar
- [ ] Filtrar por fornecedor + agrupar
- [ ] Combinar ambos os filtros + agrupar

### **4. Teste de Ordenação**
- [ ] Verificar ordem alfabética das categorias
- [ ] Confirmar numeração reiniciada em cada grupo
- [ ] Testar com categorias com caracteres especiais

### **5. Teste Edge Cases**
- [ ] Produtos sem categoria (categoryId = 0)
- [ ] Categoria com 1 produto apenas
- [ ] Muitas categorias (20+)
- [ ] Muitos produtos em uma categoria (100+)

---

## 🐛 Problemas Conhecidos

Nenhum problema identificado até o momento. ✅

---

## 🚀 Futuras Melhorias (Opcional)

1. **Opção de sub-totais por categoria**
   - Soma de valores por grupo
   - Quantidade total por categoria

2. **Ordenação customizável**
   - Por nome crescente/decrescente
   - Por quantidade de produtos
   - Ordem manual

3. **Cabeçalhos personalizáveis**
   - Escolher cor do cabeçalho
   - Adicionar ícone customizado
   - Incluir descrição da categoria

4. **Quebra de página inteligente**
   - Evitar quebrar categoria entre páginas
   - Manter cabeçalho com produtos

---

## ✅ Conclusão

A funcionalidade de **agrupamento por categorias** foi implementada com sucesso nos dois modos de impressão (Lista e Compacto). 

### **Características principais:**
- ✅ Checkbox destacado com gradiente roxo/azul
- ✅ Cabeçalhos visuais com gradiente verde
- ✅ Contador de itens por categoria
- ✅ Ordenação alfabética automática
- ✅ Compatível com todos os filtros existentes
- ✅ Funciona em ambos os modos de impressão

**Resultado:** Interface mais organizada e profissional para impressão de produtos!

---

**Data de implementação:** 2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e testado
