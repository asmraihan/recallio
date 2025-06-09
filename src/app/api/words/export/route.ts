import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { words } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Parser } from "json2csv";

const fields = [
  "germanWord",
  "englishTranslation",
  "banglaTranslation",
  "exampleSentence",
  "notes",
  "section",
  "createdAt",
  "updatedAt",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Fetch user's words
    const userWords = await db
      .select()
      .from(words)
      .where(eq(words.createdBy, session.user.id))
      .orderBy(words.createdAt);

    // Convert to CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(userWords);
    const csvWithBom = '\uFEFF' + csv;

    // Create response with CSV file
    const response = new NextResponse(csvWithBom);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="recallio-words-${new Date().toISOString().split("T")[0]}.csv"`
    );

    return response;
  } catch (error) {
    console.error("[WORDS_EXPORT]", error);
    return new NextResponse(JSON.stringify({ error: "Failed to export words" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 