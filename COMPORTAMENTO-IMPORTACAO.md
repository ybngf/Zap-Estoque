# 🔄 Comportamento da Importação CSV - Guia Completo

## 📊 Tabela de Decisão

| Importar IDs | Substituir Existentes | ID já existe? | Comportamento |
|--------------|----------------------|---------------|---------------|
| ❌ Desativado | ❌ Desativado | N/A | ➕ **INSERT** (ID gerado automaticamente) |
| ❌ Desativado | ✅ Ativado | N/A | ➕ **INSERT** (ID gerado automaticamente) |
| ✅ Ativado | ❌ Desativado | ❌ Não existe | ➕ **INSERT** (com ID do CSV) |
| ✅ Ativado | ❌ Desativado | ✅ Existe | ⚠️ **IGNORADO** (com mensagem de aviso) |
| ✅ Ativado | ✅ Ativado | ❌ Não existe | ➕ **INSERT** (com ID do CSV) |
| ✅ Ativado | ✅ Ativado | ✅ Existe | ✏️ **UPDATE** (atualiza todos os campos) |

---

## 🎯 Cenários Práticos

### **Cenário 1: Importação Normal de Novos Registros**

**CSV:**
```csv
name,sku,categoryId,supplierId,price,stock,minStock
Produto A,PROD-A,1,1,100.00,50,10
Produto B,PROD-B,1,1,200.00,30,5
```

**Configuração:**
- ❌ Importar IDs: **DESATIVADO**
- ❌ Substituir Existentes: **DESATIVADO** (não aplicável)

**Resultado:**
```
✓ Importação concluída com sucesso!
2 produtos criados
0 produtos atualizados
```

**Banco de Dados:**
```
ID | Nome      | SKU    | Preço
45 | Produto A | PROD-A | 100.00  ← ID gerado automaticamente
46 | Produto B | PROD-B | 200.00  ← ID gerado automaticamente
```

---

### **Cenário 2: Migração com IDs Específicos (Primeira Importação)**

**CSV:**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
100,Produto A,PROD-A,1,1,100.00,50,10
101,Produto B,PROD-B,1,1,200.00,30,5
```

**Configuração:**
- ✅ Importar IDs: **ATIVADO**
- ❌ Substituir Existentes: **DESATIVADO**

**Resultado:**
```
✓ Importação concluída com sucesso!
2 produtos criados
0 produtos atualizados
```

**Banco de Dados:**
```
ID  | Nome      | SKU    | Preço
100 | Produto A | PROD-A | 100.00  ← ID do CSV
101 | Produto B | PROD-B | 200.00  ← ID do CSV
```

---

### **Cenário 3: Tentativa de Reimportar com Mesmos IDs (SEM Substituir)**

**Banco de Dados ANTES:**
```
ID  | Nome      | SKU    | Preço
100 | Produto A | PROD-A | 100.00
101 | Produto B | PROD-B | 200.00
```

**CSV (tentando importar novamente):**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
100,Produto A Modificado,PROD-A-V2,1,1,150.00,60,15
101,Produto B Modificado,PROD-B-V2,1,1,250.00,40,10
```

**Configuração:**
- ✅ Importar IDs: **ATIVADO**
- ❌ Substituir Existentes: **DESATIVADO** ← Importante!

**Resultado:**
```
✓ Importação concluída com sucesso!
0 produtos criados
0 produtos atualizados

⚠️ Avisos:
Linha 1: ID 100 já existe (ignorado)
Linha 2: ID 101 já existe (ignorado)
```

**Banco de Dados DEPOIS (sem mudanças):**
```
ID  | Nome      | SKU    | Preço
100 | Produto A | PROD-A | 100.00  ← Não foi alterado
101 | Produto B | PROD-B | 200.00  ← Não foi alterado
```

---

### **Cenário 4: Atualização em Massa (COM Substituir)**

**Banco de Dados ANTES:**
```
ID  | Nome      | SKU    | Preço
100 | Produto A | PROD-A | 100.00
101 | Produto B | PROD-B | 200.00
```

**CSV (mesmos IDs, dados atualizados):**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
100,Produto A Modificado,PROD-A-V2,1,1,150.00,60,15
101,Produto B Modificado,PROD-B-V2,1,1,250.00,40,10
```

**Configuração:**
- ✅ Importar IDs: **ATIVADO**
- ✅ Substituir Existentes: **ATIVADO** ← Importante!

**Resultado:**
```
✓ Importação concluída com sucesso!
0 produtos criados
2 produtos atualizados
```

**Banco de Dados DEPOIS:**
```
ID  | Nome                  | SKU       | Preço
100 | Produto A Modificado  | PROD-A-V2 | 150.00  ← Atualizado!
101 | Produto B Modificado  | PROD-B-V2 | 250.00  ← Atualizado!
```

**Activity Log:**
```
[UPDATE] Produto ID 100 - admin@empresa.com - 15/11/2025 14:30
[UPDATE] Produto ID 101 - admin@empresa.com - 15/11/2025 14:30
```

---

### **Cenário 5: Importação Mista (Alguns Existem, Outros Não)**

**Banco de Dados ANTES:**
```
ID  | Nome      | SKU    | Preço
100 | Produto A | PROD-A | 100.00
101 | Produto B | PROD-B | 200.00
```

**CSV (IDs 100 e 101 existem, 200 e 201 são novos):**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
100,Produto A Atualizado,PROD-A-V2,1,1,120.00,55,12
101,Produto B Atualizado,PROD-B-V2,1,1,220.00,35,8
200,Produto Novo C,PROD-C,1,2,300.00,20,5
201,Produto Novo D,PROD-D,1,2,400.00,15,4
```

**Configuração:**
- ✅ Importar IDs: **ATIVADO**
- ✅ Substituir Existentes: **ATIVADO**

**Resultado:**
```
✓ Importação concluída com sucesso!
2 produtos criados
2 produtos atualizados
```

**Banco de Dados DEPOIS:**
```
ID  | Nome                  | SKU       | Preço
100 | Produto A Atualizado  | PROD-A-V2 | 120.00  ← Atualizado
101 | Produto B Atualizado  | PROD-B-V2 | 220.00  ← Atualizado
200 | Produto Novo C        | PROD-C    | 300.00  ← Criado
201 | Produto Novo D        | PROD-D    | 400.00  ← Criado
```

**Activity Log:**
```
[UPDATE] Produto ID 100 - admin@empresa.com - 15/11/2025 14:35
[UPDATE] Produto ID 101 - admin@empresa.com - 15/11/2025 14:35
[INSERT] Produto ID 200 - admin@empresa.com - 15/11/2025 14:35
[INSERT] Produto ID 201 - admin@empresa.com - 15/11/2025 14:35
```

---

### **Cenário 6: Sincronização com Sistema Externo (Mista sem Substituir)**

**Banco de Dados ANTES:**
```
ID  | Nome      | SKU    | Preço
100 | Produto A | PROD-A | 100.00
101 | Produto B | PROD-B | 200.00
```

**CSV (mesma situação, mas SEM substituir):**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
100,Produto A Atualizado,PROD-A-V2,1,1,120.00,55,12
101,Produto B Atualizado,PROD-B-V2,1,1,220.00,35,8
200,Produto Novo C,PROD-C,1,2,300.00,20,5
201,Produto Novo D,PROD-D,1,2,400.00,15,4
```

**Configuração:**
- ✅ Importar IDs: **ATIVADO**
- ❌ Substituir Existentes: **DESATIVADO**

**Resultado:**
```
✓ Importação concluída com sucesso!
2 produtos criados
0 produtos atualizados

⚠️ Avisos:
Linha 1: ID 100 já existe (ignorado)
Linha 2: ID 101 já existe (ignorado)
```

**Banco de Dados DEPOIS:**
```
ID  | Nome           | SKU    | Preço
100 | Produto A      | PROD-A | 100.00  ← Não alterado
101 | Produto B      | PROD-B | 200.00  ← Não alterado
200 | Produto Novo C | PROD-C | 300.00  ← Criado
201 | Produto Novo D | PROD-D | 400.00  ← Criado
```

---

## 🔍 Perguntas Frequentes

### **P: O que acontece se eu marcar "Substituir Existentes" mas não marcar "Importar IDs"?**
**R:** A opção "Substituir Existentes" ficará **desabilitada** (opacidade 50%) e não terá efeito. IDs serão gerados automaticamente e todos os registros serão criados como novos.

---

### **P: Como faço para atualizar preços em massa?**
**R:** 
1. Exporte os dados atuais (com IDs)
2. Modifique apenas os preços no CSV
3. Importe com:
   - ✅ Importar IDs: **ATIVADO**
   - ✅ Substituir Existentes: **ATIVADO**

---

### **P: Como faço para adicionar produtos novos com IDs específicos (ex: 1000, 1001...)?**
**R:**
1. Crie o CSV com os IDs desejados
2. Importe com:
   - ✅ Importar IDs: **ATIVADO**
   - ❌ Substituir Existentes: **DESATIVADO**
3. Se algum ID já existir, será ignorado com aviso

---

### **P: Posso importar sem o campo "id" no CSV?**
**R:** Sim! Se não incluir o campo "id", o sistema gerará IDs automaticamente, independente das opções marcadas.

---

### **P: Todas as importações são registradas?**
**R:** Sim! Todo INSERT e UPDATE é registrado no **Activity Log** com:
- Usuário que importou
- Data e hora
- Dados antigos (para UPDATE)
- Dados novos
- IP do usuário

---

## 📋 Resumo Rápido

### Para **CRIAR** novos registros:
- ❌ Importar IDs + ❌ Substituir = IDs automáticos
- ✅ Importar IDs + ❌ Substituir = IDs do CSV (duplicados ignorados)
- ✅ Importar IDs + ✅ Substituir = IDs do CSV (cria novos se não existir)

### Para **ATUALIZAR** registros:
- ✅ Importar IDs + ✅ Substituir = Atualiza se existir, cria se não existir

### Para **IGNORAR** duplicados:
- ✅ Importar IDs + ❌ Substituir = Ignora IDs existentes com aviso

---

**EstoqueVS** - Sistema de Gestão Multi-Empresa 🚀
