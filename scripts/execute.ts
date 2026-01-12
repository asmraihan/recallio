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

async function execute() {
  try {

 
     console.log("Starting section update...");

    // // Update all learning session directions where english_to_german to trans1_to_main
    // await db.execute(
    //   sql`UPDATE "learning_sessions"
    //       SET "direction" = 'trans1_to_main'
    //       WHERE "direction" = 'english_to_german'`
    // );
    // console.log("Section update completed.");

    process.exit(0);
  } catch (error) {
    console.error("Error executing migration:", error);
    process.exit(1);
  }
}

execute();