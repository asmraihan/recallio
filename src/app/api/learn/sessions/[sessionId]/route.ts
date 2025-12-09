import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningSessions, sessionWords, words, learningProgress } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId } = await context.params;
    // Fetch the session
    const [learningSession] = await db
      .select()
      .from(learningSessions)
      .where(
        and(
          eq(learningSessions.id, sessionId),
          eq(learningSessions.userId, session.user.id)
        )
      );
    if (!learningSession) {
      return new NextResponse("Session not found", { status: 404 });
    }

    // Fetch the words for this session
    const sessionWordRows = await db
      .select({ wordId: sessionWords.wordId, presentationOrder: sessionWords.presentationOrder, isCorrect: sessionWords.isCorrect, answeredAt: sessionWords.answeredAt })
      .from(sessionWords)
      .where(eq(sessionWords.sessionId, sessionId));
    const wordIds = sessionWordRows.map((row) => row.wordId);
    if (!wordIds.length) {
      return NextResponse.json({ error: "No new words in this section." }, { status: 400 });
    }
    // Fetch word details and preserve order, use important from words table
    const wordDetails = await db
      .select({
        id: words.id,
        germanWord: words.germanWord,
        translationOne: words.translationOne,
        translationTwo: words.translationTwo,
        exampleSentence: words.exampleSentence,
        notes: words.notes,
        section: words.section,
        important: words.important,
      })
      .from(words)
      .where(and(eq(words.createdBy, session.user.id), eqAny(words.id, wordIds)));
    // Sort words by presentationOrder and merge answer state
    const wordOrderMap = Object.fromEntries(sessionWordRows.map((row) => [row.wordId, row.presentationOrder]));
    const answerMap = Object.fromEntries(sessionWordRows.map((row) => [row.wordId, { isCorrect: row.isCorrect, answeredAt: row.answeredAt }]));
    const sortedWords = wordDetails
      .map(w => ({ ...w, ...answerMap[w.id] }))
      .sort((a, b) => (wordOrderMap[a.id] || 0) - (wordOrderMap[b.id] || 0));

    return NextResponse.json({ session: learningSession, words: sortedWords });
  } catch (error) {
    console.error("[LEARN_SESSION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Helper for eqAny (inArray)
import { inArray } from "drizzle-orm";
const eqAny = inArray;