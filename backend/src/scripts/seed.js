import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

const seed = async () => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password', salt);

        // Initial Admins and Dealers
        await query(`
      INSERT INTO users (id, name, email, password_hash, role) VALUES 
      ('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@example.com', $1, 'ADMIN'),
      ('22222222-2222-2222-2222-222222222222', 'Dealer One', 'dealer@example.com', $1, 'DEALER'),
      ('33333333-3333-3333-3333-333333333333', 'Dealer Two', 'dealer2@example.com', $1, 'DEALER')
      ON CONFLICT (email) DO NOTHING;
    `, [passwordHash]);

        console.log('Database seeded with admin@example.com and dealer@example.com (password: password)');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding DB:', err);
        process.exit(1);
    }
};

seed();
