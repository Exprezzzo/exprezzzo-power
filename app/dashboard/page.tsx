'use client';

import { useState, useEffect } from 'react';
import { User, CreditCard, Activity, TrendingUp, Clock, Star } from 'lucide-react';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  subscription: {
    plan: string;
    status: 'active' | 'cancelled' | 'past_due';
    nextBilling: string;
    usage: number;
    limit: number;
  };
}

interface UsageMetrics {
  totalCalls: number;
  thisMonth: number;
  averageResponseTime: number;
  favoriteModel: string;
  costSavings: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production this would come from Firebase/Firestore
    setProfile({
      uid: 'user123',
      email: 'user@example.com',
      displayName: 'John Doe',
      subscription: {
        plan: 'Yearly',
        status: 'active',
        nextBilling: '2024-12-01',
        usage: 850,
        limit: 15000,
      },
    });

    setMetrics({
      totalCalls: 2350,
      thisMonth: 850,
      averageResponseTime: 1.2,
      favoriteModel: 'GPT-4',
      costSavings: 127.45,
    });

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vegas-gold mx-auto mb-4"></div>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile || !metrics) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard Unavailable</h1>
          <p className="text-muted">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const usagePercentage = (profile.subscription.usage / profile.subscription.limit) * 100;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gold-gradient-text mb-2">
            Welcome back, {profile.displayName}!
          </h1>
          <p className="text-muted">Here's your Exprezzz Power dashboard overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Total API Calls</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.totalCalls.toLocaleString()}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Avg Response Time</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.averageResponseTime}s</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <Star className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Favorite Model</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.favoriteModel}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Cost Savings</span>
            </div>
            <p className="text-2xl font-bold text-white">${metrics.costSavings}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-vegas-gold" size={24} />
              <h2 className="text-xl font-semibold text-white">Profile</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-muted text-sm">Email</label>
                <p className="text-white">{profile.email}</p>
              </div>
              
              <div>
                <label className="text-muted text-sm">Display Name</label>
                <p className="text-white">{profile.displayName}</p>
              </div>
              
              <div>
                <label className="text-muted text-sm">User ID</label>
                <p className="text-white font-mono text-sm">{profile.uid}</p>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-vegas-gold" size={24} />
              <h2 className="text-xl font-semibold text-white">Subscription</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-muted text-sm">Plan</label>
                <p className="text-white font-semibold">{profile.subscription.plan}</p>
              </div>
              
              <div>
                <label className="text-muted text-sm">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.subscription.status.charAt(0).toUpperCase() + profile.subscription.status.slice(1)}
                </span>
              </div>
              
              <div>
                <label className="text-muted text-sm">Next Billing</label>
                <p className="text-white">{new Date(profile.subscription.nextBilling).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="text-muted text-sm mb-2 block">Usage This Month</label>
                <div className="w-full bg-bg-dark-secondary rounded-full h-2">
                  <div 
                    className="bg-vegas-gold h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted mt-1">
                  {profile.subscription.usage.toLocaleString()} / {profile.subscription.limit.toLocaleString()} calls
                  ({usagePercentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Chart Placeholder */}
        <div className="mt-8 surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
          <h2 className="text-xl font-semibold text-white mb-4">Usage Overview</h2>
          <div className="h-64 flex items-center justify-center border border-dashed border-gold/30 rounded-lg">
            <div className="text-center">
              <Activity className="text-vegas-gold mx-auto mb-2" size={32} />
              <p className="text-muted">Usage chart will be available soon</p>
              <p className="text-sm text-muted">Track your API usage and performance metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}