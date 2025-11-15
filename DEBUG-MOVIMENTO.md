# 🔧 DEBUG: Erro ao Registrar Movimentação

## Problema Reportado
```
ERRO: Erro ao registrar movimentação
```

## Correções Aplicadas

### 1. Adicionada Validação e Tratamento de Erros
O código do POST agora:
- ✅ Valida campos obrigatórios (productId, type, quantity, userId)
- ✅ Verifica se o statement foi preparado corretamente
- ✅ Captura e retorna erros específicos do MySQL
- ✅ Retorna mensagens de erro claras para o frontend

### 2. Arquivos Criados para Debug

**test-movement-debug.html** - Interface de testes com 4 etapas:
1. Verificar estrutura da tabela stock_movements
2. Listar usuários disponíveis
3. Testar POST de movimentação
4. Verificar última movimentação criada

**test-table-structure.php** - Mostra:
- Estrutura completa da tabela
- Foreign keys configuradas
- Dados existentes

---

## 📋 INSTRUÇÕES PARA DEBUG

### Passo 1: Upload dos Arquivos
Faça upload para o servidor:

- ✅ **public_html/api.php** (ATUALIZADO - com validação e error handling)
- ✅ **public_html/test-movement-debug.html** (NOVO)
- ✅ **public_html/test-table-structure.php** (NOVO)

### Passo 2: Executar Debug
Acesse:
```
https://www.donasalada.com.br/EstoqueGemini/test-movement-debug.html
```

Execute na ordem:

#### Teste 1: Verificar Estrutura da Tabela
- Clique em "Verificar Estrutura da Tabela"
- **Verifique se as colunas existem:**
  - `id` (PRIMARY KEY)
  - `product_id` (INT)
  - `user_id` (INT) ← **IMPORTANTE**
  - `type` (VARCHAR)
  - `quantity` (INT)
  - `reason` (TEXT/VARCHAR)
  - `date` (DATETIME/TIMESTAMP)

#### Teste 2: Verificar Usuários
- Clique em "Listar Usuários"
- **Resultado esperado:** Deve mostrar pelo menos 1 usuário
- **Anote o ID do usuário** (provavelmente ID 1)

#### Teste 3: Testar POST Simples
- Clique em "Criar Movimentação de Teste"
- **Possíveis resultados:**

**✅ SUCESSO:**
```
✅ SUCESSO: Movimentação criada!
ID da movimentação: X
```
→ Problema resolvido! Passe para o Passo 3.

**❌ ERRO - Campo faltando:**
```
Campos obrigatórios faltando: productId, type, quantity, userId
```
→ Problema no frontend (dados não sendo enviados)

**❌ ERRO - SQL:**
```
Erro ao inserir movimentação: [mensagem do MySQL]
```
→ Possíveis causas:
- Foreign key constraint (user_id não existe na tabela users)
- Foreign key constraint (product_id não existe na tabela products)
- Tipo de dados incompatível
- Coluna obrigatória sem valor

#### Teste 4: Verificar Última Movimentação
- Clique em "Ver Última Movimentação"
- Confirme que a movimentação foi criada

---

## 🔍 Possíveis Problemas e Soluções

### Problema A: Foreign Key Constraint
**Erro:** `Cannot add or update a child row: a foreign key constraint fails`

**Causa:** O `user_id` enviado não existe na tabela `users`, ou o `product_id` não existe na tabela `products`.

**Solução:**
1. Verifique se o usuário existe (Teste 2)
2. Verifique se o produto ID 1 existe
3. Certifique-se de que os IDs são números inteiros

### Problema B: Coluna `user_id` NULL
**Erro:** `Column 'user_id' cannot be null`

**Causa:** O frontend não está enviando o `userId` ou está enviando `null`.

**Solução:** Verificar o código do teste (test-autocommit.html linha ~180):
```javascript
userId: 1, // ← Deve ser um número, não null
```

### Problema C: Tipo de Dados Incompatível
**Erro:** `Incorrect integer value`

**Causa:** O tipo enviado está como string quando deveria ser inteiro.

**Solução:** O bind_param já está correto:
```php
$stmt->bind_param("isissi", // i=integer, s=string
    $input['productId'],    // i
    $input['type'],         // s
    $input['quantity'],     // i
    $input['reason'],       // s
    $date,                  // s
    $input['userId']        // i
);
```

---

## 📝 Checklist de Verificação

Execute na ordem:

- [ ] 1. Upload dos 3 arquivos (api.php, test-movement-debug.html, test-table-structure.php)
- [ ] 2. Acessar test-movement-debug.html
- [ ] 3. Executar Teste 1 - Verificar se todas as colunas existem
- [ ] 4. Executar Teste 2 - Confirmar que existe pelo menos 1 usuário
- [ ] 5. Executar Teste 3 - Tentar criar movimentação
- [ ] 6. **ANOTAR A MENSAGEM DE ERRO EXATA** (se houver)
- [ ] 7. Executar Teste 4 - Verificar se foi criada

---

## 🎯 Próximos Passos

### Se o Teste 3 der SUCESSO:
✅ Problema resolvido! Volte ao test-autocommit.html e teste novamente.

### Se o Teste 3 der ERRO:
❌ **COPIE A MENSAGEM DE ERRO COMPLETA** e me envie para análise detalhada.

A mensagem de erro agora será muito mais específica e vai indicar exatamente qual é o problema:
- Campo faltando
- Erro de SQL (constraint, tipo de dados, etc.)
- Erro de preparação do statement

---

## 🆘 Informações para Debug

Se continuar com erro, preciso saber:

1. **Mensagem de erro completa** do Teste 3
2. **Resultado do Teste 1** (estrutura da tabela)
3. **Resultado do Teste 2** (lista de usuários)
4. **Existe produto com ID 1?** (verificar em Produtos)

Com essas informações, posso identificar e corrigir o problema exato.
