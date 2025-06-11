import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningSessions, sessionWords, words, learningProgress } from "@/lib/db/schema";
import { eq, and, sql, desc, inArray, notInArray } from "drizzle-orm";

interface Word {
  id: string;
  germanWord: string;
  englishTranslation: string | null;
  banglaTranslation: string | null;
  section: number;
}

// POST /api/learn/sessions - Start a new learning session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { type, direction, section } = await req.json();

    // Validate input
    if (!type || !direction) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get words based on session type
    let wordsToLearn: Word[] = [];
    switch (type) {
      case "review": {
        // Get words that are due for review
        const dueWords = await db
          .select({
            wordId: learningProgress.wordId,
            nextReviewDate: learningProgress.nextReviewDate,
          })
          .from(learningProgress)
          .where(
            and(
              eq(learningProgress.userId, session.user.id),
              sql`${learningProgress.nextReviewDate} <= NOW()`
            )
          );
        const dueWordIds = dueWords.map((w) => w.wordId);
        if (dueWordIds.length > 0) {
          wordsToLearn = await db
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
                inArray(words.id, dueWordIds),
                section ? eq(words.section, section) : sql`TRUE`
              )
            )
            .limit(20);
        }
        break;
      }

      case "new": {
        // Get words that haven't been learned yet
        const learnedWords = await db
          .select({ wordId: learningProgress.wordId })
          .from(learningProgress)
          .where(eq(learningProgress.userId, session.user.id));
        const learnedWordIds = learnedWords.map((w) => w.wordId);
        
        wordsToLearn = await db
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
              learnedWordIds.length > 0 ? notInArray(words.id, learnedWordIds) : sql`TRUE`,
              section ? eq(words.section, section) : sql`TRUE`
            )
          )
          .limit(20);
        break;
      }

      case "mistakes": {
        // Get words with low mastery level
        const mistakeWords = await db
          .select({
            wordId: learningProgress.wordId,
            masteryLevel: learningProgress.masteryLevel,
          })
          .from(learningProgress)
          .where(
            and(
              eq(learningProgress.userId, session.user.id),
              sql`${learningProgress.masteryLevel} < 3`
            )
          );
        const mistakeWordIds = mistakeWords.map((w) => w.wordId);
        if (mistakeWordIds.length > 0) {
          wordsToLearn = await db
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
                inArray(words.id, mistakeWordIds),
                section ? eq(words.section, section) : sql`TRUE`
              )
            )
            .limit(20);
        }
        break;
      }

      default:
        wordsToLearn = await db
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
              section ? eq(words.section, section) : sql`TRUE`
            )
          )
          .limit(20);
    }

    if (wordsToLearn.length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: "No words available for this session type",
        }),
        { status: 400 }
      );
    }

    // Create new session
    const sessionId = crypto.randomUUID();
    await db.insert(learningSessions).values({
      id: sessionId,
      userId: session.user.id,
      sessionType: type,
      direction,
      section: section || null,
      status: "in_progress",
      totalWords: wordsToLearn.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      startedAt: new Date(),
    });

    // Add words to session
    await db.insert(sessionWords).values(
      wordsToLearn.map((word: Word, index: number) => ({
        sessionId,
        wordId: word.id,
        presentationOrder: index + 1,
        presentedAt: new Date(),
      }))
    );

    return NextResponse.json({
      sessionId,
      words: wordsToLearn,
    });
  } catch (error) {
    console.error("[LEARN_SESSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// GET /api/learn/sessions/recent - Get recent learning sessions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const recentSessions = await db
      .select({
        id: learningSessions.id,
        type: learningSessions.sessionType,
        direction: learningSessions.direction,
        startedAt: learningSessions.startedAt,
        completedAt: learningSessions.completedAt,
        totalWords: learningSessions.totalWords,
        correctAnswers: learningSessions.correctAnswers,
        incorrectAnswers: learningSessions.incorrectAnswers,
        status: learningSessions.status,
      })
      .from(learningSessions)
      .where(eq(learningSessions.userId, session.user.id))
      .orderBy(desc(learningSessions.startedAt))
      .limit(5);

    // Calculate accuracy for each session
    const sessionsWithAccuracy = recentSessions.map((session) => ({
      ...session,
      accuracy: session.totalWords > 0
        ? session.correctAnswers / (session.correctAnswers + session.incorrectAnswers)
        : 0,
      duration: session.completedAt
        ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
        : null,
    }));

    return NextResponse.json(sessionsWithAccuracy);
  } catch (error) {
    console.error("[LEARN_SESSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 