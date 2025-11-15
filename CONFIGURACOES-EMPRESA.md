# Sistema de Configurações por Empresa

## Visão Geral

Sistema completo de configurações específicas por empresa, permitindo que cada Admin configure parâmetros personalizados para sua empresa, incluindo chave API do Gemini própria, prefixos de documentos, taxas, e informações da empresa.

## Arquitetura de Configurações

### 3 Níveis de Acesso

1. **Configurações do Sistema** (Super Admin apenas)
   - Menu: "Config. Sistema"
   - Escopo: Global para todo o sistema
   - Configurações: Nome do sistema, logo global, API key padrão

2. **Configurações da Empresa** (Admin de cada empresa) ✨ NOVO
   - Menu: "Configurações"
   - Escopo: Específico para cada empresa
   - Configurações: API key da empresa, impostos, documentos, alertas, info da empresa

3. **Visualização** (Todos os usuários)
   - Todos podem VER as configurações de sua empresa
   - Apenas Admin/SuperAdmin podem EDITAR

## Banco de Dados

### Tabela: company_settings

```sql
CREATE TABLE company_settings (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  company_id INT UNSIGNED NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  UNIQUE KEY unique_company_setting (company_id, setting_key),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_company_id (company_id)
);
```

### Instalação

```bash
php install-company-settings.php
```

**Resultado da instalação:**
- ✅ Tabela criada
- ✅ 36 configurações criadas (12 por empresa)
- ✅ 3 empresas configuradas

## 12 Configurações por Empresa

### 1. Integração com IA
- **gemini_api_key**: Chave API do Google Gemini específica da empresa
  - Prioridade: Chave da empresa > Chave do sistema > Variável de ambiente
  - Permite billing separado por empresa
  - Campo tipo password com link para obter chave

### 2. Documentos
- **invoice_prefix**: Prefixo para notas (ex: "INV-001-")
- **default_payment_terms**: Prazo de pagamento padrão em dias (ex: 30)

### 3. Impostos e Finanças
- **tax_rate**: Taxa de imposto padrão em % (ex: 18)
- **company_tax_id**: CNPJ/CPF da empresa

### 4. Alertas e Notificações
- **low_stock_alert_enabled**: Habilitar alertas de estoque baixo (checkbox)
- **email_notifications_enabled**: Habilitar notificações por email (checkbox)

### 5. Informações da Empresa
- **company_logo_url**: URL da logo (com preview ao vivo)
- **company_address**: Endereço completo (textarea)
- **company_phone**: Telefone de contato
- **company_email**: Email de contato
- **company_website**: Website da empresa

## API

### Endpoints

#### GET /api.php?endpoint=company-settings
- **Acesso**: Todos os usuários autenticados
- **Retorna**: Configurações da empresa do usuário atual
- **Filtro automático**: `WHERE company_id = currentUser.company_id`
- **Multi-tenant safe**: Usuários não veem configurações de outras empresas

#### PUT /api.php?endpoint=company-settings
- **Acesso**: Admin e Super Admin apenas
- **Body**: `{ "setting_key": "value", ... }`
- **Ação**: Atualiza ou cria configurações para a empresa do usuário
- **Log**: Registra todas as alterações em `activity_log`

### Exemplos de Uso

```typescript
// Buscar configurações da empresa
const settings = await api.getCompanySettings();
console.log(settings.gemini_api_key.value); // API key da empresa

// Atualizar configurações (Admin apenas)
await api.updateCompanySettings({
  gemini_api_key: 'sua-chave-aqui',
  tax_rate: '18',
  invoice_prefix: 'NF-2024-'
});
```

## Frontend

### Componente: CompanySettings.tsx (468 linhas)

**Características:**
- 5 seções em grid responsivo (2 colunas)
- Validação de role: Admin/SuperAdmin pode editar
- Preview de logo ao vivo
- Mensagens de sucesso/erro com auto-clear (5s)
- Botões sticky no rodapé (Salvar/Cancelar)
- Estados de loading
- Campos desabilitados para não-Admins

**Seções:**
1. 🤖 Integração com IA (gemini_api_key + link para obter)
2. 📄 Documentos (prefixo, prazo pagamento)
3. 💰 Impostos (taxa, CNPJ)
4. 🔔 Alertas (checkboxes para estoque e email)
5. 🏢 Info da Empresa (logo, endereço, contato) - largura total

### Menu

**Antes:**
- "Configurações" → settings (SuperAdmin)

**Depois:**
- "Configurações" → company-settings (Admin e acima) ✨
- "Config. Sistema" → settings (SuperAdmin apenas)

### Prioridade de API Key do Gemini

O sistema agora verifica a API key nesta ordem:

```typescript
// services/geminiService.ts - getApiKey()
1. Company Settings (gemini_api_key) ← Específico da empresa
2. System Settings (gemini_api_key)  ← Fallback global
3. Environment Variable (VITE_GEMINI_API_KEY) ← Dev fallback
4. Error → "Configure na empresa ou sistema"
```

**Console logs:**
- ✅ Using API key from company settings
- ✅ Using API key from system settings
- ✅ Using API key from environment variable

## Segurança Multi-Tenant

### Isolamento por Empresa

```php
// Em handleCompanySettings()
$currentUser = getCurrentUser($conn);
$companyId = $currentUser['company_id']; // Filtro automático

// GET: WHERE company_id = $companyId
// PUT: AND company_id = $companyId
```

**Proteções:**
- Usuário A (empresa 1) NÃO consegue ver/editar configs da empresa 2
- Foreign key `ON DELETE CASCADE`: Se empresa é deletada, configs vão junto
- Índice em `company_id` para performance em queries multi-tenant

### Controle de Acesso

| Usuário | Ver Configs | Editar Configs |
|---------|-------------|----------------|
| Super Admin | ✅ Todas | ✅ Todas |
| Admin | ✅ Sua empresa | ✅ Sua empresa |
| Manager | ✅ Sua empresa | ❌ Não |
| Employee | ✅ Sua empresa | ❌ Não |

## Arquivos Modificados/Criados

### Novos Arquivos
- ✨ `database/company-settings-schema.sql` (115 linhas)
- ✨ `install-company-settings.php` (115 linhas)
- ✨ `components/CompanySettings.tsx` (468 linhas)

### Arquivos Modificados
- `types.ts` (+24 linhas)
  - CompanySettings interface
  - CompanySettingItem interface
  - CompanySettingsResponse type

- `public_html/api.php` (+118 linhas)
  - case 'company-settings' no router
  - handleCompanySettings() function

- `services/api.ts` (+13 linhas)
  - getCompanySettings()
  - updateCompanySettings()

- `services/geminiService.ts` (~35 linhas modificadas)
  - getApiKey() com prioridade de company settings

- `App.tsx` (+4 linhas)
  - import CompanySettings
  - case 'company-settings' no renderView()

- `components/Sidebar.tsx` (+2 linhas, 1 modificada)
  - Novo item "Configurações" (company-settings, Admin+)
  - Renomeado "Configurações" → "Config. Sistema" (settings, SuperAdmin)

## Build

```bash
npm run build
```

**Resultado:**
- ✅ 729 módulos transformados
- ✅ Bundle: 915.16 kB
- ✅ Gzip: 234.45 kB
- ✅ Tempo: 6.09s
- ✅ Sem erros TypeScript

## Workflow de Teste

1. **Login como Admin** (qualquer empresa)
2. Verificar menu lateral tem "Configurações" visível
3. Clicar em "Configurações"
4. Verificar 5 seções carregadas com valores padrão
5. **Configurar API Key do Gemini**:
   - Clicar no campo "Chave API do Google Gemini"
   - Inserir chave (ou usar link para obter)
   - Clicar "Salvar Configurações"
   - Verificar mensagem: "✅ Configurações salvas com sucesso!"
6. **Testar Processamento de Nota**:
   - Ir para "Processar Nota"
   - Upload de foto de nota fiscal
   - Verificar no console: "✅ Using API key from company settings"
   - Confirmar processamento funciona
7. **Login como SuperAdmin**:
   - Verificar menu tem "Configurações" E "Config. Sistema"
   - Acessar ambas as páginas
8. **Login como Employee**:
   - Verificar "Configurações" NÃO aparece no menu
   - Ou aparece mas campos desabilitados (dependendo da implementação)

## Casos de Uso

### Caso 1: Multi-Tenant SaaS
- Empresa A usa chave API própria → billing separado
- Empresa B usa chave do sistema → billing compartilhado
- Empresa C sem chave → erro pedindo configuração

### Caso 2: Personalização por Empresa
- Empresa A: Prefixo "NFSA-", Taxa 12%
- Empresa B: Prefixo "NFSB-", Taxa 18%
- Cada uma vê apenas suas configs

### Caso 3: Delegação de Administração
- SuperAdmin não precisa configurar tudo
- Admins de cada empresa configuram seus parâmetros
- SuperAdmin mantém controle de configs globais

## Próximos Passos Possíveis

- [ ] Adicionar validação de formato para CNPJ
- [ ] Implementar teste de API key (botão "Testar Conexão")
- [ ] Adicionar mais configurações conforme necessidade
- [ ] Dashboard de uso de API por empresa
- [ ] Backup automático de configurações
- [ ] Histórico de alterações em configurações
- [ ] Notificações por email quando Admin altera configs críticas

## Conclusão

Sistema completo de configurações por empresa implementado com sucesso! Permite multi-tenancy real com billing separado por API key, personalização de documentos e impostos, e delegação de administração para Admins de cada empresa. 🎉
