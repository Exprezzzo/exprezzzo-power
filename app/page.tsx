// app/page.tsx
// Corrected to use a default import for PaymentButton.
// This is your main landing page component.

'use client'; // Ensure this is present if any client-side hooks are used

import React from 'react';
import PaymentButton from '@/components/PaymentButton'; // CORRECTED: Default import for PaymentButton

// Assuming you have other components or styles on your landing page
// like HeroSection, Features, Pricing, etc.
// Add any other necessary imports here, e.g.:
// import HeroSection from '@/components/HeroSection';
// import FeaturesSection from '@/components/FeaturesSection';
// import PricingSection from '@/components/PricingSection';

export default function HomePage() { // Renamed from 'Home' if your file was just `Home`
  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1a1a2e, #0f0f1d, #000)',
      color: 'white',
      fontFamily: 'Inter, sans-serif', // Assuming Inter font or similar
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      {/* Main Landing Page Content */}
      <section style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '50px' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '20px', color: '#c55ff7', textShadow: '0 0 10px rgba(197, 95, 247, 0.5)' }}>
          ⚡ Exprezzzo Power
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '40px', color: '#aaa' }}>
          One API for All AI. Save 40% on AI API costs with intelligent routing.
        </p>

        {/* Render the PaymentButton */}
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
          <PaymentButton priceId="price_1PgJHPGBnsaQSoj8jHiDhC" /> {/* Use your actual Stripe Price ID */}
        </div>

        {/* Add more sections for Features, Testimonials, FAQ, etc. */}
        <section style={{ marginTop: '80px', borderTop: '1px solid #333', paddingTop: '40px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '30px', color: '#fff' }}>Key Features</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <li style={{ background: '#2a2a3e', padding: '20px', borderRadius: '10px' }}>Unified API for LLMs</li>
            <li style={{ background: '#2a2a3e', padding: '20px', borderRadius: '10px' }}>Secure Authentication</li>
            <li style={{ background: '#2a2a3e', padding: '20px', borderRadius: '10px' }}>Instant Stripe Payments</li>
            <li style={{ background: '#2a2a3e', padding: '20px', borderRadius: '10px' }}>Real-Time Analytics</li>
          </ul>
        </section>

        {/* Footer or contact info */}
        <footer style={{ marginTop: '100px', fontSize: '0.9rem', color: '#666' }}>
          &copy; 2025 Exprezzzo Power. All rights reserved.
        </footer>
      </section>
    </main>
  );
}