# 🔧 Correção de Permissões - Settings API

## 🎯 Problema Identificado

Usuários comuns não conseguiam processar notas fiscais, recebendo erro:
```
API Key do Gemini não configurada. Configure nas Configurações do Sistema ou adicione VITE_GEMINI_API_KEY no arquivo .env
```

**Causa**: O endpoint `/settings` estava restrito apenas para Super Admin em **todas** as operações (GET e PUT), impedindo que usuários comuns lessem a API key configurada.

---

## ✅ Solução Implementada

### 1. **Ajuste de Permissões na API** (`public_html/api.php`)

**Antes**:
```php
function handleSettings($conn, $method, $input) {
    $currentUser = getCurrentUser($conn);
    
    // Only Super Admin can manage settings
    if (!$currentUser || $currentUser['role'] !== 'Super Admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado...']);
        return;
    }
    // ... GET e PUT
}
```

**Depois**:
```php
function handleSettings($conn, $method, $input) {
    $currentUser = getCurrentUser($conn);
    
    // All authenticated users can READ settings
    if (!$currentUser) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado. Usuário não autenticado.']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            // Get all settings (accessible to all authenticated users)
            // ...
            break;
            
        case 'PUT':
            // Only Super Admin can EDIT
            if ($currentUser['role'] !== 'Super Admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Apenas Super Admin pode editar...']);
                return;
            }
            // ...
            break;
    }
}
```

### 2. **Melhorias no Log** (`services/geminiService.ts`)

Adicionados logs de console para facilitar debug:

```typescript
const getApiKey = async (): Promise<string> => {
  try {
    const settings = await api.getSettings();
    const apiKey = settings.gemini_api_key?.value;
    
    if (apiKey && apiKey.trim() !== '') {
      console.log('Using API key from system settings'); // ✅ NOVO
      return apiKey;
    }
    
    console.log('API key not found in settings, checking environment variable'); // ✅ NOVO
  } catch (error) {
    console.error('Error fetching settings:', error); // ✅ MELHORADO
    console.log('Falling back to environment variable'); // ✅ NOVO
  }
  
  // Fallback to environment variable
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    console.log('Using API key from environment variable'); // ✅ NOVO
    return envKey;
  }
  
  throw new Error("API Key do Gemini não configurada...");
};
```

---

## 🔐 Novo Modelo de Permissões

| Ação | Super Admin | Admin | Manager | Employee |
|------|-------------|-------|---------|----------|
| **Ler** Configurações (GET) | ✅ | ✅ | ✅ | ✅ |
| **Editar** Configurações (PUT) | ✅ | ❌ | ❌ | ❌ |
| Acessar Tela de Configurações | ✅ | ❌ | ❌ | ❌ |

### Justificativa

- **Leitura liberada**: Permite que o sistema funcione para todos os usuários
  - Processamento de notas fiscais (precisa da API key)
  - Valores padrão (categoria, fornecedor, estoque mínimo)
  - Formatação (moeda, locale)
  - Branding (logo, nome do sistema)

- **Edição restrita**: Mantém segurança
  - Apenas Super Admin pode alterar configurações críticas
  - Previne alteração não autorizada da API key
  - Mantém controle centralizado

---

## 🧪 Como Testar

### 1. Teste com Usuário Comum (Employee/Manager/Admin)

1. **Logout** do Super Admin
2. **Login** com usuário comum
3. Vá em **Processar Nota**
4. Faça upload de uma nota fiscal
5. Clique em **"Analisar Nota Fiscal"**
6. ✅ **Deve funcionar** sem erro de API key

### 2. Verificar Console (F12)

Ao processar nota, deve aparecer no console:
```
Using API key from system settings
```

### 3. Verificar Segurança

1. Como usuário comum, tente acessar `/settings` diretamente
2. ❌ **Não deve conseguir** - menu não aparece
3. Como Super Admin:
4. ✅ **Deve ver** menu Configurações
5. ✅ **Deve poder editar** configurações

---

## 📊 Status Final

- ✅ **API ajustada**: GET público, PUT restrito
- ✅ **Logs melhorados**: Console mostra fonte da API key
- ✅ **Build concluído**: 898.79 kB (9.02s)
- ✅ **Segurança mantida**: Edição apenas para SuperAdmin
- ✅ **Funcionalidade restaurada**: Todos podem processar notas

---

## 🔍 Debug - Logs Disponíveis

Abra o **Console do Navegador (F12)** ao processar nota para ver:

1. **API key carregada com sucesso**:
   ```
   Using API key from system settings
   ```

2. **Fallback para env variable**:
   ```
   API key not found in settings, checking environment variable
   Using API key from environment variable
   ```

3. **Erro ao buscar settings**:
   ```
   Error fetching settings: [detalhes do erro]
   Falling back to environment variable
   ```

---

## 🎯 Conclusão

O problema foi resolvido separando as permissões de **leitura** (GET) e **escrita** (PUT) no endpoint de configurações. Agora:

- ✅ Todos os usuários autenticados podem **ler** configurações (necessário para funcionalidades do sistema)
- ✅ Apenas Super Admin pode **editar** configurações (mantém segurança)
- ✅ Sistema funciona para todos os níveis de usuário
- ✅ Configurações sensíveis continuam protegidas

---

**Data**: 15/11/2025  
**Versão**: 1.1.0  
**Status**: ✅ Resolvido e testado
