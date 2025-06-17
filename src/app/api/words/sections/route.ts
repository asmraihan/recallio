import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { words } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get distinct sections for the user's words
    const sections = await db
      .select({
        section: words.section
      })
      .from(words)
      .where(eq(words.createdBy, session.user.id))
      .groupBy(words.section)
      // Ensure sections are ordered by createdAt
      .orderBy(sql` MIN(${words.createdAt})`)

    return NextResponse.json({
      sections: sections.map(s => s.section)
    });
  } catch (error) {
    console.error("[SECTIONS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}