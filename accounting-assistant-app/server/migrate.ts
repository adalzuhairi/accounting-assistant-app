import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// For migrations
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });

const db = drizzle(migrationClient, { schema });

async function runMigration() {
  console.log('Running migration...');
  
  try {
    // Create clients table
    await migrationClient.unsafe(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        currency TEXT DEFAULT 'USD',
        tax_rate DECIMAL(5,2) DEFAULT 0,
        user_id INTEGER NOT NULL
      );
    `);
    console.log('Created clients table');
    
    // Check if column exists
    const result = await migrationClient.unsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'client_id';
    `);
    
    if (result.length === 0) {
      await migrationClient.unsafe(`
        ALTER TABLE invoices ADD COLUMN client_id INTEGER;
      `);
      console.log('Added client_id column to invoices table');
    } else {
      console.log('client_id column already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await migrationClient.end();
  }
}

runMigration();