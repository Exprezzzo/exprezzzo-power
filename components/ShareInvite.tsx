// components/ShareInvite.tsx
'use client';

import { useState } from 'react';
import { Share2, Copy, Mail, MessageCircle, Twitter, Linkedin } from 'lucide-react';

interface ShareInviteProps {
  referralCode?: string;
  userId?: string;
}

export default function ShareInvite({ referralCode, userId }: ShareInviteProps) {
  const [copied, setCopied] = useState(false);

  // Dynamically construct app URL using window.location.origin
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://exprezzzo.com'; // Fallback for SSR

  const referralLink = `${appBaseUrl}/invite?ref=${referralCode || userId || 'default'}`;
  const shareMessage = "Join me on Exprezzzo Power - One API for all AI models. Save 40% on AI costs!";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = {
    email: `mailto:?subject=Check out Exprezzzo Power&body=${encodeURIComponent(shareMessage + '\n\n' + referralLink)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralLink)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + referralLink)}`,
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5" />
        Invite Friends & Earn Rewards
      </h3>

      <p className="text-gray-400 mb-6">
        Share your referral link and earn credits when friends sign up!
      </p>

      {/* Referral Link */}
      <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2 mb-6">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 bg-transparent text-sm"
        />
        <button
          onClick={copyToClipboard}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-all"
        >
          {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          href={shareVia.email}
          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-all"
        >
          <Mail className="w-5 h-5" />
          <span className="text-sm">Email</span>
        </a>

        <a
          href={shareVia.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-all"
        >
          <Twitter className="w-5 h-5" />
          <span className="text-sm">Twitter</span>
        </a>

        <a
          href={shareVia.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-all"
        >
          <Linkedin className="w-5 h-5" />
          <span className="text-sm">LinkedIn</span>
        </a>

        <a
          href={shareVia.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">WhatsApp</span>
        </a>
      </div>

      {/* Referral Stats */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-sm text-gray-400">Invites Sent</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-sm text-gray-400">Friends Joined</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">$0</div>
            <div className="text-sm text-gray-400">Credits Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
}
