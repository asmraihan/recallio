import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningProgress, words } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, context: { params: Promise<{ wordId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { wordId } = await context.params;
  const { important } = await req.json();

  // Update important directly on words table
  await db.update(words)
    .set({ important })
    .where(eq(words.id, wordId));
  return NextResponse.json({ success: true });
}