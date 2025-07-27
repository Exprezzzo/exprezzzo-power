// app/api/chat/route.ts
// Implements Phoenix v3.4 Fixes:
// - Corrects Firestore FieldValue usage
// - Removes unused 'APP_NAME' import
// - Explicitly sets Node.js runtime

import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders } from '@/lib/ai-providers'; // Correctly import allAIProviders
import { getFirestore, FieldValue } from 'firebase-admin/firestore'; // Import getFirestore AND FieldValue
import { getAdminApp } from '@/lib/firebaseAdmin'; // For server-side Firebase Admin SDK

export const runtime = 'nodejs'; // Phoenix v3.4: Explicitly set to Node.js for AI SDKs

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
    const adminApp = getAdminApp(); // Get the Firebase Admin app instance
    const adminFirestore = adminApp ? getFirestore(adminApp) : null; // Get Firestore instance only if app is not null

    // Prepare for streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullResponseContent = '';
        let firstChunk = true;

        try {
          for await (const chunk of selectedAIProvider.streamChatCompletion(messages)) {
            if (firstChunk) {
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
          if (adminFirestore && fullResponseContent) { // Ensure adminFirestore is not null before using it
            try {
              const userUsageRef = adminFirestore.collection('users').doc(userId);
              await userUsageRef.set({
                lastActivity: new Date().toISOString(),
                chatCount: FieldValue.increment(1), // Correct usage for admin firestore FieldValue
                [`modelUsage.${selectedAIProvider.id}.count`]: FieldValue.increment(1),
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
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
