'use client';

import { useState, useEffect } from 'react';
import { Copy, Users, Gift, TrendingUp, Check } from 'lucide-react';

interface ReferralData {
  code: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production this would come from Firebase/Firestore
    setReferralData({
      code: 'POWER-ABC123',
      totalReferrals: 12,
      activeReferrals: 8,
      totalEarnings: 240.00,
      pendingEarnings: 85.50,
    });
    setLoading(false);
  }, []);

  const copyReferralCode = async () => {
    if (referralData?.code) {
      await navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateNewCode = async () => {
    // In production, this would call an API to generate a new code
    const newCode = `POWER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setReferralData(prev => prev ? { ...prev, code: newCode } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vegas-gold mx-auto mb-4"></div>
          <p className="text-muted">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gold-gradient-text mb-4">
            Share the Power
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Earn 20% commission on every referral. Your friends save money, you earn rewards.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Total Referrals</span>
            </div>
            <p className="text-2xl font-bold text-white">{referralData?.totalReferrals || 0}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Active Referrals</span>
            </div>
            <p className="text-2xl font-bold text-white">{referralData?.activeReferrals || 0}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold text-white">${referralData?.totalEarnings || 0}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Pending Earnings</span>
            </div>
            <p className="text-2xl font-bold text-white">${referralData?.pendingEarnings || 0}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Referral Code Card */}
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <h2 className="text-xl font-semibold text-white mb-4">Your Referral Code</h2>
            
            <div className="bg-bg-dark-secondary rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <code className="text-vegas-gold font-mono text-lg">{referralData?.code}</code>
                <button
                  onClick={copyReferralCode}
                  className="flex items-center gap-2 px-3 py-1 bg-vegas-gold text-bg-dark rounded text-sm font-medium hover:bg-vegas-gold-light transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-muted">Share this code with friends to get started:</p>
              <div className="bg-bg-dark-secondary rounded-lg p-3">
                <code className="text-white text-sm">
                  https://exprezzz.power/signup?ref={referralData?.code}
                </code>
              </div>
            </div>

            <button
              onClick={generateNewCode}
              className="btn-gold w-full"
            >
              Generate New Code
            </button>
          </div>

          {/* How it Works */}
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <h2 className="text-xl font-semibold text-white mb-6">How It Works</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-vegas-gold text-bg-dark rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Share Your Code</h3>
                  <p className="text-muted text-sm">Send your referral code to friends and colleagues</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-vegas-gold text-bg-dark rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">They Sign Up</h3>
                  <p className="text-muted text-sm">Your friends get 7 days free trial when they use your code</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-vegas-gold text-bg-dark rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">You Earn</h3>
                  <p className="text-muted text-sm">Get 20% commission on their subscription for 12 months</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-vegas-gold text-bg-dark rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Get Paid</h3>
                  <p className="text-muted text-sm">Earnings are paid out monthly via PayPal or bank transfer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="mt-8 surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Referrals</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="text-left text-muted pb-3">Date</th>
                  <th className="text-left text-muted pb-3">User</th>
                  <th className="text-left text-muted pb-3">Plan</th>
                  <th className="text-left text-muted pb-3">Commission</th>
                  <th className="text-left text-muted pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b border-gold/10">
                  <td className="py-3 text-white">2024-01-15</td>
                  <td className="py-3 text-white">user***@email.com</td>
                  <td className="py-3 text-white">Yearly</td>
                  <td className="py-3 text-vegas-gold">$79.80</td>
                  <td className="py-3">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Active
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gold/10">
                  <td className="py-3 text-white">2024-01-10</td>
                  <td className="py-3 text-white">friend***@company.com</td>
                  <td className="py-3 text-white">Monthly</td>
                  <td className="py-3 text-vegas-gold">$9.80</td>
                  <td className="py-3">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      Pending
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-white">2024-01-05</td>
                  <td className="py-3 text-white">colleague***@startup.io</td>
                  <td className="py-3 text-white">Yearly</td>
                  <td className="py-3 text-vegas-gold">$79.80</td>
                  <td className="py-3">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
