import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config({ quiet: true });

const { Pool, types } = pkg;

// para que a serialização JSON não converta a data para clientes em fusos horários diferentes de UTC.
// Retorna as colunas DATE (OID 1082) como strings simples no formato 'YYYY-MM-DD', em vez de objetos Date do JavaScript
types.setTypeParser(1082, (val) => val);

// O Neon exige SSL; um Postgres local normalmente não usa (DB_SSL=false)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
    console.error('Unexpected Postgres error:', err);
});

export default pool;
