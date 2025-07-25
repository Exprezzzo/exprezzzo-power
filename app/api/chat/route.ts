// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders } from '@/lib/ai-providers'; // Correctly import allAIProviders
import { getFirestore } from 'firebase-admin/firestore'; // For server-side Firestore
import { getAdminApp } from '@/lib/firebaseAdmin'; // For server-side Firebase Admin SDK
// import { APP_NAME } from '@/lib/constants'; // Removed: 'APP_NAME' is not used in this file

export const runtime = 'nodejs'; // Explicitly set to Node.js for AI SDKs

export async function POST(req: NextRequest) {
  try {
    const { model, messages, userId } = await req.json();

    if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request: model and messages are required.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required for chat.' }, { status: 401 });
    }

    const selectedAIProvider = allAIProviders.find(provider => provider.id === model);

    if (!selectedAIProvider) {
      return NextResponse.json({ error: `AI provider "${model}" not found or API key missing.` }, { status: 404 });
    }

    // Initialize Firestore for usage logging
    const adminApp = getAdminApp();
    const adminFirestore = adminApp ? getFirestore(adminApp) : null;

    // Prepare for streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullResponseContent = '';
        let firstChunk = true;

        try {
          for await (const chunk of selectedAIProvider.streamChatCompletion(messages)) {
            if (firstChunk) {
              // Send initial metadata if needed (e.g., model name)
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'metadata', model: selectedAIProvider.name }) + '\n'));
              firstChunk = false;
            }
            controller.enqueue(encoder.encode(chunk));
            fullResponseContent += chunk;
          }
        } catch (error: any) {
          console.error(`Streaming error from AI provider (${selectedAIProvider.id}):`, error);
          controller.enqueue(encoder.encode(`ERROR: ${error.message || 'An unexpected error occurred during streaming.'}`));
        } finally {
          // Log usage after streaming completes
          if (adminFirestore && fullResponseContent) {
            try {
              const userUsageRef = adminFirestore.collection('users').doc(userId);
              // Use `admin.firestore.FieldValue.increment` instead of `getFirestore().FieldValue.increment`
              await userUsageRef.set({
                lastActivity: new Date().toISOString(),
                chatCount: getFirestore(adminApp).FieldValue.increment(1), // Correct usage for admin firestore FieldValue
                [`modelUsage.${selectedAIProvider.id}.count`]: getFirestore(adminApp).FieldValue.increment(1),
                // TODO: Implement token and cost estimation for more granular logging
              }, { merge: true });
              console.log(`Usage logged for user ${userId} with model ${selectedAIProvider.id}`);
            } catch (logError) {
              console.error('Failed to log chat usage:', logError);
            }
          }
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Or 'text/event-stream' for SSE if desired
      },
    });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
