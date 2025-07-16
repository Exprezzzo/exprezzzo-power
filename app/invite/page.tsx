'use client';
import { useSearchParams } from 'next/navigation';

export default function InvitePage() {
  const searchParams = useSearchParams();
  const price = searchParams.get('price') || '299';
  const code = searchParams.get('code') || 'POWER';
  
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#000',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(45deg, #ef4444, #a855f7)',
        padding: '3px',
        borderRadius: '16px'
      }}>
        <div style={{
          background: '#000',
          padding: '40px',
          borderRadius: '13px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h1>🎁 Exclusive Invite</h1>
          <p style={{ fontSize: '24px', margin: '20px 0' }}>
            Your special price: <strong>${price}/month</strong>
          </p>
          <p style={{ color: '#999' }}>
            Invite code: <code style={{ background: '#333', padding: '5px 10px', borderRadius: '4px' }}>{code}</code>
          </p>
          <button style={{
            marginTop: '20px',
            padding: '16px 32px',
            fontSize: '18px',
            background: '#22c55e',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Claim This Offer
          </button>
        </div>
      </div>
    </div>
  );
}