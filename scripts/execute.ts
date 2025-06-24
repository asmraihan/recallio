import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
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

console.log("Found database URL, connecting...");
const neonClient = neon(databaseUrl);
const db = drizzle(neonClient, { schema });

async function execute() {
  try {
    console.log("Starting section update...");

    // Update all sections to add "Sec " prefix
    // await db.execute(
    //   sql`UPDATE words SET section = CONCAT('Sec ', section);`
    // );

 // Update all words section 

    // await db.execute(
    //   sql`UPDATE words SET section = 
    //     CASE 
    //       WHEN section = '2 21' THEN '2 01'
    //       WHEN section = '2 22' THEN '2 02'
    //       WHEN section = '2 23' THEN '2 03'
    //       WHEN section = '2 24' THEN '2 04'
    //       WHEN section = '2 25' THEN '2 05'
    //       WHEN section = '2 26' THEN '2 06'
    //       ELSE section
    //     END;`
    // );

    console.log("Successfully updated all sections!");
    process.exit(0);
  } catch (error) {
    console.error("Error executing update:", error);
    process.exit(1);
  }
}

execute(); 