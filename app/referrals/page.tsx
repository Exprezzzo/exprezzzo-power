'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Users, DollarSign, Gift, TrendingUp, Star, Trophy } from 'lucide-react';

const referralTiers = [
  {
    name: 'Bronze Robin',
    minReferrals: 0,
    commission: 15,
    bonus: 0,
    color: 'from-amber-600 to-amber-700',
    icon: Gift
  },
  {
    name: 'Silver Robin',
    minReferrals: 5,
    commission: 20,
    bonus: 50,
    color: 'from-gray-400 to-gray-500',
    icon: Star
  },
  {
    name: 'Gold Robin',
    minReferrals: 15,
    commission: 25,
    bonus: 150,
    color: 'from-gold to-gold-dark',
    icon: Trophy
  },
  {
    name: 'Diamond Robin',
    minReferrals: 50,
    commission: 35,
    bonus: 500,
    color: 'from-blue-400 to-blue-500',
    icon: Trophy
  }
];

const mockStats = {
  totalReferrals: 12,
  activeReferrals: 8,
  totalEarnings: 245.67,
  thisMonthEarnings: 89.23,
  currentTier: 'Silver Robin',
  nextTier: 'Gold Robin',
  referralsToNextTier: 3
};

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState('ROBIN_DEV123');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(mockStats);

  const referralUrl = `https://exprezzzo.com/register?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform: string) => {
    const text = "Join EXPREZZZ and get 40-60% cheaper AI! Same premium models, Robin Hood pricing 🏹";
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`
    };
    
    window.open((urls as any)[platform], '_blank');
  };

  const currentTierInfo = referralTiers.find(tier => tier.name === stats.currentTier);
  const nextTierInfo = referralTiers.find(tier => tier.name === stats.nextTier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate-dark via-chocolate-darker to-black text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
              Robin Hood
            </span>
            <br />
            Referrals
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Help spread affordable AI to everyone and earn rewards. 
            The more developers you help save money, the more you earn!
          </p>
          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Gift className="w-6 h-6 text-green-400" />
              <span className="text-lg font-semibold">New User Bonus</span>
            </div>
            <p className="text-green-300">
              Your friends get <strong>$10 credit</strong> when they sign up. 
              You get <strong>{currentTierInfo?.commission || 15}% commission</strong> on all their spending!
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-gold mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">{stats.totalReferrals}</div>
            <div className="text-sm text-gray-400">Total Referrals</div>
          </div>
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">{stats.activeReferrals}</div>
            <div className="text-sm text-gray-400">Active This Month</div>
          </div>
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6 text-center">
            <DollarSign className="w-8 h-8 text-gold mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">${stats.totalEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-400">Total Earnings</div>
          </div>
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6 text-center">
            <Star className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">${stats.thisMonthEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-400">This Month</div>
          </div>
        </div>

        {/* Current Tier Status */}
        <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-2xl p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {currentTierInfo && (
                <>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentTierInfo.color} flex items-center justify-center`}>
                    <currentTierInfo.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{stats.currentTier}</h3>
                    <p className="text-sm text-gray-400">{currentTierInfo.commission}% commission rate</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gold">${stats.totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Total earned</div>
            </div>
          </div>

          {nextTierInfo && (
            <div className="border-t border-chocolate-surface/30 pt-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">Progress to {stats.nextTier}</span>
                <span className="text-sm text-gold font-medium">
                  {stats.totalReferrals} / {nextTierInfo.minReferrals} referrals
                </span>
              </div>
              <div className="h-3 bg-chocolate-surface rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-500"
                  style={{ width: `${Math.min((stats.totalReferrals / nextTierInfo.minReferrals) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-300">
                {stats.referralsToNextTier} more referrals to unlock {nextTierInfo.commission}% commission + ${nextTierInfo.bonus} bonus!
              </p>
            </div>
          )}
        </div>

        {/* Referral Tools */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Referral Link */}
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-gold" />
              <span>Your Referral Link</span>
            </h3>
            <div className="space-y-4">
              <div className="bg-chocolate-surface/40 border border-chocolate-surface/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Referral Code</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-black/30 px-3 py-1 rounded text-gold font-mono">
                    {referralCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(referralCode)}
                    className="p-2 bg-gold text-black rounded hover:bg-gold-dark transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-chocolate-surface/40 border border-chocolate-surface/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Full Referral URL</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={referralUrl}
                    readOnly
                    className="flex-1 bg-black/30 px-3 py-2 rounded text-sm font-mono text-gray-300"
                  />
                  <button
                    onClick={() => copyToClipboard(referralUrl)}
                    className={`p-2 rounded transition-all ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gold text-black hover:bg-gold-dark'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {copied && (
                <p className="text-sm text-green-400 flex items-center space-x-1">
                  <span>✓</span>
                  <span>Copied to clipboard!</span>
                </p>
              )}
            </div>
          </div>

          {/* Social Sharing */}
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-gold" />
              <span>Share & Earn</span>
            </h3>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Share EXPREZZZ with your network and help developers save 40-60% on AI costs!
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="text-sm font-medium">Twitter</span>
                </button>
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="text-sm font-medium">LinkedIn</span>
                </button>
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="text-sm font-medium">Facebook</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-gold/10 to-gold-dark/10 border border-gold/20 rounded-lg p-4">
                <p className="text-sm text-gold font-medium mb-2">💡 Pro Tip</p>
                <p className="text-xs text-gray-300">
                  Share in developer communities, Discord servers, and GitHub repositories 
                  where people discuss AI and APIs for maximum impact!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Tiers */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Referral Tiers & Rewards</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {referralTiers.map((tier, index) => {
              const IconComponent = tier.icon;
              const isCurrentTier = tier.name === stats.currentTier;
              const isNextTier = tier.name === stats.nextTier;
              
              return (
                <div
                  key={tier.name}
                  className={`bg-chocolate-surface/20 backdrop-blur-sm border rounded-2xl p-6 text-center transition-all duration-300 ${
                    isCurrentTier
                      ? 'border-gold shadow-lg shadow-gold/20 ring-2 ring-gold/30'
                      : isNextTier
                      ? 'border-gold/50'
                      : 'border-chocolate-surface/30 hover:border-chocolate-surface/60'
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="bg-gold text-black px-3 py-1 rounded-full text-xs font-bold">
                        Current
                      </div>
                    </div>
                  )}
                  
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${tier.color} flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{tier.minReferrals}+ referrals</p>
                  
                  <div className="space-y-3">
                    <div className="bg-chocolate-surface/30 rounded-lg p-3">
                      <p className="text-lg font-bold text-gold">{tier.commission}%</p>
                      <p className="text-xs text-gray-400">Commission</p>
                    </div>
                    
                    {tier.bonus > 0 && (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                        <p className="text-lg font-bold text-green-400">${tier.bonus}</p>
                        <p className="text-xs text-gray-400">Tier Bonus</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-gold/10 to-gold-dark/10 border border-gold/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to start earning?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Share your referral link and help developers save money while you earn rewards
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => copyToClipboard(referralUrl)}
                className="bg-gradient-to-r from-gold to-gold-dark text-black px-8 py-4 rounded-lg font-semibold text-lg hover:from-gold-dark hover:to-gold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Share2 className="w-5 h-5" />
                <span>Copy Referral Link</span>
              </button>
              <a
                href="/pricing"
                className="border border-gold text-gold px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-200"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}