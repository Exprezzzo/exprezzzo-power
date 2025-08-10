// app/api/figma/components/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
    const FIGMA_API_KEY = process.env.FIGMA_API_KEY;

    if (!FIGMA_FILE_ID || !FIGMA_API_KEY) {
      return NextResponse.json(
        { error: "Figma API credentials not set" },
        { status: 500 }
      );
    }

    // Call Figma API for file components
    const res = await fetch(
      `https://api.figma.com/v1/files/${FIGMA_FILE_ID}/components`,
      {
        headers: {
          "X-Figma-Token": FIGMA_API_KEY,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error fetching Figma components" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Extract just the component names and IDs
    const components = Object.values(data.meta?.components || {}).map(
      (comp: any) => ({
        name: comp.name,
        id: comp.node_id,
        description: comp.description || "",
      })
    );

    return NextResponse.json({ components });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}