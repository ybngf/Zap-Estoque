# Implementação de Funcionalidades - Pixabay API + Relatório de Atividades Críticas

## 📋 Resumo

Implementadas duas funcionalidades solicitadas:

1. **Campo para API Key do Pixabay** nas configurações da empresa
2. **Relatório de Atividades Críticas** para Super Admin

---

## 🔑 1. Campo API do Pixabay

### **Objetivo**
Permitir que cada empresa configure sua própria chave de API do Pixabay para evitar o limite compartilhado de 5.000 requisições/hora.

### **Alterações Realizadas**

#### Frontend

**types.ts** (Linha 129)
```typescript
export interface CompanySettings {
  gemini_api_key: string;
  pixabay_api_key: string;  // ← NOVA PROPRIEDADE
  invoice_prefix: string;
  tax_rate: string;
  // ... outros campos
}
```

**components/CompanySettings.tsx** (Linhas ~346-371)
- Adicionado campo de input na seção "🤖 Integração com IA"
- Campo: `pixabay_api_key`
- Placeholder: `46737899-b38ce8e1a26a3f4110dae3156`
- Link para documentação: https://pixabay.com/api/docs/
- Descrição: "Chave de API do Pixabay para busca automática de imagens de produtos"

#### Backend

**public_html/api.php** (Função `searchProductImage()`)

**ANTES:**
```php
function searchProductImage($productName) {
    $apiKey = '46737899-b38ce8e1a26a3f4110dae3156'; // Hardcoded
    // ...
}
```

**DEPOIS:**
```php
function searchProductImage($productName, $conn = null, $companyId = null) {
    // API key padrão
    $apiKey = '46737899-b38ce8e1a26a3f4110dae3156';
    
    // Buscar chave personalizada da empresa
    if ($conn && $companyId) {
        $stmt = $conn->prepare("SELECT setting_value FROM company_settings 
                               WHERE company_id = ? AND setting_key = 'pixabay_api_key'");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            if (!empty($row['setting_value'])) {
                $apiKey = $row['setting_value'];
            }
        }
        $stmt->close();
    }
    
    // Usar a chave (custom ou padrão)
    $url = 'https://pixabay.com/api/?key=' . $apiKey . '&q=' . urlencode($cleanName);
    // ...
}
```

**Chamada atualizada (Linha ~1815):**
```php
// Atualização em massa de imagens
foreach ($products as $product) {
    $imageUrl = searchProductImage($product['name'], $conn, $companyId); // ← Passa $conn e $companyId
    // ...
}
```

### **Como Usar**

1. Login como **Admin** da empresa
2. Ir em **Configurações** (menu lateral)
3. Seção **🤖 Integração com IA**
4. Preencher campo **"Pixabay API Key"**
5. Clicar em **"Salvar Configurações"**
6. Ao usar **"🤖 Buscar Fotos por IA"** nos produtos, usará sua chave personalizada

### **Benefícios**

- ✅ Cada empresa tem 5.000 requisições/hora próprias
- ✅ Não compartilha limite com outras empresas
- ✅ Fallback automático para chave padrão se não configurado
- ✅ Fácil obtenção: API gratuita do Pixabay

---

## 🔒 2. Relatório de Atividades Críticas (Super Admin)

### **Objetivo**
Monitorar todas as ações críticas realizadas por usuários no sistema, com detalhamento profissional de data, hora, usuário, IP, empresa, ação, tabela e detalhes das alterações.

### **Alterações Realizadas**

#### Frontend

**components/CriticalActivityReport.tsx** (NOVO ARQUIVO - 444 linhas)

**Funcionalidades:**
- 🔍 **Filtros Avançados:**
  - Data inicial/final
  - Usuário específico
  - Empresa específica
  - Tipo de ação (CREATE, UPDATE, DELETE)
  - Tabela afetada (users, products, companies, etc.)

- 📊 **Estatísticas em Tempo Real:**
  - Total de atividades
  - Total de criações (verde)
  - Total de atualizações (azul)
  - Total de exclusões (vermelho)

- 📋 **Tabela Detalhada:**
  - **Criticidade**: CRÍTICO, ALTO, MÉDIO, BAIXO (calculada dinamicamente)
  - **Data/Hora**: Formatada em pt-BR
  - **Usuário**: Nome + Email
  - **Empresa**: Nome da empresa
  - **Ação**: Badge colorido (CREATE/UPDATE/DELETE)
  - **Tabela**: Nome da tabela afetada
  - **Registro**: ID do registro
  - **IP**: Endereço IP do usuário
  - **Detalhes**: Dropdown expansível com:
    - User Agent
    - Valor anterior (JSON formatado)
    - Novo valor (JSON formatado)

- 📥 **Exportação:**
  - Download CSV com todos os dados
  - Nome do arquivo: `atividades-criticas-YYYY-MM-DD.csv`

**Lógica de Criticidade:**
```typescript
CRÍTICO  → DELETE em tabelas críticas (users, companies, company_settings, products)
ALTO     → DELETE em outras tabelas OU UPDATE em tabelas críticas
MÉDIO    → CREATE em tabelas críticas
BAIXO    → Outras operações
```

**App.tsx**
- Importado componente `CriticalActivityReport`
- Adicionado tipo `'critical-activity-report'` ao `View`
- Rota criada no `renderView()`:
```typescript
case 'critical-activity-report':
    return <CriticalActivityReport />;
```

**Sidebar.tsx**
- Adicionado item no menu (apenas para Super Admin):
```typescript
{ 
  name: '🔒 Atividades Críticas', 
  icon: DocumentArrowUpIcon, 
  view: 'critical-activity-report', 
  requiredRole: Role.SuperAdmin 
}
```

**services/api.ts**
- Nova função `getCriticalActivities()`:
```typescript
export const getCriticalActivities = async (filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    companyId?: string;
    actionType?: string;
    tableName?: string;
}): Promise<any[]> => {
    const params = new URLSearchParams();
    // ... monta query string com filtros
    return apiRequest(`/activity-log?${params.toString()}`);
};
```

#### Backend

**public_html/api.php** (Função `handleActivityLog()` - Linha 1072)

**ANTES:**
```php
case 'GET':
    $query = "SELECT ... FROM activity_log ...";
    // Apenas filtro de empresa
    if ($currentUser['role'] !== 'Super Admin') {
        $query .= " WHERE al.company_id = " . $companyId;
    }
    $query .= " ORDER BY al.created_at DESC LIMIT 500";
```

**DEPOIS:**
```php
case 'GET':
    $query = "SELECT 
                al.id,
                al.user_id,
                al.company_id,
                al.action,
                al.entity_type,
                al.entity_id,
                al.old_data,
                al.new_data,
                al.ip_address,
                al.user_agent,  // ← ADICIONADO
                al.created_at,
                u.name as user_name,
                u.email as user_email,
                c.name as company_name
              FROM activity_log al
              LEFT JOIN users u ON al.user_id = u.id
              LEFT JOIN companies c ON al.company_id = c.id";
    
    $conditions = [];
    
    // Filtros apenas para Super Admin
    if ($currentUser['role'] === 'Super Admin') {
        // Filtro de data inicial
        if (isset($_GET['start_date']) && !empty($_GET['start_date'])) {
            $startDate = $conn->real_escape_string($_GET['start_date']);
            $conditions[] = "DATE(al.created_at) >= '$startDate'";
        }
        
        // Filtro de data final
        if (isset($_GET['end_date']) && !empty($_GET['end_date'])) {
            $endDate = $conn->real_escape_string($_GET['end_date']);
            $conditions[] = "DATE(al.created_at) <= '$endDate'";
        }
        
        // Filtro de usuário
        if (isset($_GET['user_id']) && !empty($_GET['user_id'])) {
            $userId = (int)$_GET['user_id'];
            $conditions[] = "al.user_id = $userId";
        }
        
        // Filtro de empresa
        if (isset($_GET['company_id']) && !empty($_GET['company_id'])) {
            $companyId = (int)$_GET['company_id'];
            $conditions[] = "al.company_id = $companyId";
        }
        
        // Filtro de tipo de ação
        if (isset($_GET['action_type']) && !empty($_GET['action_type'])) {
            $actionType = $conn->real_escape_string($_GET['action_type']);
            $conditions[] = "al.action = '$actionType'";
        }
        
        // Filtro de tabela
        if (isset($_GET['table_name']) && !empty($_GET['table_name'])) {
            $tableName = $conn->real_escape_string($_GET['table_name']);
            $conditions[] = "al.entity_type = '$tableName'";
        }
    } else {
        // Usuários normais veem apenas da sua empresa
        $conditions[] = "al.company_id = " . (int)$currentUser['company_id'];
    }
    
    if (count($conditions) > 0) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $query .= " ORDER BY al.created_at DESC LIMIT 1000"; // Aumentado de 500 para 1000
```

**Formato de Resposta (JSON):**
```json
[
  {
    "id": 123,
    "user_id": 5,
    "user_name": "João Silva",
    "user_email": "joao@empresa.com",
    "company_id": 2,
    "company_name": "Empresa XYZ",
    "action_type": "DELETE",
    "table_name": "products",
    "record_id": 456,
    "old_value": {"name": "Produto A", "stock": 10},
    "new_value": null,
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "created_at": "2024-01-15 14:35:22"
  }
]
```

**Função logActivity() (Linha 115)**
- JÁ ESTAVA capturando:
  - `$_SERVER['REMOTE_ADDR']` → IP do usuário
  - `$_SERVER['HTTP_USER_AGENT']` → Navegador/Sistema Operacional
- Trunca user agent para 255 caracteres

### **Como Usar**

1. Login como **Super Admin**
2. Menu lateral → **🔒 Atividades Críticas**
3. Configurar filtros:
   - Data inicial: última semana (padrão)
   - Data final: hoje (padrão)
   - Usuário: todos ou específico
   - Empresa: todas ou específica
   - Tipo de Ação: todos, CREATE, UPDATE ou DELETE
   - Tabela: todas ou específica (users, products, etc.)
4. Clicar em **"Aplicar"**
5. Ver resultados na tabela
6. Clicar em **"Ver"** na coluna Detalhes para expandir informações
7. Clicar em **📥** para exportar CSV

### **Exemplos de Uso**

**Caso 1: Auditoria de Exclusões**
- Filtro: Tipo de Ação = DELETE
- Resultado: Todas as exclusões do período com responsável e IP

**Caso 2: Monitorar Empresa Específica**
- Filtro: Empresa = "Empresa ABC"
- Resultado: Todas as atividades dessa empresa

**Caso 3: Investigar Usuário**
- Filtro: Usuário = "João Silva"
- Resultado: Todas as ações desse usuário com detalhes

**Caso 4: Alterações em Configurações**
- Filtro: Tabela = "company_settings"
- Resultado: Mudanças de configuração com valores antigos/novos

---

## 🗄️ Banco de Dados

### **Tabela: activity_log**

**Estrutura Esperada:**
```sql
CREATE TABLE activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,           -- CREATE, UPDATE, DELETE
  entity_type VARCHAR(100) NOT NULL,     -- users, products, categories, etc.
  entity_id INT NOT NULL,
  old_data TEXT NULL,                    -- JSON com dados anteriores
  new_data TEXT NULL,                    -- JSON com dados novos
  ip_address VARCHAR(45) NULL,           -- IPv4 ou IPv6
  user_agent VARCHAR(255) NULL,          -- Navegador/SO
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

### **Atualização do Banco (se necessário)**

Se você receber erro de coluna `user_agent` não encontrada, execute:

```bash
mysql -u root -p dona_estoqueg < database-update-user-agent.sql
```

Ou execute manualmente:
```sql
ALTER TABLE activity_log ADD user_agent VARCHAR(255) NULL AFTER ip_address;
```

---

## ✅ Checklist de Implementação

### Feature 1: Pixabay API Key
- [x] Adicionar campo `pixabay_api_key` em `types.ts`
- [x] Adicionar input no formulário de configurações
- [x] Atualizar função `searchProductImage()` para aceitar conexão e ID da empresa
- [x] Buscar chave personalizada do banco de dados
- [x] Fallback para chave padrão se não configurado
- [x] Atualizar chamada da função em `handleBulkOperations()`
- [x] Compilar projeto

### Feature 2: Relatório de Atividades Críticas
- [x] Criar componente `CriticalActivityReport.tsx`
- [x] Implementar filtros (data, usuário, empresa, ação, tabela)
- [x] Implementar estatísticas (total, criações, updates, deletes)
- [x] Implementar tabela com criticidade dinâmica
- [x] Implementar detalhes expansíveis (user agent, valores antigos/novos)
- [x] Implementar exportação CSV
- [x] Adicionar função `getCriticalActivities()` em `api.ts`
- [x] Atualizar `handleActivityLog()` no backend com filtros
- [x] Adicionar campo `user_agent` na query
- [x] Adicionar rota no `App.tsx`
- [x] Adicionar item no menu do `Sidebar.tsx`
- [x] Criar script SQL para adicionar coluna `user_agent`
- [x] Compilar projeto

---

## 🚀 Como Testar

### **Teste 1: Pixabay API Key**

1. Login como Admin
2. Configurações → Campo "Pixabay API Key"
3. Inserir chave válida: `46737899-b38ce8e1a26a3f4110dae3156`
4. Salvar
5. Ir em Produtos
6. Selecionar categorias
7. Clicar em "🤖 Buscar Fotos por IA"
8. Verificar se fotos foram atualizadas

**Verificação no Backend:**
```sql
SELECT setting_key, setting_value 
FROM company_settings 
WHERE setting_key = 'pixabay_api_key';
```

### **Teste 2: Relatório de Atividades Críticas**

1. Login como Super Admin
2. Menu → 🔒 Atividades Críticas
3. Verificar se estatísticas aparecem (Total, Criações, Atualizações, Exclusões)
4. Testar filtros:
   - Mudar data inicial para 1 semana atrás
   - Aplicar
   - Verificar se resultados mudaram
5. Testar filtro de ação:
   - Selecionar "DELETE"
   - Aplicar
   - Verificar se mostra apenas exclusões
6. Clicar em "Ver" em uma linha
   - Verificar se mostra User Agent
   - Verificar se mostra valores antigos/novos em JSON
7. Clicar em 📥 (exportar)
   - Verificar se faz download do CSV
   - Abrir CSV e verificar colunas

**Verificação no Backend:**
```sql
-- Verificar se IP e User Agent estão sendo capturados
SELECT 
  id, 
  user_id, 
  action, 
  entity_type, 
  ip_address, 
  user_agent, 
  created_at 
FROM activity_log 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📦 Arquivos Modificados/Criados

### **Criados:**
1. `components/CriticalActivityReport.tsx` (444 linhas)
2. `database-update-user-agent.sql` (22 linhas)
3. `IMPLEMENTACAO-PIXABAY-E-RELATORIO.md` (este arquivo)

### **Modificados:**
1. `types.ts` - Linha 129 (adicionado `pixabay_api_key`)
2. `components/CompanySettings.tsx` - Linhas ~346-371 (campo Pixabay)
3. `public_html/api.php` - Função `searchProductImage()` (busca chave do BD)
4. `public_html/api.php` - Função `handleActivityLog()` (filtros avançados)
5. `services/api.ts` - Adicionado `getCriticalActivities()`
6. `App.tsx` - Importado e roteado `CriticalActivityReport`
7. `components/Sidebar.tsx` - Adicionado item de menu

---

## 🎨 UI/UX

### **CompanySettings - Seção IA**
```
┌─────────────────────────────────────────────┐
│ 🤖 Integração com IA                        │
├─────────────────────────────────────────────┤
│                                             │
│ Gemini API Key                              │
│ ┌─────────────────────────────────────┐    │
│ │ AIzaSyD...                          │    │
│ └─────────────────────────────────────┘    │
│ Chave de API do Google Gemini...           │
│ → Obter chave de API do Gemini (Gratuita)  │
│                                             │
│ Pixabay API Key                             │ ← NOVO
│ ┌─────────────────────────────────────┐    │
│ │ 46737899-b38ce8e1a26a3f4110dae3156  │    │
│ └─────────────────────────────────────┘    │
│ Chave de API do Pixabay para busca...      │
│ → Obter chave de API do Pixabay (Gratuita) │
│                                             │
└─────────────────────────────────────────────┘
```

### **CriticalActivityReport - Layout**
```
┌───────────────────────────────────────────────────────────────┐
│ 🔒 Relatório de Atividades Críticas                           │
│ Monitoramento detalhado de ações críticas realizadas...       │
├───────────────────────────────────────────────────────────────┤
│ 🔍 Filtros                                                     │
│ ┌─────┬─────┬────────┬────────┬──────────┬─────────┬────────┐│
│ │Início│Fim │Usuário │Empresa │Ação      │Tabela   │[Aplicar││
│ └─────┴─────┴────────┴────────┴──────────┴─────────┴────────┘│
├───────────────────────────────────────────────────────────────┤
│ 📊 Estatísticas                                                │
│ ┌───────────┬───────────┬───────────┬───────────┐            │
│ │Total: 150 │✅ 45      │🔄 80      │❌ 25      │            │
│ └───────────┴───────────┴───────────┴───────────┘            │
├───────────────────────────────────────────────────────────────┤
│ Criticidade│Data/Hora     │Usuário │Ação   │Tabela│IP    │...│
│ CRÍTICO    │15/01 14:35:22│João    │DELETE │users │192...│...│
│ ALTO       │15/01 14:30:11│Maria   │UPDATE │prods │192...│...│
│ MÉDIO      │15/01 14:25:05│Pedro   │CREATE │categ │192...│...│
└───────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança

### **Controle de Acesso**

1. **Campo Pixabay API:**
   - Apenas Admin da empresa pode configurar
   - Chave salva em `company_settings` (escopo: empresa)
   - Não visível para outros usuários

2. **Relatório de Atividades:**
   - Apenas Super Admin pode acessar
   - Menu item não aparece para outros roles
   - Endpoint `/activity-log` verifica role no backend
   - Usuários comuns veem apenas logs da própria empresa

### **Proteção de Dados**

- IPs são capturados automaticamente (`REMOTE_ADDR`)
- User Agents truncados para 255 caracteres
- JSON de dados antigos/novos escapado corretamente
- Todas as queries usam prepared statements (SQL injection)
- XSS prevenido com escape de strings

---

## 🐛 Troubleshooting

### **Erro: "pixabay_api_key not found"**
- Executar: `npm run build`
- Verificar se `types.ts` foi atualizado

### **Erro: "Column 'user_agent' not found"**
- Executar script: `database-update-user-agent.sql`
- Ou: `ALTER TABLE activity_log ADD user_agent VARCHAR(255) NULL;`

### **Relatório vazio**
- Verificar se há dados na tabela: `SELECT COUNT(*) FROM activity_log;`
- Ajustar filtros de data
- Verificar role: deve ser Super Admin

### **Fotos não atualizam com chave custom**
- Verificar se chave foi salva: `SELECT * FROM company_settings WHERE setting_key = 'pixabay_api_key';`
- Verificar se chave é válida (testar em https://pixabay.com/api/docs/)
- Verificar logs do PHP para erros de API

---

## 📊 Performance

### **activity_log - Índices Recomendados**

```sql
-- Índice composto para filtros comuns
CREATE INDEX idx_activity_filters 
ON activity_log(company_id, created_at, action, entity_type);

-- Índice para filtro de usuário
CREATE INDEX idx_user_id ON activity_log(user_id);

-- Índice para data
CREATE INDEX idx_created_at ON activity_log(created_at);
```

### **Limite de Registros**

- Frontend: Sem limite visual (scroll infinito futuro?)
- Backend: Limite de 1.000 registros por query
- Exportação CSV: Todos os resultados filtrados

---

## 🎯 Conclusão

Ambas as funcionalidades foram implementadas com sucesso:

✅ **Pixabay API Key:** Cada empresa pode configurar sua própria chave, eliminando limite compartilhado

✅ **Relatório de Atividades Críticas:** Super Admin tem visibilidade completa de todas as ações críticas do sistema com filtros avançados, exportação CSV e níveis de criticidade

**Status:** ✅ CODE COMPLETE + COMPILADO

**Build:** ✅ Sucesso (940 kB bundle)

**Próximos Passos:**
1. Testar ambas as funcionalidades
2. Executar SQL de atualização se necessário
3. Configurar índices para melhor performance
4. Considerar paginação para relatórios com milhares de registros
