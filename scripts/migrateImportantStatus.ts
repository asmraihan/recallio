import { db } from "@/lib/db";
import { words, learningProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function migrateImportantStatus() {
  // 1. Count important in learning_progress
  const importantProgress = await db
    .select({ wordId: learningProgress.wordId })
    .from(learningProgress)
    .where(eq(learningProgress.important, true));

  const importantWordIds = Array.from(new Set(importantProgress.map(row => row.wordId)));

  console.log(`Found ${importantWordIds.length} unique important words in learning_progress.`);

  // 2. Update words table
  if (importantWordIds.length > 0) {
    await Promise.all(
      importantWordIds.map(wordId =>
        db.update(words)
          .set({ important: true })
          .where(eq(words.id, wordId))
      )
    );
  }

  // 3. Count important in words table
  // Count important in words table using array length
  const wordsImportant = await db
    .select({ id: words.id })
    .from(words)
    .where(eq(words.important, true));

  console.log(`Now ${wordsImportant.length} words are marked important in words table.`);

  return {
    importantProgressCount: importantWordIds.length,
    wordsImportantCount: wordsImportant.length,
  };
}

// Usage example (uncomment to run):
migrateImportantStatus().then(console.log).catch(console.error);
