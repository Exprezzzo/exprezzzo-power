'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apiResult, setApiResult] = useState('');
  const [spotsLeft, setSpotsLeft] = useState(7);
  const [lightningStrike, setLightningStrike] = useState(false);

  useEffect(() => {
    // Lightning strike every 3 seconds
    const interval = setInterval(() => {
      setLightningStrike(true);
      setTimeout(() => setLightningStrike(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoined(true);
    setSpotsLeft(prev => prev - 1);
  };

  const testAPI = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'What makes Exprezzzo Power revolutionary?' })
      });
      const data = await response.json();
      setApiResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResult('Error: ' + error);
    }
    setTesting(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: lightningStrike ? '#0a0a0a' : '#000',
      color: 'white',
      fontFamily: 'Arial Black, sans-serif',
      overflow: 'hidden',
      position: 'relative',
      transition: 'background 0.3s'
    }}>
      {/* Lightning Flash Effect */}
      {lightningStrike && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.8)',
          zIndex: 100,
          pointerEvents: 'none',
          animation: 'flash 0.2s ease-out'
        }} />
      )}

      {/* Animated Lightning Bolts */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Red Lightning */}
        <div style={{
          position: 'absolute',
          left: '20%',
          top: '-100px',
          fontSize: '200px',
          color: '#ff0000',
          textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 60px #ff0000',
          animation: 'lightning1 4s infinite',
          opacity: 0
        }}>⚡</div>
        
        {/* Blue Lightning */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '-100px',
          fontSize: '250px',
          color: '#00ffff',
          textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #00ffff',
          animation: 'lightning2 4s infinite 1s',
          opacity: 0
        }}>⚡</div>
        
        {/* Purple Lightning */}
        <div style={{
          position: 'absolute',
          left: '70%',
          top: '-100px',
          fontSize: '180px',
          color: '#ff00ff',
          textShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff',
          animation: 'lightning3 4s infinite 2s',
          opacity: 0
        }}>⚡</div>
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '40px 20px' }}>
        {/* Epic Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '120px', 
            margin: '0',
            fontWeight: '900',
            letterSpacing: '-5px',
            textTransform: 'uppercase',
            background: 'linear-gradient(45deg, #ff0000, #00ffff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'glow 2s ease-in-out infinite',
            textShadow: '0 0 80px rgba(255,255,255,0.5)'
          }}>
            EXPREZZZO
          </h1>
          
          <div style={{
            fontSize: '80px',
            fontWeight: '900',
            color: '#fff',
            textShadow: '0 0 20px #fff, 0 0 40px #fff, 0 0 60px #fff',
            animation: 'pulse 2s infinite',
            marginTop: '-20px'
          }}>
            POWER
          </div>
          
          <div style={{
            fontSize: '24px',
            marginTop: '20px',
            color: '#ffff00',
            textShadow: '0 0 10px #ffff00',
            animation: 'flicker 3s infinite'
          }}>
            ⚡ ONE API • ALL AI • 40% CHEAPER ⚡
          </div>
        </div>

        {/* Glowing Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '40px',
          marginBottom: '60px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold',
              color: '#00ff00',
              textShadow: '0 0 20px #00ff00'
            }}>
              234ms
            </div>
            <div style={{ color: '#666' }}>LIGHTNING FAST</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold',
              color: '#ff0000',
              textShadow: '0 0 20px #ff0000'
            }}>
              99.9%
            </div>
            <div style={{ color: '#666' }}>UPTIME</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold',
              color: '#00ffff',
              textShadow: '0 0 20px #00ffff'
            }}>
              40%
            </div>
            <div style={{ color: '#666' }}>SAVINGS</div>
          </div>
        </div>

        {/* Signup Form */}
        {!joined ? (
          <div style={{ maxWidth: '500px', margin: '0 auto 60px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 0 40px rgba(255,255,255,0.2)'
            }}>
              <div style={{
                fontSize: '20px',
                textAlign: 'center',
                marginBottom: '20px',
                color: '#ffff00',
                textShadow: '0 0 10px #ffff00',
                animation: 'blink 1s infinite'
              }}>
                ⚡ ONLY {spotsLeft} FOUNDING SPOTS LEFT ⚡
              </div>
              
              <form onSubmit={handleJoin}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '20px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '2px solid #00ffff',
                    borderRadius: '10px',
                    color: 'white',
                    marginBottom: '20px',
                    boxSizing: 'border-box',
                    boxShadow: '0 0 20px rgba(0,255,255,0.5)'
                  }}
                />
                
                <button 
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '24px',
                    background: 'linear-gradient(45deg, #ff0000, #ff00ff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 30px rgba(255,0,255,0.7)',
                    animation: 'pulse 2s infinite',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ⚡ CLAIM POWER ACCESS - $99/mo ⚡
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ 
            maxWidth: '500px',
            margin: '0 auto 60px',
            background: 'linear-gradient(45deg, #00ff00, #00ffff)',
            padding: '30px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(0,255,255,0.7)'
          }}>
            <h2 style={{ fontSize: '36px', margin: 0 }}>⚡ POWER ACTIVATED! ⚡</h2>
            <p style={{ fontSize: '20px' }}>Welcome, Founding Member #{8 - spotsLeft}!</p>
          </div>
        )}

        {/* Demo Button */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={testAPI}
            disabled={testing}
            style={{
              padding: '20px 40px',
              fontSize: '20px',
              background: 'transparent',
              color: '#00ff00',
              border: '2px solid #00ff00',
              borderRadius: '10px',
              cursor: testing ? 'wait' : 'pointer',
              textShadow: '0 0 10px #00ff00',
              boxShadow: '0 0 20px rgba(0,255,0,0.5)',
              transition: 'all 0.3s',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#00ff00';
              e.currentTarget.style.color = '#000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#00ff00';
            }}
          >
            {testing ? '⚡ CHARGING...' : '🔥 TRY LIVE DEMO'}
          </button>

          {apiResult && (
            <pre style={{ 
              background: 'rgba(0,255,0,0.1)',
              border: '2px solid #00ff00',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px',
              textAlign: 'left',
              maxWidth: '800px',
              margin: '20px auto',
              overflow: 'auto',
              color: '#00ff00',
              textShadow: '0 0 5px #00ff00'
            }}>
              {apiResult}
            </pre>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes lightning1 {
          0%, 100% { opacity: 0; transform: translateY(-100px); }
          10% { opacity: 1; transform: translateY(300px); }
          11% { opacity: 0; transform: translateY(600px); }
        }
        
        @keyframes lightning2 {
          0%, 100% { opacity: 0; transform: translateY(-100px); }
          10% { opacity: 1; transform: translateY(400px); }
          11% { opacity: 0; transform: translateY(700px); }
        }
        
        @keyframes lightning3 {
          0%, 100% { opacity: 0; transform: translateY(-100px); }
          10% { opacity: 1; transform: translateY(350px); }
          11% { opacity: 0; transform: translateY(650px); }
        }
        
        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.5); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}