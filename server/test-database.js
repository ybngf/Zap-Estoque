// Script para testar conexão direta com MySQL e validar login
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testDatabase() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA\n');
    console.log('=' .repeat(60));
    
    // 1. Verificar variáveis de ambiente
    console.log('\n📋 1. VARIÁVEIS DE AMBIENTE:');
    console.log('-'.repeat(60));
    console.log(`DB_HOST: ${process.env.DB_HOST || 'NÃO DEFINIDO'}`);
    console.log(`DB_USER: ${process.env.DB_USER || 'NÃO DEFINIDO'}`);
    console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'NÃO DEFINIDO'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME || 'NÃO DEFINIDO'}`);
    console.log(`PORT: ${process.env.PORT || 'NÃO DEFINIDO'}`);

    if (!process.env.DB_HOST) {
        console.log('\n❌ ERRO: Arquivo .env não encontrado ou variáveis não definidas!');
        console.log('📁 Procurando em:', join(__dirname, '..', '.env'));
        return;
    }

    let connection;

    try {
        // 2. Testar conexão
        console.log('\n🔌 2. TESTANDO CONEXÃO COM MYSQL:');
        console.log('-'.repeat(60));
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Conexão estabelecida com sucesso!');

        // 3. Listar tabelas
        console.log('\n📊 3. TABELAS NO BANCO:');
        console.log('-'.repeat(60));
        
        const [tables] = await connection.execute('SHOW TABLES');
        if (tables.length === 0) {
            console.log('❌ NENHUMA TABELA ENCONTRADA!');
            console.log('\n⚠️  SOLUÇÃO:');
            console.log('   Execute o arquivo: server/database/schema.sql');
            console.log('   Comando: mysql -u dona_estoqueg -p dona_estoqueg < server/database/schema.sql');
        } else {
            console.log(`✅ ${tables.length} tabelas encontradas:`);
            tables.forEach(table => {
                console.log(`   - ${Object.values(table)[0]}`);
            });
        }

        // 4. Verificar usuários
        console.log('\n👥 4. USUÁRIOS NA TABELA:');
        console.log('-'.repeat(60));
        
        try {
            const [users] = await connection.execute(
                'SELECT id, name, email, role, company FROM users'
            );

            if (users.length === 0) {
                console.log('❌ NENHUM USUÁRIO ENCONTRADO!');
                console.log('\n⚠️  SOLUÇÃO:');
                console.log('   Execute a parte de INSERT do schema.sql');
            } else {
                console.log(`✅ ${users.length} usuários encontrados:\n`);
                users.forEach(user => {
                    console.log(`   ID: ${user.id}`);
                    console.log(`   Nome: ${user.name}`);
                    console.log(`   Email: ${user.email}`);
                    console.log(`   Papel: ${user.role}`);
                    console.log(`   Empresa: ${user.company}`);
                    console.log('   ' + '-'.repeat(40));
                });
            }

            // 5. Testar login com credenciais padrão
            console.log('\n🔐 5. TESTE DE LOGIN:');
            console.log('-'.repeat(60));
            
            const testCredentials = [
                { email: 'admin@sistema.com', password: '123456' },
                { email: 'joao@empresa.com', password: '123456' },
                { email: 'maria@empresa.com', password: '123456' },
                { email: 'pedro@empresa.com', password: '123456' }
            ];

            for (const cred of testCredentials) {
                try {
                    const [result] = await connection.execute(
                        'SELECT id, name, email, role FROM users WHERE email = ? AND password = ?',
                        [cred.email, cred.password]
                    );

                    if (result.length > 0) {
                        console.log(`✅ ${cred.email} - LOGIN OK`);
                        console.log(`   → Usuário: ${result[0].name} (${result[0].role})`);
                    } else {
                        console.log(`❌ ${cred.email} - LOGIN FALHOU`);
                        
                        // Verificar se o email existe
                        const [emailCheck] = await connection.execute(
                            'SELECT password FROM users WHERE email = ?',
                            [cred.email]
                        );
                        
                        if (emailCheck.length > 0) {
                            console.log(`   → Email existe, mas senha não bate`);
                            console.log(`   → Senha no banco: ${emailCheck[0].password}`);
                            console.log(`   → Senha testada: ${cred.password}`);
                        } else {
                            console.log(`   → Email não existe no banco`);
                        }
                    }
                } catch (error) {
                    console.log(`❌ Erro ao testar ${cred.email}:`, error.message);
                }
            }

            // 6. Verificar estrutura da tabela users
            console.log('\n🏗️  6. ESTRUTURA DA TABELA USERS:');
            console.log('-'.repeat(60));
            
            const [columns] = await connection.execute(
                'DESCRIBE users'
            );
            
            columns.forEach(col => {
                console.log(`   ${col.Field.padEnd(15)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key}`);
            });

        } catch (error) {
            console.log('❌ Erro ao acessar tabela users:', error.message);
            console.log('\n⚠️  A tabela "users" provavelmente não existe.');
            console.log('   Execute: server/database/schema.sql');
        }

        // 7. Resumo e diagnóstico
        console.log('\n📝 7. DIAGNÓSTICO FINAL:');
        console.log('='.repeat(60));
        
        const [tableCount] = await connection.execute('SHOW TABLES');
        
        if (tableCount.length === 0) {
            console.log('❌ PROBLEMA: Banco vazio - execute schema.sql');
        } else {
            try {
                const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
                if (userCount[0].count === 0) {
                    console.log('❌ PROBLEMA: Tabelas existem mas sem dados - execute INSERTs do schema.sql');
                } else {
                    const [loginTest] = await connection.execute(
                        'SELECT id FROM users WHERE email = ? AND password = ?',
                        ['admin@sistema.com', '123456']
                    );
                    
                    if (loginTest.length > 0) {
                        console.log('✅ TUDO OK! Sistema pronto para usar!');
                        console.log('\n🎯 PRÓXIMO PASSO:');
                        console.log('   1. Execute: cd server && npm start');
                        console.log('   2. Execute: npm run dev (em outro terminal)');
                        console.log('   3. Acesse: http://localhost:5173');
                        console.log('   4. Login: admin@sistema.com / 123456');
                    } else {
                        console.log('❌ PROBLEMA: Usuários existem mas credenciais não batem');
                        console.log('   Verifique se as senhas estão corretas (texto puro, não hash)');
                    }
                }
            } catch (e) {
                console.log('❌ PROBLEMA: Erro ao verificar dados');
            }
        }

    } catch (error) {
        console.log('\n❌ ERRO DE CONEXÃO:');
        console.log('-'.repeat(60));
        console.log(`Código: ${error.code}`);
        console.log(`Mensagem: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 SOLUÇÃO:');
            console.log('   - MySQL não está rodando');
            console.log('   - Ou está em porta diferente da 3306');
            console.log('   - Verifique: netstat -an | findstr 3306');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 SOLUÇÃO:');
            console.log('   - Usuário ou senha incorretos');
            console.log('   - Verifique o arquivo .env');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 SOLUÇÃO:');
            console.log('   - Banco de dados não existe');
            console.log('   - Execute: CREATE DATABASE dona_estoqueg;');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão fechada.');
        }
    }

    console.log('\n' + '='.repeat(60));
}

// Executar
testDatabase().catch(console.error);
