import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { words } from "@/lib/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

const batchWordSchema = z.object({
  words: z.array(
    z.object({
      mainWord: z.string().min(1, "Main word is required"),
      translation1: z.string().nullable(),
      translation2: z.string().nullable(),
      exampleSentence: z.string().nullable(),
      section: z.string().min(1, "Section is required"),
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
    })
  ).min(1, "At least one word is required").max(100, "Maximum 100 words allowed"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("Unauthorized: No user session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    // console.log("Received request body:", JSON.stringify(body, null, 2));

    const result = batchWordSchema.safeParse(body);
    if (!result.success) {
      console.error("Validation error:", result.error.format());
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: result.error.format(),
          message: "Please check the format of your input data"
        },
        { status: 400 }
      );
    }

    const { words: wordsToAdd } = result.data;
    // console.log(`Attempting to add ${wordsToAdd.length} words for user ${session.user.id}`);

    // Get all existing words for this user (match by section + mainWord)
    const existing = await db.select({
      mainWord: words.mainWord,
      section: words.section,
    }).from(words)
      .where(eq(words.createdBy, session.user.id));
    const existingSet = new Set(existing.map((e: any) => `${e.section}|||${e.mainWord}`));
    const filteredWords = wordsToAdd.filter(w => !existingSet.has(`${w.section}|||${w.mainWord}`));
    const skippedCount = wordsToAdd.length - filteredWords.length;

    if (filteredWords.length === 0) {
      return NextResponse.json({
        message: `No new words added. All were duplicates.`,
        added: 0,
        skipped: skippedCount,
      });
    }

    try {
      // Sort filtered words to maintain order
      const now = new Date();
      const inserted = await db.insert(words).values(
        filteredWords.map((word, index) => ({
          ...word,
          createdBy: session.user.id,
          // Add an incremental delay to maintain order (100ms intervals)
          createdAt: new Date(now.getTime() + (index * 100)),
          updatedAt: new Date(now.getTime() + (index * 100)),
        }))
      )
      .returning({
        id: words.id,
        mainWord: words.mainWord,
        createdAt: words.createdAt
      });

      // console.log(`Successfully inserted ${inserted.length} words`);
      
      return NextResponse.json({
        message: `Added ${inserted.length} new words. Skipped ${skippedCount} duplicate(s).`,
        added: inserted.length,
        skipped: skippedCount,
        words: inserted,
      });
    } catch (error) {
      console.error("Database insert error:", error);
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          return NextResponse.json(
            { error: "Some words already exist in your collection" },
            { status: 409 }
          );
        }
        if (error.message.includes("violates foreign key constraint")) {
          return NextResponse.json(
            { error: "Invalid user or section reference" },
            { status: 400 }
          );
        }
      }
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Error in batch word addition:", error);
    return NextResponse.json(
      { 
        error: "Failed to add words",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 