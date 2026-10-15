// Cria as tabelas a partir de sql/schema.sql.
// Uso: npm run migrate          -> cria o que ainda não existe
//      npm run migrate:reset    -> APAGA todas as tabelas e recria (perde os dados)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');

export const migrate = async ({ reset = false } = {}) => {
    if (reset) {
        await pool.query('DROP TABLE IF EXISTS ai_insights, budgets, transactions, categories, users CASCADE');
    }
    await pool.query(fs.readFileSync(schemaPath, 'utf8'));
};

// Executa apenas quando chamado pela linha de comando (e não quando importado pelos testes)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const reset = process.argv.includes('--reset');
    try {
        await migrate({ reset });
        console.log(reset ? 'Banco recriado com sucesso.' : 'Schema aplicado com sucesso.');
    } catch (err) {
        console.error('Falha na migração:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}
