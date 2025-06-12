import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningSessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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
      .limit(20);

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
    console.error("[LEARN_SESSIONS_RECENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 