require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const phone = '0701010101';
  const plainPassword = 'pass012';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected.');

    const checkRes = await client.query('SELECT id, phone, role FROM "User" WHERE phone = $1 LIMIT 1', [phone]);
    
    if (checkRes.rows.length > 0) {
      const existing = checkRes.rows[0];
      console.log('User exists, updating to admin...');
      await client.query(
        'UPDATE "User" SET password = $1, role = $2, "emailVerified" = COALESCE("emailVerified", NOW()) WHERE id = $3',
        [hashedPassword, 'admin', existing.id]
      );
      console.log('Successfully updated user to admin:', existing.id);
    } else {
      console.log('Creating new admin user...');
      const newId = crypto.randomUUID();
      const email = 'admin0701010101@delicesdeva.com';
      await client.query(
        'INSERT INTO "User" (id, phone, password, role, name, email, "emailVerified", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [newId, phone, hashedPassword, 'admin', 'Admin', email]
      );
      console.log('Successfully created new admin user with id:', newId);
    }

    client.release();
    await pool.end();
    console.log('Done!');
  } catch (err) {
    console.error('Error executing query:', err);
    process.exit(1);
  }
}

run();
