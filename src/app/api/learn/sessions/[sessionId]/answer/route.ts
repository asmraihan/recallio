import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningProgress, sessionWords, learningSessions } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// Simple spaced repetition intervals (in days)
const intervals = [1, 3, 7, 14, 30, 60];

export async function POST(req: Request, context: { params: { sessionId: string } }) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { sessionId } = params;
    const { wordId, isCorrect } = await req.json();
    if (!wordId || typeof isCorrect !== "boolean") {
      return new NextResponse("Missing wordId or isCorrect", { status: 400 });
    }

    // Fetch the session to get the direction
    const [learningSession] = await db
      .select({ direction: learningSessions.direction })
      .from(learningSessions)
      .where(eq(learningSessions.id, sessionId));
    const preferredDirection = learningSession?.direction || "german_to_english";

    // Get or create learning_progress row
    const [progress] = await db
      .select()
      .from(learningProgress)
      .where(and(eq(learningProgress.userId, session.user.id), eq(learningProgress.wordId, wordId)));
    let masteryLevel = 0;
    let correctAttempts = 0;
    let incorrectAttempts = 0;
    const nextReviewDate = new Date();
    if (progress) {
      masteryLevel = progress.masteryLevel;
      correctAttempts = progress.correctAttempts;
      incorrectAttempts = progress.incorrectAttempts;
    }
    if (isCorrect) {
      masteryLevel = Math.min(masteryLevel + 1, intervals.length);
      correctAttempts++;
    } else {
      masteryLevel = Math.max(masteryLevel - 1, 0);
      incorrectAttempts++;
    }
    // Calculate next review date
    const intervalDays = intervals[masteryLevel] || intervals[intervals.length - 1];
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    if (progress) {
      await db.update(learningProgress)
        .set({
          masteryLevel,
          correctAttempts,
          incorrectAttempts,
          lastReviewedAt: new Date(),
          nextReviewDate,
        })
        .where(eq(learningProgress.id, progress.id));
    } else {
      await db.insert(learningProgress).values({
        userId: session.user.id,
        wordId,
        masteryLevel,
        correctAttempts,
        incorrectAttempts,
        lastReviewedAt: new Date(),
        nextReviewDate,
        preferredDirection,
      });
    }

    // Update session_words
    await db.update(sessionWords)
      .set({
        isCorrect,
        answeredAt: new Date(),
      })
      .where(and(eq(sessionWords.sessionId, sessionId), eq(sessionWords.wordId, wordId)));

    // Check if all words are answered
    const unanswered = await db
      .select()
      .from(sessionWords)
      .where(and(eq(sessionWords.sessionId, sessionId), isNull(sessionWords.answeredAt)));
    if (unanswered.length === 0) {
      // Mark session as completed
      const correctCount = await db
        .select()
        .from(sessionWords)
        .where(and(eq(sessionWords.sessionId, sessionId), eq(sessionWords.isCorrect, true)));
      const incorrectCount = await db
        .select()
        .from(sessionWords)
        .where(and(eq(sessionWords.sessionId, sessionId), eq(sessionWords.isCorrect, false)));
      await db.update(learningSessions)
        .set({
          status: "completed",
          completedAt: new Date(),
          correctAnswers: correctCount.length,
          incorrectAnswers: incorrectCount.length,
        })
        .where(eq(learningSessions.id, sessionId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LEARN_SESSION_ANSWER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}