# 📥 Guia de Importação CSV - EstoqueVS

## 🎯 Novas Funcionalidades

A importação CSV agora possui duas opções avançadas:

### ✅ **1. Importar IDs do CSV**
- Mantém os IDs originais do arquivo CSV
- Útil para migração de dados ou sincronização entre sistemas
- Quando ativado, o campo `id` do CSV será respeitado

### ✅ **2. Substituir Registros Existentes**
- Se um registro com o mesmo ID já existir, ele será **atualizado**
- Se não existir, será **criado** com o ID especificado
- Se desativado, registros existentes serão **ignorados**

---

## 📋 Exemplos de Arquivos CSV

### **Produtos**

#### Exemplo 1: Importação Normal (sem IDs)
```csv
name,sku,categoryId,supplierId,price,stock,minStock
Notebook Dell Inspiron 15,NB-DELL-001,1,1,2500.00,15,5
Mouse Logitech MX Master,MS-LOG-001,1,1,120.50,50,10
Teclado Mecânico Redragon,KB-RED-001,1,2,350.00,30,8
Monitor LG 24 Polegadas,MON-LG-001,1,1,890.00,12,3
```

**Opções recomendadas:**
- ❌ Importar IDs: **Desativado** (os IDs serão gerados automaticamente)
- ❌ Substituir Existentes: **Não aplicável**

---

#### Exemplo 2: Importação com IDs Específicos
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
100,Notebook Dell XPS 13,NB-DELL-XPS,1,1,4500.00,8,2
101,Notebook HP Pavilion,NB-HP-PAV,1,2,3200.00,10,3
102,Mouse Razer DeathAdder,MS-RAZ-001,1,3,250.00,25,5
103,Webcam Logitech C920,WEB-LOG-001,1,1,450.00,15,4
```

**Opções recomendadas:**
- ✅ Importar IDs: **Ativado** (usar IDs 100, 101, 102, 103)
- ❌ Substituir Existentes: **Desativado** (criar novos registros)

---

#### Exemplo 3: Atualização em Massa
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
1,Notebook Dell Inspiron 15 - NOVO MODELO,NB-DELL-001-V2,1,1,2700.00,20,5
2,Mouse Logitech MX Master 3,MS-LOG-002,1,1,180.00,60,15
```

**Opções recomendadas:**
- ✅ Importar IDs: **Ativado** (usar IDs existentes)
- ✅ Substituir Existentes: **Ativado** (atualizar produtos com ID 1 e 2)

**Resultado esperado:**
- ✏️ 2 produtos atualizados
- ➕ 0 produtos criados

---

### **Categorias**

#### Exemplo 1: Importação Normal
```csv
name,description
Eletrônicos,Produtos eletrônicos e tecnologia
Alimentos,Produtos alimentícios e bebidas
Vestuário,Roupas e acessórios
Móveis,Móveis e decoração
```

**Opções recomendadas:**
- ❌ Importar IDs: **Desativado**
- ❌ Substituir Existentes: **Não aplicável**

---

#### Exemplo 2: Importação com IDs e Atualização
```csv
id,name,description
1,Eletrônicos e Tecnologia,Produtos de alta tecnologia e eletrônicos em geral
5,Livros e Revistas,Material de leitura e publicações
10,Esportes,Artigos esportivos e fitness
```

**Opções recomendadas:**
- ✅ Importar IDs: **Ativado**
- ✅ Substituir Existentes: **Ativado** (atualiza categoria 1 se existir, cria 5 e 10)

---

### **Fornecedores**

#### Exemplo 1: Importação Normal
```csv
name,contactPerson,email,phone
Tech Distribuidora Ltda,João Silva,joao@techdist.com,11999999999
Global Suprimentos S.A.,Maria Santos,maria@globalsupr.com,11988888888
Eletrônicos Brasil,Carlos Oliveira,carlos@eletronicosb.com,21977777777
```

**Opções recomendadas:**
- ❌ Importar IDs: **Desativado**
- ❌ Substituir Existentes: **Não aplicável**

---

#### Exemplo 2: Sincronização com Sistema Externo
```csv
id,name,contactPerson,email,phone
1000,Tech Distribuidora Premium,João Silva Junior,joao.jr@techdist.com,11999999998
1001,Global Suprimentos Internacional,Maria Santos Lima,maria.lima@globalsupr.com,11988888887
1002,Eletrônicos Brasil Atacado,Carlos Oliveira Neto,carlos.neto@eletronicosb.com,21977777776
```

**Opções recomendadas:**
- ✅ Importar IDs: **Ativado** (usar IDs do sistema externo)
- ✅ Substituir Existentes: **Ativado** (atualizar dados se fornecedor já existir)

---

## 🔄 Cenários de Uso

### **Cenário 1: Migração de Dados**
Você está migrando de outro sistema e quer manter os IDs originais.

**Configuração:**
- ✅ Importar IDs
- ❌ Substituir Existentes (primeira importação)

**CSV:**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
1500,Produto Migrado A,PROD-MIG-A,1,1,100.00,50,10
1501,Produto Migrado B,PROD-MIG-B,1,1,200.00,30,5
```

---

### **Cenário 2: Atualização Periódica de Preços**
Você recebe um CSV com preços atualizados semanalmente.

**Configuração:**
- ✅ Importar IDs
- ✅ Substituir Existentes

**CSV:**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
1,Notebook Dell,NB-DELL-001,1,1,2450.00,15,5
2,Mouse Logitech,MS-LOG-001,1,1,115.00,50,10
```

**Resultado:**
- Produtos 1 e 2 terão os preços atualizados
- Demais campos também serão atualizados
- Activity Log registrará as mudanças

---

### **Cenário 3: Importação de Novos Produtos**
Você recebeu uma lista de novos produtos para adicionar ao estoque.

**Configuração:**
- ❌ Importar IDs (deixar o sistema gerar automaticamente)
- ❌ Substituir Existentes (não aplicável)

**CSV:**
```csv
name,sku,categoryId,supplierId,price,stock,minStock
Produto Novo 1,PROD-001,1,1,150.00,100,20
Produto Novo 2,PROD-002,1,2,250.00,80,15
```

**Resultado:**
- Sistema gerará IDs automaticamente (ex: 50, 51...)
- Produtos criados com sucesso
- Activity Log registrará as inserções

---

### **Cenário 4: Sincronização Parcial**
Você quer atualizar alguns produtos e criar outros novos, usando IDs específicos.

**Configuração:**
- ✅ Importar IDs
- ✅ Substituir Existentes

**CSV:**
```csv
id,name,sku,categoryId,supplierId,price,stock,minStock
5,Produto Existente Atualizado,PROD-005-V2,1,1,180.00,60,10
200,Produto Novo com ID 200,PROD-200,1,2,320.00,40,8
201,Produto Novo com ID 201,PROD-201,1,2,420.00,35,7
```

**Resultado:**
- ID 5: **Atualizado** (se já existe)
- ID 200 e 201: **Criados** (novos registros)
- Activity Log mostrará 1 UPDATE e 2 INSERTs

---

## ⚠️ Avisos Importantes

### **1. Importar IDs**
- ⚠️ Use apenas se souber o que está fazendo
- ✅ IDs duplicados serão **ignorados** (se "Substituir" estiver desativado)
- ✅ IDs duplicados serão **atualizados** (se "Substituir" estiver ativado)
- ✅ Útil para migração de dados
- ✅ Útil para sincronização com sistemas externos

### **2. Substituir Existentes**
- 🔄 Só funciona quando "Importar IDs" está ativado
- ⚠️ Sobrescreverá TODOS os dados do registro existente
- 📝 Todas as mudanças serão registradas no Activity Log
- ✅ Útil para atualizações em massa
- ⚠️ Se desativado, IDs duplicados serão **ignorados** com mensagem de aviso

### **3. Mapeamento de Campos**
- ✓ Você pode desmarcar campos que não quer importar
- ✓ O sistema sugere mapeamentos automaticamente
- ✓ Campos obrigatórios devem estar sempre selecionados

### **4. Activity Log**
- 📊 Todas as importações são registradas
- 🕒 Você pode ver quem importou e quando
- 📝 Dados antigos e novos são armazenados para auditoria

---

## 🎯 Fluxo de Trabalho Recomendado

1. **Prepare o arquivo CSV**
   - Use o formato correto
   - Verifique os IDs se for usar importação com IDs

2. **Faça upload do arquivo**
   - Arraste e solte ou selecione o arquivo
   - Sistema detecta automaticamente o delimitador

3. **Configure o mapeamento**
   - Verifique as sugestões automáticas
   - Desmarque campos que não quer importar
   - Configure as opções de importação

4. **Visualize a pré-visualização**
   - Revise os primeiros 10 registros
   - Confirme se está tudo correto

5. **Confirme a importação**
   - Aguarde o processamento
   - Verifique a mensagem de sucesso/avisos

6. **Verifique o Activity Log**
   - Acesse "Log de Atividades" no menu
   - Confirme que as mudanças foram registradas

---

## 📞 Suporte

Se tiver dúvidas sobre a importação CSV, consulte o administrador do sistema ou verifique o Log de Atividades para auditoria completa de todas as operações.

**EstoqueVS** - Sistema de Gestão Multi-Empresa 🚀
