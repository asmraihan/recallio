import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { words } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ wordId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { wordId } = await context.params;

    // Delete the word only if it belongs to the user
    const result = await db
      .delete(words)
      .where(
        and(
          eq(words.id, wordId),
          eq(words.createdBy, session.user.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return new NextResponse(JSON.stringify({ error: "Word not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[WORD_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}