import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';


const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const databaseUrl = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]
  ?.replace(/['"]/g, '');

if (!databaseUrl) {
  console.error('No DATABASE_URL found in .env file');
  process.exit(1);
}

// console.log("Found database URL, connecting...");
const neonClient = neon(databaseUrl);
const db = drizzle(neonClient, { schema });

async function migrateTranslations() {
  try {
    // Copy data from old columns to new columns
    await db.execute(sql`
      UPDATE "words"
      SET 
        "translation_one" = "english_translation",
        "translation_two" = "bangla_translation"
      WHERE "translation_one" IS NULL
    `);
    
    console.log('Successfully migrated translations');
  } catch (error) {
    console.error('Error migrating translations:', error);
  }
}

migrateTranslations();