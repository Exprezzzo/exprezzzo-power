'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'POWER123';
  const referralUrl = `https://exprezzzo-power.vercel.app/?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-brand text-3xl gold-gradient-text mb-6">Referrals</h1>
      
      <div className="surface rounded-xl p-8">
        <h2 className="font-brand text-xl mb-4">Your Referral Link</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralUrl}
            readOnly
            className="flex-1 p-3 rounded-lg bg-transparent border border-gold/20"
          />
          <button
            onClick={copyToClipboard}
            className="cta-button flex items-center gap-2"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}