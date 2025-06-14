import { sql } from 'drizzle-orm';

export async function up({ db }) {
  await db.execute(sql`ALTER TABLE learning_sessions ADD COLUMN sections jsonb DEFAULT '[]';`);
  await db.execute(sql`ALTER TABLE learning_sessions DROP COLUMN IF EXISTS section;`);
}

export async function down({ db }) {
  await db.execute(sql`ALTER TABLE learning_sessions ADD COLUMN section integer;`);
  await db.execute(sql`ALTER TABLE learning_sessions DROP COLUMN IF EXISTS sections;`);
}
