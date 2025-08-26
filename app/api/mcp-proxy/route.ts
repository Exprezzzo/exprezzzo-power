import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.EXPREZZZO_API_KEY;
const ALLOWED = [
  "/api/orchestrate",
  "/api/test-providers",
  "/api/figma",
  "/api/figma/components"
];

export async function POST(req: NextRequest) {
  try {
    const { endpoint, method = "GET", data } = await req.json();
    if (!ALLOWED.includes(endpoint)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    const r = await fetch(`https://exprezzzo-power.vercel.app${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: data ? JSON.stringify(data) : undefined
    });
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
