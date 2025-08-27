export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkCommit = searchParams.get('commit');
  
  const currentCommit = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
  const matches = checkCommit === currentCommit.substring(0, 7);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: monospace;
          padding: 20px;
          background: #000;
          color: ${matches ? '#0f0' : '#f00'};
          font-size: 18px;
        }
        .status {
          font-size: 48px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="status">${matches ? '✅' : '❌'}</div>
      <h1>${matches ? 'DEPLOYED' : 'NOT DEPLOYED'}</h1>
      <p>Expected: ${checkCommit}</p>
      <p>Live: ${currentCommit.substring(0, 7)}</p>
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store'
    }
  });
}
