'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Server, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield
} from 'lucide-react';

// Mock data - in real app, this would come from API
const mockStats = {
  totalUsers: 15847,
  activeUsers: 12304,
  totalRevenue: 89247.32,
  monthlyRevenue: 23891.45,
  totalRequests: 2847392,
  successRate: 99.7,
  avgResponseTime: 245,
  costSavings: 1293847.22
};

const mockProviderStats = [
  { name: 'Kani', requests: 1245893, uptime: 99.9, avgCost: 0.002 },
  { name: 'OpenAI GPT-4', requests: 892847, uptime: 99.5, avgCost: 0.018 },
  { name: 'Claude 3.5', requests: 534782, uptime: 99.8, avgCost: 0.008 },
  { name: 'Cohere R+', requests: 173870, uptime: 98.7, avgCost: 0.0015 }
];

const mockRecentActivity = [
  { id: 1, user: 'dev_sarah_2024', action: 'API call', provider: 'Kani', cost: 0.0023, time: '2 min ago' },
  { id: 2, user: 'team_buildco', action: 'API call', provider: 'GPT-4', cost: 0.0187, time: '3 min ago' },
  { id: 3, user: 'startup_xyz', action: 'New signup', provider: 'N/A', cost: 0, time: '5 min ago' },
  { id: 4, user: 'enterprise_abc', action: 'API call', provider: 'Claude', cost: 0.0082, time: '7 min ago' },
  { id: 5, user: 'dev_alex_99', action: 'API call', provider: 'Cohere', cost: 0.0015, time: '8 min ago' }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockStats);
  const [providerStats, setProviderStats] = useState(mockProviderStats);
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity);
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate-dark via-chocolate-darker to-black text-white">
      {/* Header */}
      <div className="border-b border-chocolate-surface/30 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
                  EXPREZZZ
                </span>{' '}
                Admin Dashboard
              </h1>
              <p className="text-gray-400">Real-time system monitoring and analytics</p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-chocolate-surface border border-chocolate-surface/30 rounded-lg px-4 py-2 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-green-300">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-green-400 font-medium">+12.3%</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Users</div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.activeUsers.toLocaleString()} active this month
            </div>
          </div>

          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-gold" />
              <span className="text-xs text-green-400 font-medium">+8.7%</span>
            </div>
            <div className="text-2xl font-bold mb-1">${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Revenue</div>
            <div className="text-xs text-gray-500 mt-2">
              ${stats.monthlyRevenue.toLocaleString()} this month
            </div>
          </div>

          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-green-400" />
              <span className="text-xs text-green-400 font-medium">{stats.successRate}%</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalRequests.toLocaleString()}</div>
            <div className="text-sm text-gray-400">API Requests</div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.avgResponseTime}ms avg response
            </div>
          </div>

          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-green-400 font-medium">52% saved</span>
            </div>
            <div className="text-2xl font-bold mb-1">${stats.costSavings.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Customer Savings</div>
            <div className="text-xs text-gray-500 mt-2">
              vs direct API costs
            </div>
          </div>
        </div>

        {/* Provider Status */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <Server className="w-5 h-5 text-gold" />
              <span>Provider Status</span>
            </h2>
            <div className="space-y-4">
              {providerStats.map((provider) => (
                <div key={provider.name} className="bg-chocolate-surface/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        provider.uptime > 99 ? 'bg-green-400' : 
                        provider.uptime > 98 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <span className="font-medium">{provider.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-400">{provider.uptime}%</span>
                      <span className="text-gray-400">${provider.avgCost.toFixed(4)}/req</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{provider.requests.toLocaleString()} requests</span>
                    <span>Last 24h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gold" />
              <span>Recent Activity</span>
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="bg-chocolate-surface/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.action === 'API call' ? 'bg-green-400' : 
                      activity.action === 'New signup' ? 'bg-blue-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-gray-400">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gold font-medium">
                      {activity.provider !== 'N/A' ? activity.provider : ''}
                    </p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                    {activity.cost > 0 && (
                      <p className="text-xs text-green-400">${activity.cost.toFixed(4)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-gold" />
            <span>System Health</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium text-green-300">All Systems Operational</p>
                <p className="text-sm text-green-400/80">API gateway responding normally</p>
              </div>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-300">Rate Limit Warning</p>
                <p className="text-sm text-yellow-400/80">Cohere provider at 85% capacity</p>
              </div>
            </div>
            
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 flex items-start space-x-3">
              <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-300">Performance Optimized</p>
                <p className="text-sm text-blue-400/80">Auto-routing working efficiently</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <button className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-4 hover:border-gold/50 transition-all duration-200 text-left">
            <Users className="w-8 h-8 text-blue-400 mb-3" />
            <p className="font-medium mb-1">Manage Users</p>
            <p className="text-sm text-gray-400">View and edit user accounts</p>
          </button>
          
          <button className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-4 hover:border-gold/50 transition-all duration-200 text-left">
            <Server className="w-8 h-8 text-green-400 mb-3" />
            <p className="font-medium mb-1">Provider Config</p>
            <p className="text-sm text-gray-400">Configure API providers</p>
          </button>
          
          <button className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-4 hover:border-gold/50 transition-all duration-200 text-left">
            <DollarSign className="w-8 h-8 text-gold mb-3" />
            <p className="font-medium mb-1">Billing Reports</p>
            <p className="text-sm text-gray-400">Revenue and cost analysis</p>
          </button>
          
          <button className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-4 hover:border-gold/50 transition-all duration-200 text-left">
            <Activity className="w-8 h-8 text-purple-400 mb-3" />
            <p className="font-medium mb-1">System Logs</p>
            <p className="text-sm text-gray-400">View detailed system logs</p>
          </button>
        </div>
      </div>
    </div>
  );
}