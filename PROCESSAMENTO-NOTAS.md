# 📸 Processamento de Notas Fiscais com IA

## 🎯 Funcionalidade

A página **Processar por Nota** permite fazer upload de uma foto de nota fiscal e usar inteligência artificial (Google Gemini) para:
1. Detectar automaticamente os itens da nota
2. Extrair quantidade e preço de cada item
3. Permitir edição antes de confirmar
4. Adicionar os produtos ao estoque automaticamente

---

## ⚙️ Configuração

### 1. Obter API Key do Google Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

Adicione a chave no arquivo `.env` na raiz do projeto:

```env
VITE_GEMINI_API_KEY=sua_chave_aqui
```

**⚠️ IMPORTANTE:** 
- A variável DEVE começar com `VITE_` para funcionar no Vite
- Não compartilhe sua API key publicamente
- Reinicie o servidor de desenvolvimento após adicionar a variável

### 3. Reiniciar Servidor

```bash
npm run dev
```

---

## 🚀 Como Usar

### Passo 1: Upload da Nota Fiscal
1. Navegue até **Processar por Nota** no menu
2. Clique na área de upload ou arraste a imagem
3. Formatos aceitos: PNG, JPG, WEBP

### Passo 2: Análise com IA
1. Clique em **"Analisar Nota Fiscal"**
2. Aguarde alguns segundos enquanto a IA processa
3. Os itens detectados aparecerão no painel direito

### Passo 3: Revisar e Editar
Cada item detectado mostra:
- ✏️ Nome do produto
- 📦 Quantidade
- 💵 Preço unitário
- 💰 Total calculado

**Você pode:**
- ✏️ **Editar**: Clique no ícone de lápis para corrigir qualquer informação
- 🗑️ **Remover**: Clique no ícone de lixeira para excluir itens incorretos
- ✅ **Salvar**: Após editar, clique em "Salvar"

### Passo 4: Confirmar e Adicionar
1. Revise o **Total da Nota** exibido
2. Clique em **"Confirmar e Adicionar ao Estoque"**
3. O sistema irá:
   - Verificar se o produto já existe pelo nome
   - Criar novos produtos se necessário
   - Criar movimentações de entrada no estoque
   - Atualizar o estoque automaticamente

### Passo 5: Feedback
- ✅ **Sucesso**: Mensagem verde mostrando quantos itens foram adicionados
- ⚠️ **Erro**: Mensagem detalhada caso algum item falhe
- Os itens são limpos automaticamente após sucesso

---

## 🔍 Comportamento do Sistema

### Produtos Existentes
Se o produto **já existe** no sistema (mesmo nome):
- ✅ Usa o produto existente
- ✅ Apenas adiciona a movimentação de entrada
- ✅ Atualiza o estoque

### Produtos Novos
Se o produto **não existe**:
- ✅ Cria um novo produto automaticamente
- ✅ SKU gerado automaticamente: `AUTO-timestamp-random`
- ✅ Categoria padrão: ID 1
- ✅ Fornecedor padrão: ID 1
- ✅ Estoque mínimo: 10 unidades
- ✅ Cria movimentação de entrada
- ✅ Adiciona ao estoque

### Movimentações de Estoque
Cada item gera uma movimentação:
- 📥 **Tipo**: Entrada
- 📊 **Quantidade**: Da nota fiscal
- 👤 **Usuário**: Usuário logado
- 📝 **Motivo**: "Entrada via nota fiscal - X un. @ R$ Y"

---

## ⚡ Dicas para Melhores Resultados

### Qualidade da Foto
- 📸 Tire fotos bem iluminadas
- 🔍 Foque nos itens da nota
- 📐 Mantenha a câmera paralela ao papel
- ✨ Evite sombras e reflexos

### Antes de Confirmar
- ✅ Sempre revise os itens detectados
- ✅ Corrija erros de OCR se necessário
- ✅ Remova itens duplicados
- ✅ Verifique se as quantidades estão corretas

### Produtos Novos
- Se muitos produtos novos forem criados, revise depois:
  - Categorias corretas
  - Fornecedores corretos
  - Estoque mínimo adequado
  - Imagens dos produtos

---

## 🐛 Solução de Problemas

### Erro: "VITE_GEMINI_API_KEY não está configurada"
**Causa**: API key não foi configurada

**Solução**:
1. Obtenha uma chave em https://makersuite.google.com/app/apikey
2. Adicione no arquivo `.env`: `VITE_GEMINI_API_KEY=sua_chave`
3. Reinicie o servidor: `npm run dev`

### Erro: "Nenhum item foi encontrado"
**Possíveis causas**:
- Foto muito escura ou borrada
- Texto ilegível
- Formato de nota não reconhecido

**Soluções**:
- Tire uma nova foto com melhor iluminação
- Aproxime mais da nota
- Tente uma nota mais legível

### Erro ao Adicionar ao Estoque
**Possíveis causas**:
- Categoria ID 1 não existe
- Fornecedor ID 1 não existe
- Conexão com banco de dados

**Soluções**:
1. Verifique se existe uma categoria com ID 1
2. Verifique se existe um fornecedor com ID 1
3. Crie categorias/fornecedores padrão se necessário

---

## 🎨 Interface

### Estados da Interface

**Upload Pendente**:
- Área de upload com ícone
- "Clique para fazer upload"

**Imagem Carregada**:
- Preview da imagem
- Botão X para limpar
- Botão "Analisar Nota Fiscal"

**Processando**:
- Spinner animado
- "Processando..."
- Botão desabilitado

**Itens Detectados**:
- Lista de itens com controles
- Total calculado
- Botão "Confirmar e Adicionar"

**Adicionando ao Estoque**:
- Spinner no botão
- "Adicionando ao estoque..."
- Botão desabilitado

**Sucesso**:
- Mensagem verde
- Campos limpos
- Pronto para nova nota

---

## 📊 Dados Técnicos

### Modelo de IA
- **Provider**: Google Gemini
- **Modelo**: gemini-2.5-flash
- **Tipo**: Multimodal (texto + imagem)
- **Formato de saída**: JSON estruturado

### Estrutura JSON Retornada
```json
{
  "items": [
    {
      "productName": "Nome do Produto",
      "quantity": 5,
      "unitPrice": 12.50
    }
  ]
}
```

### Tipos TypeScript
```typescript
interface ParsedItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  isEditing?: boolean;
}
```

---

## 🔐 Segurança

### API Key
- ✅ Armazenada em variável de ambiente
- ✅ Não exposta no código front-end compilado
- ✅ Não incluída no controle de versão (.gitignore)

### Validações
- ✅ Verifica se arquivo foi selecionado
- ✅ Valida tipos de arquivo (PNG, JPG, WEBP)
- ✅ Valida resposta da API
- ✅ Trata erros graciosamente

---

## 🚀 Melhorias Futuras

### Possíveis Implementações
1. **Seleção de Categoria**: Escolher categoria ao criar produto
2. **Seleção de Fornecedor**: Escolher fornecedor da nota
3. **OCR Local**: Usar Tesseract.js como fallback
4. **Histórico**: Salvar notas processadas
5. **Export**: Exportar dados extraídos como CSV
6. **Batch**: Processar múltiplas notas de uma vez
7. **Templates**: Configurar formatos de nota conhecidos

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique a configuração da API key
2. Consulte os logs do navegador (F12 > Console)
3. Verifique a qualidade da imagem
4. Teste com uma nota fiscal simples primeiro

---

✨ **Desenvolvido com React + TypeScript + Google Gemini AI**
