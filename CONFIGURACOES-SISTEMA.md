# ⚙️ Sistema de Configurações - Guia Completo

## 🎯 Funcionalidade

O sistema de configurações permite que o **Super Admin** personalize completamente o sistema através de uma interface amigável, incluindo:
- 🎨 Nome do sistema e logomarca
- 🔌 API Key do Google Gemini
- 📦 Valores padrão para novos produtos
- 🌍 Formatação e localização
- 🔒 Configurações de segurança
- 🏢 Informações da empresa

---

## 📥 Instalação

### 1. Criar Tabela no Banco de Dados

Execute o SQL abaixo no seu banco de dados MySQL:

```sql
-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Inserir configurações padrão
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('system_name', 'Estoque Gemini', 'Nome do sistema exibido no cabeçalho e login'),
('system_logo_url', '', 'URL da logomarca do sistema (deixe vazio para usar padrão)'),
('gemini_api_key', '', 'Chave de API do Google Gemini para processamento de notas fiscais'),
('default_category_id', '1', 'ID da categoria padrão para novos produtos'),
('default_supplier_id', '1', 'ID do fornecedor padrão para novos produtos'),
('min_stock_default', '10', 'Estoque mínimo padrão para novos produtos'),
('currency_symbol', 'R$', 'Símbolo da moeda'),
('currency_locale', 'pt-BR', 'Locale para formatação de valores'),
('enable_invoice_processing', '1', 'Habilitar processamento de notas fiscais (0=não, 1=sim)'),
('enable_activity_log', '1', 'Habilitar log de atividades (0=não, 1=sim)'),
('items_per_page', '50', 'Número de itens por página nas tabelas'),
('session_timeout_minutes', '480', 'Tempo de sessão em minutos (8 horas = 480)'),
('company_website', '', 'Website da empresa'),
('company_email', '', 'Email de contato'),
('company_phone', '', 'Telefone de contato')
ON DUPLICATE KEY UPDATE setting_key=setting_key;
```

**Ou use o arquivo SQL pronto:**
```bash
mysql -u seu_usuario -p seu_banco < database/settings-schema.sql
```

### 2. Verificar Permissões

Apenas usuários com role **`Super Admin`** podem acessar as configurações.

Para criar/verificar um usuário Super Admin:
```sql
-- Verificar Super Admins
SELECT id, name, email, role FROM users WHERE role = 'Super Admin';

-- Promover usuário existente para Super Admin
UPDATE users SET role = 'Super Admin' WHERE email = 'seu@email.com';
```

---

## 🚀 Como Usar

### 1. Acessar Configurações

1. Faça login como **Super Admin**
2. No menu lateral, clique em **⚙️ Configurações**
3. A página de configurações será aberta

### 2. Seções de Configuração

#### 🎨 **Aparência do Sistema**
- **Nome do Sistema**: Nome exibido no header, sidebar e login
- **URL da Logomarca**: Link para imagem da logo (PNG, JPG, SVG)
  - Exibe preview automático
  - Se vazio, usa o nome do sistema como texto

#### 🔌 **Integrações**
- **Google Gemini API Key**: Chave para processamento de notas fiscais
  - [Obter chave aqui](https://makersuite.google.com/app/apikey)
  - Campo tipo password para segurança
- **Habilitar processamento de notas**: Liga/desliga funcionalidade
- **Habilitar log de atividades**: Liga/desliga auditoria

#### 📦 **Padrões de Produtos**
- **Categoria Padrão (ID)**: Categoria usada em produtos criados por nota fiscal
- **Fornecedor Padrão (ID)**: Fornecedor usado em produtos criados por nota fiscal
- **Estoque Mínimo Padrão**: Valor inicial para novos produtos

#### 🌍 **Formatação e Localização**
- **Símbolo da Moeda**: R$, $, €, etc.
- **Locale de Formatação**: pt-BR, en-US, etc.
- **Itens por Página**: Paginação de tabelas

#### 🔒 **Segurança**
- **Timeout de Sessão**: Tempo em minutos antes de deslogar

#### 🏢 **Informações da Empresa**
- Website, Email e Telefone de contato

### 3. Salvar Alterações

1. Edite os campos desejados
2. Clique em **"Salvar Configurações"**
3. Aguarde a confirmação de sucesso
4. **Recarregue a página** para ver as mudanças aplicadas

---

## 🎨 Personalização Visual

### Exemplo: Trocar Nome e Logo

**Antes:**
- Nome: "Estoque Gemini"
- Logo: Texto gradiente

**Depois:**
1. Acesse **Configurações**
2. Em "Nome do Sistema", digite: `Minha Empresa`
3. Em "URL da Logomarca", cole: `https://exemplo.com/logo.png`
4. Clique em **Salvar**
5. **Recarregue** a página

**Resultado:**
- Sidebar: Mostra sua logo
- Login: Mostra sua logo
- Nome aparece em todos os lugares

---

## 🔧 Integração com Gemini AI

### Configurar API Key

1. **Obter chave:**
   - Acesse: https://makersuite.google.com/app/apikey
   - Faça login com Google
   - Clique "Create API Key"
   - Copie a chave (começa com `AIza...`)

2. **Configurar no sistema:**
   - Vá em **Configurações**
   - Cole a chave em "Google Gemini API Key"
   - Marque "Habilitar processamento de notas fiscais"
   - Clique em **Salvar**

3. **Testar:**
   - Vá em **Processar Nota**
   - Faça upload de uma nota fiscal
   - Clique em "Analisar Nota Fiscal"
   - Deve detectar os itens automaticamente

---

## 📊 Valores Padrão Inteligentes

### Como Funcionam

Quando você processa uma nota fiscal e cria um **novo produto**:

1. **Categoria**: Usa o ID configurado em `default_category_id`
2. **Fornecedor**: Usa o ID configurado em `default_supplier_id`
3. **Estoque Mínimo**: Usa o valor em `min_stock_default`

### Configurar IDs Corretos

**Encontrar ID da Categoria:**
```sql
SELECT id, name FROM categories;
```

**Encontrar ID do Fornecedor:**
```sql
SELECT id, name FROM suppliers;
```

**Atualizar nas Configurações:**
1. Anote os IDs desejados
2. Vá em **Configurações** → **Padrões de Produtos**
3. Digite os IDs corretos
4. Salve

---

## 🔐 Segurança

### Proteção de API Key

- ✅ Armazenada no banco de dados
- ✅ Transmitida via HTTPS
- ✅ Campo tipo password na interface
- ✅ Apenas Super Admin pode visualizar/editar
- ✅ Logs de alteração registrados

### Permissões

| Ação | Super Admin | Admin | Manager | Employee |
|------|-------------|-------|---------|----------|
| Ver Configurações | ✅ | ❌ | ❌ | ❌ |
| Editar Configurações | ✅ | ❌ | ❌ | ❌ |
| Ver API Key | ✅ | ❌ | ❌ | ❌ |

---

## 🐛 Solução de Problemas

### Erro: "Tabela não encontrada"

**Problema**: Tabela `system_settings` não existe

**Solução**:
```bash
mysql -u usuario -p banco < database/settings-schema.sql
```

### Erro: "Acesso negado"

**Problema**: Usuário não é Super Admin

**Solução**:
```sql
UPDATE users SET role = 'Super Admin' WHERE email = 'seu@email.com';
```

### Logo não aparece

**Problemas possíveis**:
1. URL incorreta → Verifique o link
2. Imagem bloqueada por CORS → Use URL pública
3. URL não é HTTPS → Em produção, use HTTPS

**Solução**:
- Use serviços como Imgur, Cloudinary
- Ou coloque a imagem em `public_html/assets/`
- Use URL completa: `https://seusite.com/assets/logo.png`

### Configurações não salvam

**Verifique**:
1. Console do navegador (F12) para erros
2. Permissões do usuário
3. Conexão com banco de dados

---

## 📝 Lista de Configurações

| Chave | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `system_name` | string | "Estoque Gemini" | Nome exibido no sistema |
| `system_logo_url` | string | "" | URL da logomarca |
| `gemini_api_key` | string | "" | API Key do Google Gemini |
| `default_category_id` | number | 1 | Categoria padrão |
| `default_supplier_id` | number | 1 | Fornecedor padrão |
| `min_stock_default` | number | 10 | Estoque mínimo padrão |
| `currency_symbol` | string | "R$" | Símbolo da moeda |
| `currency_locale` | string | "pt-BR" | Locale de formatação |
| `enable_invoice_processing` | 0/1 | 1 | Processar notas fiscais |
| `enable_activity_log` | 0/1 | 1 | Log de atividades |
| `items_per_page` | number | 50 | Itens por página |
| `session_timeout_minutes` | number | 480 | Timeout da sessão |
| `company_website` | string | "" | Site da empresa |
| `company_email` | string | "" | Email de contato |
| `company_phone` | string | "" | Telefone de contato |

---

## 🎯 Casos de Uso

### 1. White Label Completo

**Objetivo**: Personalizar para cada cliente

**Passos**:
1. Configure nome único do cliente
2. Adicione logo do cliente
3. Ajuste informações de contato
4. Configure valores padrão específicos

### 2. Multi-tenant

**Objetivo**: Mesmo sistema, múltiplas empresas

**Nota**: Configurações são globais (todas as empresas veem as mesmas). Para configurações por empresa, seria necessário adicionar `company_id` na tabela.

### 3. Ambiente de Desenvolvimento vs Produção

**Desenvolvimento**:
- Nome: "Sistema DEV"
- API Key: Chave de teste

**Produção**:
- Nome: "Sistema de Produção"
- API Key: Chave de produção

---

## 🔄 Atualizações Futuras

### Possíveis Melhorias

1. **Upload de Logo**: Upload direto em vez de URL
2. **Temas de Cores**: Personalizar cores do sistema
3. **Configurações por Empresa**: Cada empresa com suas configurações
4. **Backup de Configurações**: Export/import de configurações
5. **Histórico de Mudanças**: Audit trail completo
6. **Configurações Avançadas**: SMTP, notificações, etc.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia
2. Consulte os logs do sistema
3. Verifique o console do navegador
4. Revise as permissões do usuário

---

✨ **Sistema de Configurações desenvolvido para máxima flexibilidade e segurança**
