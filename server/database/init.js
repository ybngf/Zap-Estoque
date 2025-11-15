import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '..', '..', '.env');
console.log('📁 Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Read SQL file
    const sqlFile = join(__dirname, 'schema.sql');
    const sql = await readFile(sqlFile, 'utf8');

    console.log('📝 Executing SQL schema...');
    await connection.query(sql);

    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('📋 Default users created:');
    console.log('  - admin@sistema.com / 123456 (Super Admin)');
    console.log('  - joao@empresa.com / 123456 (Admin)');
    console.log('  - maria@empresa.com / 123456 (Manager)');
    console.log('  - pedro@empresa.com / 123456 (Employee)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
