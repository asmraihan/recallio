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

    /* ==================== */
    //  console.log("Starting section update...");

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
    /* ==================== */
    // console.log("Starting important status migration...");

    // // 1. Count important in learning_progress
    // const importantProgress = await db
    //   .select({ wordId: schema.learningProgress.wordId })
    //   .from(schema.learningProgress)
    //   .where(eq(schema.learningProgress.important, true));

    // const importantWordIds = Array.from(new Set(importantProgress.map(row => row.wordId)));
    // console.log(`Found ${importantWordIds.length} unique important words in learning_progress.`);

    // // 2. Update words table
    // if (importantWordIds.length > 0) {
    //   await Promise.all(
    //     importantWordIds.map(wordId =>
    //       db.update(schema.words)
    //         .set({ important: true })
    //         .where(eq(schema.words.id, wordId))
    //     )
    //   );
    // }

    // // 3. Count important in words table
    // const wordsImportant = await db
    //   .select({ id: schema.words.id })
    //   .from(schema.words)
    //   .where(eq(schema.words.important, true));

    // console.log(`Now ${wordsImportant.length} words are marked important in words table.`);

    process.exit(0);
  } catch (error) {
    console.error("Error executing migration:", error);
    process.exit(1);
  }
}

execute();