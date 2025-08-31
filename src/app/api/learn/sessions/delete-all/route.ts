import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { learningSessions, sessionWords, learningProgress } from "@/lib/db/schema";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all session words for the user's sessions
    await db.delete(sessionWords).where(
      eq(sessionWords.sessionId, 
        db.select({ id: learningSessions.id })
          .from(learningSessions)
          .where(eq(learningSessions.userId, session.user.id))
          .limit(1)
      )
    );

    // Delete all learning sessions
    await db.delete(learningSessions)
      .where(eq(learningSessions.userId, session.user.id));

    // Delete all learning progress
    await db.delete(learningProgress)
      .where(eq(learningProgress.userId, session.user.id));

    return NextResponse.json({ message: "All sessions deleted successfully" });
  } catch (error) {
    console.error("[DELETE_ALL_SESSIONS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
