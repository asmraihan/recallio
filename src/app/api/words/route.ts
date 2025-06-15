import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { words } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const wordSchema = z.object({
  germanWord: z.string().min(1, "German word is required"),
  englishTranslation: z.string().optional(),
  banglaTranslation: z.string().optional(),
  exampleSentence: z.string().optional(),
  notes: z.string().optional(),
  section: z.number().min(1, "Section must be at least 1"),
}).refine(
  (data) => data.englishTranslation || data.banglaTranslation,
  "Either English or Bangla translation must be provided"
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    const validatedData = wordSchema.parse(body);

    // Check for duplicate (same germanWord for this user, regardless of section)
    const existing = await db.select().from(words).where(
      and(
        eq(words.createdBy, session.user.id),
        eq(words.germanWord, validatedData.germanWord)
      )
    );
    if (existing.length > 0) {
      return new NextResponse(JSON.stringify({ error: "This word already exists in your collection." }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    const word = await db.insert(words).values({
      ...validatedData,
      createdBy: session.user.id,
    }).returning();

    return NextResponse.json({
      ...word[0],
      message: "Word added successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("[WORDS_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { searchParams } = new URL(req.url);
    const sectionParam = searchParams.get("section");

    let userWords;
    if (sectionParam) {
      userWords = await db
        .select()
        .from(words)
        .where(and(eq(words.createdBy, session.user.id), eq(words.section, Number(sectionParam))))
        .orderBy(words.createdAt);
    } else {
      userWords = await db
        .select()
        .from(words)
        .where(eq(words.createdBy, session.user.id))
        .orderBy(words.createdAt);
    }
    return NextResponse.json(userWords);
  } catch (error) {
    console.error("[WORDS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
