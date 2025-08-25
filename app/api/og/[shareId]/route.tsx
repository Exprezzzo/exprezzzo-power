import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { AISession } from '@/types/ai-playground';

interface ShareMetadata {
  session: AISession;
  responseCount: number;
  modelBadges: string[];
  previewText: string;
}

export const runtime = 'edge';

async function getShareData(shareId: string): Promise<ShareMetadata | null> {
  try {
    // In production, fetch from your database
    // For now, return mock data
    return {
      session: {
        id: shareId,
        title: 'AI Conversation Preview',
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'How can I optimize my React application for better performance?',
            timestamp: new Date(),
            tokens: 150
          },
          {
            id: '2', 
            role: 'assistant',
            content: 'Here are several key strategies to optimize your React application: 1. Use React.memo for expensive components, 2. Implement code splitting with lazy loading, 3. Optimize bundle size with tree shaking...',
            timestamp: new Date(),
            tokens: 300,
            modelId: 'claude-3-opus'
          }
        ],
        modelConfigs: [],
        settings: {
          temperature: 0.7,
          maxTokens: 4000,
          systemPrompt: '',
          streamingEnabled: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          messageCount: 2,
          tokenCount: 450,
          tags: ['react', 'performance'],
          favorited: false,
          shared: true,
          visibility: 'public',
          forkHistory: []
        }
      },
      responseCount: 12,
      modelBadges: ['Claude 3 Opus', 'GPT-4', 'Gemini Pro'],
      previewText: 'How can I optimize my React application for better performance? Here are several key strategies...'
    };
  } catch (error) {
    console.error('Failed to fetch share data:', error);
    return null;
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;
    const shareData = await getShareData(shareId);

    if (!shareData) {
      // Return default OG image
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1A1A1A',
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#FFD700',
                marginBottom: 32,
                textShadow: '0 4px 8px rgba(255, 215, 0, 0.3)',
              }}
            >
              Exprezzzo
            </div>
            <div
              style={{
                fontSize: 32,
                color: '#FFFFFF',
                opacity: 0.8,
                textAlign: 'center',
                maxWidth: 800,
              }}
            >
              Vegas-Style AI Playground
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const { session, responseCount, modelBadges, previewText } = shareData;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1A1A1A',
            background: 'linear-gradient(135deg, #1A1A1A 0%, #2D1B69 50%, #FFD700 100%)',
            padding: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow: '0 2px 4px rgba(255, 215, 0, 0.3)',
              }}
            >
              Exprezzzo
            </div>
            
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: '8px 16px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  color: '#FFD700',
                  fontWeight: 600,
                  marginRight: 8,
                }}
              >
                {responseCount}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: '#FFFFFF',
                  opacity: 0.8,
                }}
              >
                responses
              </div>
            </div>
          </div>

          {/* Session Title */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: 24,
              maxWidth: '100%',
              lineHeight: 1.3,
            }}
          >
            {truncateText(session.title, 80)}
          </div>

          {/* Preview Text */}
          <div
            style={{
              fontSize: 20,
              color: '#FFFFFF',
              opacity: 0.9,
              lineHeight: 1.5,
              marginBottom: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 16,
              padding: 24,
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
            }}
          >
            {truncateText(previewText, 200)}
          </div>

          {/* Model Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 32,
            }}
          >
            {modelBadges.slice(0, 4).map((model, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: 20,
                  padding: '8px 16px',
                  fontSize: 16,
                  color: '#FFD700',
                  fontWeight: 600,
                  backdropFilter: 'blur(5px)',
                }}
              >
                {model}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 16,
              }}
            >
              {session.metadata.tags.slice(0, 3).map((tag, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '4px 12px',
                    fontSize: 14,
                    color: '#FFFFFF',
                    opacity: 0.8,
                  }}
                >
                  #{tag}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#00FF88',
                  boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)',
                }}
              />
              <div
                style={{
                  fontSize: 16,
                  color: '#FFFFFF',
                  opacity: 0.7,
                }}
              >
                Shared conversation
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 150,
              height: 150,
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: await fetch(
              new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2')
            ).then((res) => res.arrayBuffer()),
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Inter',
            data: await fetch(
              new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2')
            ).then((res) => res.arrayBuffer()),
            style: 'normal',
            weight: 600,
          },
          {
            name: 'Inter',
            data: await fetch(
              new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiA.woff2')
            ).then((res) => res.arrayBuffer()),
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    
    // Fallback error image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1A1A1A',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD700 100%)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: 16,
            }}
          >
            Oops!
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#FFFFFF',
              opacity: 0.8,
              textAlign: 'center',
            }}
          >
            Could not load preview
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}