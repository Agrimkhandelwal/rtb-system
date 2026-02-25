import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rtb_user:rtb_password@localhost:5432/rtb_db',
    ...(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') || process.env.NODE_ENV === 'production'
        ? { ssl: { rejectUnauthorized: false } }
        : {})
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
