export async function GET() {
  return Response.json({ 
    ok: true, 
    time: new Date().toISOString(),
    version: 'v1.0.0'
  })
}