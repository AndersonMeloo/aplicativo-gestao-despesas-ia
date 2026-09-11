import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool, types } = pkg;

// para que a serialização JSON não converta a data para clientes em fusos horários diferentes de UTC.
// Retorna as colunas DATE (OID 1082) como strings simples no formato 'YYYY-MM-DD', em vez de objetos Date do JavaScript
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', () => {
    console.error('Unexpected Postgres error:', err);
    process.exit(-1);
});

export default pool;