import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { words } from "@/lib/db/schema";
import { z } from "zod";

const wordSchema = z.object({
  germanWord: z.string().min(1, "German word is required"),
  englishTranslation: z.string().optional(),
  banglaTranslation: z.string().optional(),
  exampleSentence: z.string().optional(),
  notes: z.string().optional(),
  section: z.number().min(1, "Section is required"),
}).refine(
  (data) => data.englishTranslation || data.banglaTranslation,
  "Either English or Bangla translation must be provided"
);


export async function GET(req: Request, context: { params: Promise<{ wordId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { wordId } = await context.params;
    const [word] = await db.select().from(words).where(and(eq(words.id, wordId), eq(words.createdBy, session.user.id)));
    if (!word) {
      return new NextResponse(JSON.stringify({ error: "Word not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return NextResponse.json(word);
  } catch (error) {
    console.error("[WORDS_GET_ONE]", error);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}


// PATCH and GET (single) for /api/words/[wordId]
export async function PATCH( req: Request,
  context: { params: Promise<{ wordId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { wordId } = await context.params;
    const body = await req.json();
    const validatedData = wordSchema.parse(body);

    // Only allow editing user's own word
    const [existing] = await db.select().from(words).where(and(eq(words.id, wordId), eq(words.createdBy, session.user.id)));
    if (!existing) {
      return new NextResponse(JSON.stringify({ error: "Word not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const updated = await db.update(words)
      .set({ ...validatedData })
      .where(and(eq(words.id, wordId), eq(words.createdBy, session.user.id)))
      .returning();

    return NextResponse.json({ ...updated[0], message: "Word updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("[WORDS_PATCH]", error);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}


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