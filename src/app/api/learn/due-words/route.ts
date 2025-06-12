import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningProgress, words } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

// GET /api/learn/due-words - Get words due for review
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find word IDs due for review
    const dueWordIds = await db
      .select({ wordId: learningProgress.wordId })
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, session.user.id),
          sql`${learningProgress.nextReviewDate} <= NOW()`
        )
      );

    if (!dueWordIds.length) {
      return NextResponse.json([]);
    }

    // Get word details
    const wordsDue = await db
      .select({
        id: words.id,
        germanWord: words.germanWord,
        englishTranslation: words.englishTranslation,
        banglaTranslation: words.banglaTranslation,
        section: words.section,
      })
      .from(words)
      .where(
        and(
          eq(words.createdBy, session.user.id),
          sql`id IN (${dueWordIds.map(w => `'${w.wordId}'`).join(",")})`
        )
      );

    return NextResponse.json(wordsDue);
  } catch (error) {
    console.error("[DUE_WORDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
