# Correção - Log de Atividades (Página Branca)

## 🐛 Problema
O menu "Log de Atividades" dos administradores de empresa estava abrindo página branca.

## 🔍 Causa Raiz
O backend (api.php) estava retornando os dados com nomes de campos diferentes do que o frontend esperava:

### Backend retornava (snake_case):
```json
{
  "user_id": 1,
  "user_name": "João",
  "user_email": "joao@email.com",
  "action_type": "INSERT",
  "table_name": "products",
  "record_id": 123,
  "old_value": {},
  "new_value": {},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0",
  "created_at": "2024-01-01 10:00:00"
}
```

### Frontend esperava (camelCase):
```typescript
{
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: number;
  oldData: any;
  newData: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
```

## ✅ Solução
Ajustado o arquivo `public_html/api.php` na função `handleActivityLog()` (linhas ~1155-1170) para retornar os dados no formato camelCase:

```php
$logs[] = [
    'id' => (int)$row['id'],
    'userId' => (int)$row['user_id'],
    'userName' => $row['user_name'],
    'userEmail' => $row['user_email'],
    'companyId' => (int)$row['company_id'],
    'companyName' => $row['company_name'],
    'action' => $row['action'],           // ✅ era 'action_type'
    'entityType' => $row['entity_type'],  // ✅ era 'table_name'
    'entityId' => (int)$row['entity_id'], // ✅ era 'record_id'
    'oldData' => $row['old_data'] ? json_decode($row['old_data'], true) : null,  // ✅ era 'old_value'
    'newData' => $row['new_data'] ? json_decode($row['new_data'], true) : null,  // ✅ era 'new_value'
    'ipAddress' => $row['ip_address'] ?? '',       // ✅ era 'ip_address' (com 'N/A')
    'userAgent' => $row['user_agent'] ?? '',       // ✅ era 'user_agent' (com 'N/A')
    'createdAt' => $row['created_at']              // ✅ era 'created_at'
];
```

## 📋 Arquivos Modificados
1. `public_html/api.php` - Função `handleActivityLog()` (linha ~1155)
2. `components/Sidebar.tsx` - Permissão do menu "Log de Atividades" (linha 45)
3. Build atualizado em `public_html/assets/index-gikSOMji.js`

## 🧪 Como Testar
1. Faça login como administrador de empresa
2. Clique no menu "Log de Atividades"
3. A página deve carregar mostrando:
   - Lista de atividades da empresa
   - Filtros por ação, entidade, usuário e data
   - Detalhes completos de cada log

## 📝 Observações
- O endpoint já existia e estava funcional
- O componente frontend estava correto
- Era apenas uma incompatibilidade de nomenclatura de campos
- Super Admins continuam vendo logs de todas as empresas
- Admins de empresa veem apenas logs da própria empresa
- **Permissão atualizada:** Menu visível apenas para Admin ou superior (antes era Manager)

## 🔐 Hierarquia de Permissões
- **Employee (Funcionário):** Sem acesso ao Log de Atividades
- **Manager (Gerente):** Sem acesso ao Log de Atividades
- **Admin (Admin de Empresa):** ✅ Acesso ao Log de Atividades da própria empresa
- **Super Admin:** ✅ Acesso ao Log de Atividades de todas as empresas

## ⚠️ Deploy em Produção
Para atualizar o servidor donasalada.com/EstoqueGemini:

1. **Atualizar api.php:**
   ```bash
   # Substitua o arquivo api.php no servidor
   # Linha ~1155 da função handleActivityLog
   ```

2. **Atualizar arquivos do build:**
   ```bash
   # Copie os arquivos da pasta public_html/* para o servidor
   # Especialmente: public_html/assets/index-gikSOMji.js
   ```

3. **Verificar permissões:**
   - activity_log table deve existir
   - Usuários Admin e Super Admin devem ter acesso
   - Managers e Employees NÃO terão acesso ao menu

---
**Data da correção:** ${new Date().toLocaleDateString('pt-BR')}
**Build:** 951.45 kB (gzip: 241.68 kB)
**Última atualização:** Permissão alterada para Admin apenas
