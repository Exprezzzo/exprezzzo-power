export async function GET() {
  return Response.json({
    message: "Public access enabled",
    playground: "/playground",
    providers: ["openai", "anthropic", "gemini", "groq"],
    status: "active"
  });
}