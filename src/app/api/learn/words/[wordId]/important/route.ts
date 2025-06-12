import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningProgress } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, context: { params: Promise<{ wordId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { wordId } = await context.params;
  const { important } = await req.json();

  // Update or insert learningProgress for this word/user
  const [progress] = await db
    .select()
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, session.user.id), eq(learningProgress.wordId, wordId)));
  if (progress) {
    await db.update(learningProgress)
      .set({ important })
      .where(eq(learningProgress.id, progress.id));
  } else {
    await db.insert(learningProgress).values({
      userId: session.user.id,
      wordId,
      important,
      masteryLevel: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      lastReviewedAt: new Date(),
      nextReviewDate: new Date(),
      preferredDirection: "german_to_english",
    });
  }
  return NextResponse.json({ success: true });
}