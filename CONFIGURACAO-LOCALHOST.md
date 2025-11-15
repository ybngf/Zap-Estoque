# 🔧 Configuração MySQL Localhost

## ✅ Sistema Reconfigurado

O sistema foi reconfigurado para usar MySQL rodando em **localhost**.

### 📝 Novas Credenciais

```
Host:     localhost
Usuário:  root
Senha:    (vazio)
Banco:    dona_estoqueg
```

---

## 📋 Arquivos Atualizados

### 1. Arquivos de Configuração

✅ **`public_html/config.php`**
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');
```

✅ **`public_html/api.php`**
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dona_estoqueg');
```

### 2. Novos Arquivos Criados

✅ **`public_html/test-connection-local.php`**
- Testa a conexão com o MySQL local
- Verifica se o banco existe
- Lista todas as tabelas
- Verifica tabelas obrigatórias

✅ **`public_html/setup-database.php`**
- Cria o banco de dados automaticamente
- Cria todas as tabelas necessárias
- Insere dados de exemplo
- Cria usuário admin padrão

✅ **`database/schema.sql`**
- Script SQL completo para criar banco
- Pode ser importado via phpMyAdmin ou linha de comando

---

## 🚀 Como Configurar o Sistema

### Opção 1: Setup Automático via PHP (RECOMENDADO)

1. **Certifique-se que o MySQL está rodando**
   - XAMPP: Inicie o módulo MySQL
   - WAMP: Inicie o serviço MySQL
   - Outro: `mysql.server start` ou verifique serviço

2. **Execute o script de setup**
   
   Acesse no navegador:
   ```
   http://localhost/EstoqueGemini/public_html/setup-database.php
   ```
   
   Ou se estiver em outra porta/caminho, ajuste a URL.

3. **Verifique o resultado**
   
   Deve mostrar:
   ```
   ✅ BANCO DE DADOS CONFIGURADO COM SUCESSO!
   
   Credenciais de acesso:
     Email: admin@estoque.com
     Senha: admin123
   ```

### Opção 2: Setup Manual via SQL

1. **Abra o MySQL**
   ```bash
   mysql -u root -p
   ```
   (Pressione Enter quando pedir senha, se a senha estiver vazia)

2. **Execute o script SQL**
   ```bash
   source D:/Estoque Gemini/database/schema.sql
   ```
   
   Ou importe via phpMyAdmin:
   - Acesse: http://localhost/phpmyadmin
   - Clique em "Importar"
   - Selecione o arquivo `database/schema.sql`
   - Clique em "Executar"

### Opção 3: Setup Manual via phpMyAdmin

1. **Acesse phpMyAdmin**
   ```
   http://localhost/phpmyadmin
   ```

2. **Crie o banco de dados**
   - Clique em "Novo" (New)
   - Nome: `dona_estoqueg`
   - Collation: `utf8mb4_unicode_ci`
   - Clique em "Criar"

3. **Importe o SQL**
   - Selecione o banco `dona_estoqueg`
   - Clique em "Importar"
   - Escolha o arquivo `database/schema.sql`
   - Clique em "Executar"

---

## 🧪 Teste a Configuração

### Teste 1: Verificar Conexão

Acesse:
```
http://localhost/EstoqueGemini/public_html/test-connection-local.php
```

**Resultado esperado:**
```
✅ Conectado ao servidor MySQL!
✅ Banco de dados existe!
✅ Todas as tabelas necessárias existem!
```

### Teste 2: Testar API

Acesse:
```
http://localhost/EstoqueGemini/public_html/api.php/users
```

**Resultado esperado:**
```json
[
  {
    "id": 1,
    "name": "Administrador",
    "email": "admin@estoque.com",
    "role": "Super Admin",
    "company": "Empresa Principal"
  }
]
```

### Teste 3: Testar a Interface

1. **Inicie o servidor de desenvolvimento**
   
   Abra o terminal na pasta do projeto:
   ```bash
   cd "D:\Estoque Gemini"
   npm run dev
   ```

2. **Acesse a aplicação**
   ```
   http://localhost:5173
   ```

3. **Faça login**
   - Email: `admin@estoque.com`
   - Senha: `admin123`

4. **Teste as funcionalidades**
   - ✅ Produtos: Listar, criar, editar, deletar
   - ✅ Ajuste de estoque: Botões + e -
   - ✅ Movimentações: Ver histórico
   - ✅ Categorias, Fornecedores, Usuários

---

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas:

1. **companies** - Empresas
2. **users** - Usuários do sistema
3. **categories** - Categorias de produtos
4. **suppliers** - Fornecedores
5. **products** - Produtos
6. **stock_movements** - Movimentações de estoque

### Dados de Exemplo:

- ✅ 1 Empresa: "Empresa Principal"
- ✅ 1 Usuário: admin@estoque.com (senha: admin123)
- ✅ 3 Categorias: Eletrônicos, Alimentos, Vestuário
- ✅ 2 Fornecedores: Fornecedor A, Fornecedor B
- ✅ 3 Produtos: Notebook Dell, Mouse Wireless, Arroz Integral

---

## 🔧 Configuração do Vite

Verifique se o arquivo `vite.config.ts` está configurado corretamente para o ambiente local:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/EstoqueGemini/public_html/api.php')
      }
    }
  }
});
```

Se não estiver, o caminho da API precisa ser ajustado no `services/api.ts`.

---

## 🆘 Solução de Problemas

### Erro: "Can't connect to MySQL server"

**Causa:** MySQL não está rodando.

**Solução:**
- XAMPP: Inicie o módulo MySQL no painel
- WAMP: Inicie todos os serviços
- Verifique: `mysql -u root -p`

### Erro: "Access denied for user 'root'"

**Causa:** Senha do root está incorreta.

**Solução:**
1. Verifique a senha do MySQL no XAMPP/WAMP
2. Atualize em `config.php` e `api.php`:
   ```php
   define('DB_PASS', 'sua_senha_aqui');
   ```

### Erro: "Database 'dona_estoqueg' doesn't exist"

**Causa:** Banco de dados não foi criado.

**Solução:**
- Execute: `setup-database.php`
- Ou crie manualmente via phpMyAdmin

### Erro: "Table doesn't exist"

**Causa:** Tabelas não foram criadas.

**Solução:**
- Execute: `setup-database.php`
- Ou importe: `database/schema.sql`

### API retorna erro CORS

**Causa:** Configuração de CORS no PHP.

**Solução:**
O `api.php` já tem os headers CORS configurados:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

---

## ✅ Checklist de Configuração

- [ ] 1. MySQL rodando (XAMPP/WAMP)
- [ ] 2. Arquivos config.php e api.php atualizados
- [ ] 3. Banco de dados criado (via setup-database.php)
- [ ] 4. Teste de conexão passou (test-connection-local.php)
- [ ] 5. API respondendo (/api.php/users)
- [ ] 6. npm run dev executado
- [ ] 7. Login funcionando (admin@estoque.com / admin123)
- [ ] 8. Todas as funcionalidades testadas

---

## 🎯 Próximos Passos

1. **Execute o setup:**
   ```
   http://localhost/EstoqueGemini/public_html/setup-database.php
   ```

2. **Verifique a conexão:**
   ```
   http://localhost/EstoqueGemini/public_html/test-connection-local.php
   ```

3. **Inicie o frontend:**
   ```bash
   cd "D:\Estoque Gemini"
   npm run dev
   ```

4. **Acesse a aplicação:**
   ```
   http://localhost:5173
   ```

5. **Faça login:**
   - Email: admin@estoque.com
   - Senha: admin123

---

## 📝 Observações

- ✅ Senha do root está vazia (padrão XAMPP/WAMP)
- ✅ Charset UTF-8 configurado (suporta acentos)
- ✅ Autocommit habilitado no api.php
- ✅ Todos os tipos de movimentação em português ('Entrada', 'Saída', 'Ajuste')
- ✅ Dados de exemplo incluídos para testes

**Sistema pronto para uso em ambiente local! 🚀**
