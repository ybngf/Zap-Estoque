# 🖼️ Geração Automática de Imagens de Produtos

## 🎯 Funcionalidade Implementada

Agora, ao processar uma nota fiscal com IA, o sistema **automaticamente sugere imagens apropriadas** para cada produto detectado!

---

## ✨ Como Funciona

### 1. **IA Analisa o Produto**

Quando você faz upload de uma nota fiscal, a IA Gemini:
- 📝 Detecta o nome do produto
- 🔢 Extrai quantidade e preço
- 🖼️ **NOVO**: Gera uma URL de imagem apropriada

### 2. **Geração Inteligente de URL**

A IA traduz o produto para inglês e cria uma URL do Unsplash:

**Exemplos**:
```
Arroz → https://source.unsplash.com/400x400/?rice,grain
Leite → https://source.unsplash.com/400x400/?milk,dairy
Maçã → https://source.unsplash.com/400x400/?apple,fruit
Sabão em Pó → https://source.unsplash.com/400x400/?detergent,powder
Cerveja → https://source.unsplash.com/400x400/?beer,beverage
Carne Bovina → https://source.unsplash.com/400x400/?beef,meat
```

### 3. **Preview Imediato**

Na tela de **Processar Nota**, você verá:
- ✅ Miniatura da imagem ao lado de cada produto
- ✅ Nome, quantidade e preço
- ✅ Total calculado

### 4. **Edição Flexível**

Você pode editar qualquer item antes de confirmar:
- ✏️ Clique no ícone de **lápis** para editar
- 🖼️ Campo **"URL da imagem"** permite alterar ou adicionar URL
- ✅ Clique em **Salvar** para confirmar
- 🗑️ Ou clique em **Excluir** para remover o item

---

## 🚀 Como Usar

### Passo 1: Processar Nota Fiscal

1. Acesse **Processar Nota** no menu
2. Faça upload de uma foto da nota fiscal
3. Clique em **"Analisar Nota Fiscal"**
4. Aguarde a IA processar (5-15 segundos)

### Passo 2: Revisar Itens Detectados

Cada item mostrará:
```
┌─────────────────────────────────────┐
│ [Imagem] Arroz Integral 1kg         │
│         Quantidade: 5 un.           │
│         Preço: R$ 12.50             │
│         Total: R$ 62.50             │
│                         [✏️] [🗑️]   │
└─────────────────────────────────────┘
```

### Passo 3: Editar (Opcional)

Se a imagem não for adequada:

1. Clique no ícone **✏️ (lápis)**
2. No campo **"URL da imagem"**, cole uma nova URL
3. Clique em **✅ Salvar**

**Sugestões de fontes de imagens**:
- Unsplash: `https://source.unsplash.com/400x400/?keyword1,keyword2`
- Picsum: `https://picsum.photos/400/400`
- URL direta de qualquer imagem online

### Passo 4: Confirmar e Adicionar

1. Clique em **"Confirmar e Adicionar ao Estoque"**
2. O sistema irá:
   - ✅ Criar produtos novos com as imagens
   - ✅ Ou atualizar estoque de produtos existentes
   - ✅ Registrar movimentação de entrada

---

## 🎨 Fontes de Imagens Suportadas

### 1. **Unsplash** (Recomendado)
- URL: `https://source.unsplash.com/400x400/?keywords`
- Vantagens: Fotos profissionais e de alta qualidade
- Exemplo: `https://source.unsplash.com/400x400/?coffee,cup`

### 2. **Picsum Photos**
- URL: `https://picsum.photos/400/400`
- Vantagens: Imagens aleatórias genéricas
- Exemplo: `https://picsum.photos/400/400?random=1`

### 3. **URLs Diretas**
- Qualquer URL pública de imagem (JPG, PNG, WEBP)
- Exemplo: `https://exemplo.com/produtos/arroz.jpg`

### 4. **Deixar Vazio**
- Se não quiser imagem, deixe o campo vazio
- O produto será criado sem imagem

---

## 🔧 Detalhes Técnicos

### Modificações Realizadas

**1. services/geminiService.ts**
```typescript
// Prompt atualizado para incluir imageUrl
const prompt = `
  Extract product name, quantity, unit price, and generate image URL.
  
  For imageUrl, use format: 
  https://source.unsplash.com/400x400/?{keywords}
  
  Examples:
  - "Arroz" → https://source.unsplash.com/400x400/?rice,grain
  - "Leite" → https://source.unsplash.com/400x400/?milk,dairy
`;

// Schema atualizado
responseSchema: {
  properties: {
    items: {
      properties: {
        productName: { type: Type.STRING },
        quantity: { type: Type.NUMBER },
        unitPrice: { type: Type.NUMBER },
        imageUrl: { type: Type.STRING }, // ✅ NOVO
      }
    }
  }
}
```

**2. components/InvoiceProcessor.tsx**
```typescript
// Interface atualizada
interface ParsedItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string; // ✅ NOVO
  isEditing?: boolean;
}

// Criar produto com imagem
const newProduct = await api.createProduct({
  name: item.productName,
  // ...
  imageUrl: item.imageUrl || '', // ✅ USA URL DA IA
});

// Exibição com preview de imagem
{item.imageUrl && (
  <img 
    src={item.imageUrl} 
    alt={item.productName}
    className="w-16 h-16 rounded-lg object-cover"
  />
)}

// Campo editável para URL
<input
  type="text"
  value={item.imageUrl || ''}
  onChange={(e) => handleUpdateItem(index, 'imageUrl', e.target.value)}
  placeholder="URL da imagem (opcional)"
/>
```

---

## 📊 Antes vs Depois

### Antes
```json
{
  "productName": "Arroz Integral 1kg",
  "quantity": 5,
  "unitPrice": 12.50
}
```
**Produto criado**: ❌ Sem imagem (imageUrl: '')

### Depois
```json
{
  "productName": "Arroz Integral 1kg",
  "quantity": 5,
  "unitPrice": 12.50,
  "imageUrl": "https://source.unsplash.com/400x400/?rice,grain"
}
```
**Produto criado**: ✅ Com imagem automática

---

## 🎯 Benefícios

1. **⏱️ Economia de Tempo**
   - Não precisa buscar imagens manualmente
   - Imagens sugeridas automaticamente pela IA

2. **🎨 Visual Profissional**
   - Fotos de alta qualidade do Unsplash
   - Interface mais atraente

3. **✏️ Flexibilidade**
   - Pode editar a URL sugerida
   - Pode deixar vazio se preferir
   - Pode usar qualquer fonte de imagem

4. **🔄 Consistência**
   - Todos os produtos têm imagens
   - Melhor experiência visual no catálogo

---

## 🐛 Solução de Problemas

### Imagem não carrega

**Problema**: Imagem aparece quebrada

**Soluções**:
1. Verifique se a URL está acessível
2. Teste a URL diretamente no navegador
3. Edite o item e use outra URL
4. Deixe vazio para produto sem imagem

### Imagem não é adequada

**Problema**: IA escolheu imagem errada

**Soluções**:
1. Clique em **✏️ Editar**
2. Cole uma URL mais específica
3. Exemplo: `https://source.unsplash.com/400x400/?specific,keyword`

### Quer imagem diferente para produto existente

**Problema**: Produto já existe sem imagem

**Soluções**:
1. Vá em **Produtos**
2. Encontre o produto
3. Clique em **Editar**
4. Adicione a URL da imagem
5. Salve

---

## 📝 Exemplo Completo

### Nota Fiscal com:
```
1. Arroz Branco 5kg - 3 un. - R$ 18,90
2. Feijão Preto 1kg - 2 un. - R$ 8,50
3. Óleo de Soja 900ml - 1 un. - R$ 7,20
```

### IA Gera:
```json
{
  "items": [
    {
      "productName": "Arroz Branco 5kg",
      "quantity": 3,
      "unitPrice": 18.90,
      "imageUrl": "https://source.unsplash.com/400x400/?rice,white,grain"
    },
    {
      "productName": "Feijão Preto 1kg",
      "quantity": 2,
      "unitPrice": 8.50,
      "imageUrl": "https://source.unsplash.com/400x400/?beans,black,food"
    },
    {
      "productName": "Óleo de Soja 900ml",
      "quantity": 1,
      "unitPrice": 7.20,
      "imageUrl": "https://source.unsplash.com/400x400/?oil,cooking,bottle"
    }
  ]
}
```

### Resultado:
- ✅ 3 produtos com imagens profissionais
- ✅ Estoque atualizado corretamente
- ✅ Interface visual atraente

---

## 🎉 Conclusão

Com esta atualização, o processamento de notas fiscais ficou muito mais completo e visual! A IA agora não apenas detecta os produtos, mas também sugere imagens apropriadas automaticamente.

**Status**: ✅ Implementado e funcionando  
**Build**: 900.13 kB (7.58s)  
**Data**: 15/11/2025

---

**💡 Dica**: Para melhores resultados, use notas fiscais com boa qualidade de imagem e boa iluminação!
