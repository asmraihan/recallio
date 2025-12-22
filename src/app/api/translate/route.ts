import { NextResponse, NextRequest } from "next/server";
const translatte = require('translatte');



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, to } = body;
    if (!text || !to) {
      return new NextResponse(JSON.stringify({ error: "Text and target language are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const result = await translatte(text, { to });
    return NextResponse.json({
      translatedText: result.text,
    });
  } catch (error) {
    console.error("[TRANSLATE_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function GET(req: NextRequest) {
  return new NextResponse(JSON.stringify({ message: "Translate API is running" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}