# Instruções de Deployment - Sistema de Ativação de Empresas

## Resumo das Alterações

Implementado sistema completo para permitir que o Super Admin ative/desative empresas e seus usuários.

### Funcionalidades Implementadas:

1. ✅ **Banco de Dados**: Campos `active` nas tabelas `companies` e `users`
2. ✅ **API Backend**: Endpoint para toggle de ativação + validação no login
3. ✅ **TypeScript**: Tipos atualizados com campo `active`
4. ✅ **Frontend**: Componente Companies com UI completa para gerenciamento
5. ✅ **Validação de Login**: Bloqueia login de usuários/empresas desativados

---

## Passo 1: Executar Migração SQL

**IMPORTANTE**: Faça backup do banco de dados antes!

```bash
# Conectar ao servidor de produção
ssh root@ns5023255

# Fazer backup do banco
mysqldump -u root -p dona_estoqueg > ~/backup_estoque_$(date +%Y%m%d_%H%M%S).sql

# Executar a migração
mysql -u root -p dona_estoqueg < /home/donasala/public_html/estoque/add_active_fields.sql
```

**Verificação**:
```sql
-- Confirmar que as colunas foram adicionadas
DESCRIBE companies;
DESCRIBE users;

-- Confirmar que os índices foram criados
SHOW INDEX FROM companies;
SHOW INDEX FROM users;

-- Verificar valores padrão
SELECT name, active FROM companies;
SELECT name, active FROM users;
```

---

## Passo 2: Upload dos Arquivos Modificados

### Arquivo 1: `api.php`
**Localização**: `public_html/api.php`

**Modificações**:
- ✅ Função `formatUser()` - linha 192: adiciona campo `active`
- ✅ Função `formatCompany()` - linha 206: adiciona campo `active`
- ✅ Roteamento `companies` - linha 287: verifica action `toggle-active`
- ✅ Função `handleAuth()` - linha 335: valida status ativo de usuário e empresa
- ✅ Nova função `handleCompanyToggleActive()` - linha 995: implementa toggle

### Arquivo 2: `add_active_fields.sql`
**Localização**: `public_html/add_active_fields.sql`

**Conteúdo**: Script de migração SQL (executar apenas uma vez)

### Arquivo 3: Build do Frontend
```bash
# Na máquina local
cd "d:\Estoque Gemini"
npm run build
```

**Upload dos arquivos de build**:
- `public_html/index.html`
- `public_html/assets/*` (todos os arquivos gerados)

---

## Passo 3: Testar a Implementação

### Teste 1: Login Validation
1. Acesse a tela de Empresas (Super Admin)
2. Desative uma empresa de teste
3. Tente fazer login com um usuário dessa empresa
4. ✅ **Esperado**: Mensagem "Empresa desativada. Entre em contato com o Super Admin."

### Teste 2: Cascading Deactivation
1. Desative uma empresa que tenha usuários
2. Consulte o banco de dados:
   ```sql
   SELECT name, active FROM users WHERE company_id = X;
   ```
3. ✅ **Esperado**: Todos os usuários com `active = 0`

### Teste 3: Reactivation
1. Reative a empresa
2. Consulte o banco novamente
3. ✅ **Esperado**: Todos os usuários com `active = 1`
4. Tente fazer login novamente
5. ✅ **Esperado**: Login funciona normalmente

### Teste 4: UI do Componente Companies
1. Acesse "Empresas" no menu lateral (Super Admin)
2. Verifique:
   - ✅ Lista mostra todas as empresas
   - ✅ Badge de status (Ativa/Inativa)
   - ✅ Contagem de usuários por empresa
   - ✅ Filtros: Todas / Ativas / Inativas
   - ✅ Botão Ativar/Desativar funciona
   - ✅ Status muda em tempo real

---

## Passo 4: Rollback (Se Necessário)

Se houver problemas, execute:

```sql
-- Remover colunas adicionadas
ALTER TABLE companies DROP COLUMN active;
ALTER TABLE users DROP COLUMN active;

-- Remover índices
DROP INDEX idx_companies_active ON companies;
DROP INDEX idx_users_active ON users;
```

Depois, restaure os arquivos do backup:
```bash
# Restaurar api.php antigo
cp ~/backup/api.php /home/donasala/public_html/estoque/api.php

# Restaurar build antigo
cp -r ~/backup/build/* /home/donasala/public_html/estoque/
```

---

## Estrutura das Mudanças

### 1. Banco de Dados
```sql
-- Tabela companies
ALTER TABLE companies ADD COLUMN active TINYINT(1) DEFAULT 1;

-- Tabela users
ALTER TABLE users ADD COLUMN active TINYINT(1) DEFAULT 1;
```

### 2. API Endpoint
**URL**: `PUT /api.php/companies/{id}/toggle-active`

**Autenticação**: Super Admin only

**Comportamento**:
- Inverte o status `active` da empresa (0 ↔ 1)
- Se desativar (0): desativa todos os usuários da empresa
- Se ativar (1): reativa todos os usuários da empresa
- Retorna objeto Company atualizado

**Resposta**:
```json
{
  "id": 1,
  "name": "Empresa Teste",
  "cnpj": "",
  "address": "",
  "active": 0
}
```

**Erro (não autorizado)**:
```json
{
  "error": "Acesso negado. Apenas Super Admin pode gerenciar empresas."
}
```

### 3. Login Validation
**Endpoint**: `POST /api.php/auth/login`

**Novas validações**:
1. Verifica `users.active = 1`
   - Se 0: retorna 403 com mensagem "Usuário desativado"
2. Verifica `companies.active = 1` (via JOIN)
   - Se 0: retorna 403 com mensagem "Empresa desativada"

### 4. Frontend - Componente Companies

**Localização**: `components/Companies.tsx`

**Funcionalidades**:
- Lista todas as empresas
- Badge visual de status (verde = ativa, vermelho = inativa)
- Contagem de usuários por empresa
- Filtros: Todas / Ativas / Inativas
- Botão Ativar/Desativar (muda cor conforme estado)
- Editar nome da empresa
- Excluir empresa

**Acesso**: Apenas Super Admin (controlado no Sidebar.tsx)

---

## Comandos Úteis

### Verificar logs de erro
```bash
tail -f /home/donasala/logs/error_log
```

### Verificar empresas e usuários ativos
```sql
SELECT 
  c.id,
  c.name,
  c.active as company_active,
  COUNT(u.id) as total_users,
  SUM(CASE WHEN u.active = 1 THEN 1 ELSE 0 END) as active_users
FROM companies c
LEFT JOIN users u ON c.company_id = u.company_id
GROUP BY c.id, c.name, c.active;
```

### Reativar todas as empresas (emergência)
```sql
UPDATE companies SET active = 1;
UPDATE users SET active = 1;
```

---

## Checklist Final

- [ ] Backup do banco de dados criado
- [ ] Script SQL executado com sucesso
- [ ] Colunas `active` adicionadas às tabelas
- [ ] Índices criados
- [ ] Arquivo `api.php` atualizado no servidor
- [ ] Build do frontend gerado
- [ ] Arquivos de build enviados para o servidor
- [ ] Teste de login com empresa desativada (deve bloquear)
- [ ] Teste de login com empresa ativada (deve permitir)
- [ ] Teste de cascata (desativar empresa desativa usuários)
- [ ] UI do componente Companies funcionando
- [ ] Filtros funcionando corretamente

---

## Observações Importantes

1. **Permissões**: Apenas Super Admin pode acessar a tela de Empresas
2. **Cascata**: Ao desativar empresa, TODOS os usuários são desativados automaticamente
3. **Reativação**: Ao reativar empresa, TODOS os usuários são reativados
4. **Login**: Usuários de empresas inativas não conseguem fazer login
5. **Valores Padrão**: Todas as empresas e usuários existentes recebem `active = 1` na migração

---

## Contato

Em caso de dúvidas ou problemas:
- Verificar logs do servidor
- Consultar este documento
- Fazer rollback se necessário
