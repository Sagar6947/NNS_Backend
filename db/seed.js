const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nns_db'
    });

    try {
        const username = 'admin';
        const password = 'password123';
        const email = 'admin@nns.com';

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await connection.execute(
            'INSERT IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hash, 'Super Admin']
        );
        
        console.log(`Default admin user seeded. Username: ${username}, Password: ${password}`);
    } catch (error) {
        console.error('Error seeding admin user:', error);
    } finally {
        await connection.end();
    }
}

seedAdmin();
