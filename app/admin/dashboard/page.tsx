'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, TrendingUp, AlertTriangle, Settings } from 'lucide-react';

interface PlatformMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalApiCalls: number;
  averageMargin: number;
  modelUsage: { model: string; percentage: number; calls: number }[];
  recentAlerts: string[];
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production this would come from Firebase/Firestore
    setMetrics({
      totalUsers: 1247,
      activeSubscriptions: 892,
      totalRevenue: 45672.30,
      monthlyRevenue: 8934.50,
      totalApiCalls: 2847293,
      averageMargin: 67.4,
      modelUsage: [
        { model: 'GPT-4 Turbo', percentage: 35, calls: 996003 },
        { model: 'Claude 3 Sonnet', percentage: 28, calls: 797242 },
        { model: 'Gemini Pro', percentage: 22, calls: 623965 },
        { model: 'GPT-3.5 Turbo', percentage: 15, calls: 429765 },
      ],
      recentAlerts: [
        'User margin below 50% threshold: user@company.com',
        'High API usage detected: startup@tech.io (2.3x normal)',
        'Payment failed: retry needed for monthly subscription',
      ],
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vegas-gold mx-auto mb-4"></div>
          <p className="text-muted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-muted">Admin access required to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gold-gradient-text mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted">Exprezzz Power Platform Overview</p>
          </div>
          <button className="btn-vegas-gold">
            <Settings size={18} className="mr-2" />
            Platform Settings
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Monthly Revenue</span>
            </div>
            <p className="text-2xl font-bold text-white">${metrics.monthlyRevenue.toLocaleString()}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">API Calls</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.totalApiCalls.toLocaleString()}</p>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-vegas-gold" size={20} />
              <span className="text-muted text-sm">Avg Margin</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.averageMargin}%</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Overview */}
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <h2 className="text-xl font-semibold text-white mb-4">Revenue Overview</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-muted text-sm">Total Revenue</label>
                <p className="text-2xl font-bold text-vegas-gold">${metrics.totalRevenue.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-muted text-sm">Active Subscriptions</label>
                <p className="text-xl text-white">{metrics.activeSubscriptions.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-muted text-sm">Conversion Rate</label>
                <p className="text-xl text-white">
                  {((metrics.activeSubscriptions / metrics.totalUsers) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Model Usage */}
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20">
            <h2 className="text-xl font-semibold text-white mb-4">Model Usage</h2>
            
            <div className="space-y-4">
              {metrics.modelUsage.map((model) => (
                <div key={model.model}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-sm">{model.model}</span>
                    <span className="text-muted text-sm">{model.percentage}%</span>
                  </div>
                  <div className="w-full bg-bg-dark-secondary rounded-full h-2">
                    <div 
                      className="bg-vegas-gold h-2 rounded-full transition-all duration-300"
                      style={{ width: `${model.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted mt-1">{model.calls.toLocaleString()} calls</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-vegas-gold" size={20} />
            <h2 className="text-xl font-semibold text-white">Recent Alerts</h2>
          </div>
          
          <div className="space-y-3">
            {metrics.recentAlerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-bg-dark-secondary rounded-lg">
                <AlertTriangle className="text-orange-400 flex-shrink-0" size={16} />
                <span className="text-white text-sm">{alert}</span>
                <button className="ml-auto text-vegas-gold hover:text-vegas-gold-light text-sm">
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
            <p className="text-muted text-sm mb-4">Manage user accounts and permissions</p>
            <button className="btn-vegas-gold w-full">
              Manage Users
            </button>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Billing & Payments</h3>
            <p className="text-muted text-sm mb-4">Handle subscriptions and payment issues</p>
            <button className="btn-vegas-gold w-full">
              View Billing
            </button>
          </div>

          <div className="surface rounded-xl p-6 backdrop-blur-sm border border-gold/20 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">System Health</h3>
            <p className="text-muted text-sm mb-4">Monitor API performance and uptime</p>
            <button className="btn-vegas-gold w-full">
              View Metrics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}