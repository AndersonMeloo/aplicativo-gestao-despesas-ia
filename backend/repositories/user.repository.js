import pool from '../db.js';

const PUBLIC_FIELDS = 'id, name, email, currency';

// `db` permite usar o mesmo client dentro de uma transação SQL (BEGIN/COMMIT)
export const create = async ({ name, email, passwordHash, currency }, db = pool) => {
    const { rows } = await db.query(
        `INSERT INTO users (name, email, password_hash, currency)
         VALUES ($1, $2, $3, $4)
         RETURNING ${PUBLIC_FIELDS}`,
        [name, email, passwordHash, currency]
    );
    return rows[0];
};

// Inclui password_hash: usado apenas no login
export const findByEmail = async (email) => {
    const { rows } = await pool.query(`SELECT ${PUBLIC_FIELDS}, password_hash FROM users WHERE email = $1`, [email]);
    return rows[0] || null;
};

export const findById = async (id) => {
    const { rows } = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [id]);
    return rows[0] || null;
};
