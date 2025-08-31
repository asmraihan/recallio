import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { words } from "@/lib/db/schema";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all words created by the user
    await db.delete(words).where(eq(words.createdBy, session.user.id));

    return NextResponse.json({ message: "All words deleted successfully" });
  } catch (error) {
    console.error("[DELETE_ALL_WORDS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
