'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Users, Zap, MessageSquare, DollarSign, 
  TrendingUp, TrendingDown, Activity, AlertCircle 
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, logOut } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadMetrics();
      const interval = setInterval(loadMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, router, timeRange]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/analytics/metrics?range=${timeRange}`);
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center'>
        <div className='text-[#FFD700] text-2xl animate-pulse'>Loading Dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center'>
        <div className='text-[#FFD700] text-2xl animate-pulse'>Loading Analytics...</div>
      </div>
    );
  }

  const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];

  return (
    <div className='min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]'>
              Analytics Dashboard
            </h1>
            <p className='text-gray-400 mt-2'>Welcome back, {user.email}</p>
          </div>
          
          <div className='flex gap-4'>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className='bg-black/50 text-[#FFD700] border border-[#FFD700]/30 rounded-lg px-4 py-2'
            >
              <option value='1h'>Last Hour</option>
              <option value='24h'>Last 24 Hours</option>
              <option value='7d'>Last 7 Days</option>
              <option value='30d'>Last 30 Days</option>
            </select>
            
            <button
              onClick={logOut}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <MetricCard
            title='Active Users'
            value={metrics?.activeNow || 0}
            change='+12%'
            icon={<Users className='w-6 h-6' />}
            trend='up'
          />
          <MetricCard
            title='Avg Response'
            value={`${metrics?.avgResponseTime || 0}ms`}
            change='-5%'
            icon={<Zap className='w-6 h-6' />}
            trend='down'
          />
          <MetricCard
            title='Total Messages'
            value={(metrics?.totalMessages || 0).toLocaleString()}
            change='+23%'
            icon={<MessageSquare className='w-6 h-6' />}
            trend='up'
          />
          <MetricCard
            title='Cost Today'
            value={`$${(metrics?.costToday || 0).toFixed(2)}`}
            change='+8%'
            icon={<DollarSign className='w-6 h-6' />}
            trend='up'
          />
        </div>

        {/* Charts Row 1 */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* Model Usage Pie Chart */}
          <Card className='bg-black/50 backdrop-blur-xl border-[#FFD700]/20'>
            <CardHeader>
              <CardTitle className='text-[#FFD700]'>Model Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={metrics?.modelUsage || []}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {(metrics?.modelUsage || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className='bg-black/50 backdrop-blur-xl border-[#FFD700]/20'>
            <CardHeader>
              <CardTitle className='text-[#FFD700]'>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={metrics?.hourlyActivity || []}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#333' />
                  <XAxis dataKey='hour' stroke='#FFD700' />
                  <YAxis stroke='#FFD700' />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FFD700' }}
                    labelStyle={{ color: '#FFD700' }}
                  />
                  <Line 
                    type='monotone' 
                    dataKey='messages' 
                    stroke='#FFD700' 
                    strokeWidth={2}
                    dot={{ fill: '#FFD700', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Model Performance Table */}
        <Card className='bg-black/50 backdrop-blur-xl border-[#FFD700]/20 mb-6'>
          <CardHeader>
            <CardTitle className='text-[#FFD700]'>Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-[#FFD700]/20'>
                    <th className='text-left py-3 px-4 text-[#FFD700]'>Model</th>
                    <th className='text-right py-3 px-4 text-[#FFD700]'>Requests</th>
                    <th className='text-right py-3 px-4 text-[#FFD700]'>Avg Time</th>
                    <th className='text-right py-3 px-4 text-[#FFD700]'>Success Rate</th>
                    <th className='text-right py-3 px-4 text-[#FFD700]'>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.topModels || []).map((model, idx) => (
                    <tr key={idx} className='border-b border-[#FFD700]/10'>
                      <td className='py-3 px-4 text-white'>{model.model}</td>
                      <td className='text-right py-3 px-4 text-gray-300'>{model.requests.toLocaleString()}</td>
                      <td className='text-right py-3 px-4 text-gray-300'>{model.avgTime}ms</td>
                      <td className='text-right py-3 px-4 text-green-400'>98.5%</td>
                      <td className='text-right py-3 px-4 text-gray-300'>${(model.requests * 0.002).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className='bg-black/50 backdrop-blur-xl border-[#FFD700]/20'>
          <CardHeader>
            <CardTitle className='text-[#FFD700]'>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              <HealthIndicator label='API Gateway' status='healthy' latency={12} />
              <HealthIndicator label='Database' status='healthy' latency={8} />
              <HealthIndicator label='Redis Cache' status='warning' latency={45} />
              <HealthIndicator label='Message Queue' status='healthy' latency={3} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon, trend }: any) {
  const isPositive = trend === 'up';
  
  return (
    <Card className='bg-black/50 backdrop-blur-xl border-[#FFD700]/20 hover:border-[#FFD700]/40 transition-all'>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2 bg-[#FFD700]/20 rounded-lg text-[#FFD700]'>
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
            {change}
          </div>
        </div>
        <div className='text-3xl font-bold text-white mb-1'>{value}</div>
        <div className='text-sm text-gray-400'>{title}</div>
      </CardContent>
    </Card>
  );
}

function HealthIndicator({ label, status, latency }: any) {
  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };
  
  return (
    <div className='p-4 rounded-lg bg-black/30'>
      <div className='flex items-center gap-3 mb-2'>
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} animate-pulse`} />
        <span className='text-white font-medium'>{label}</span>
      </div>
      <div className='text-sm text-gray-400'>Latency: {latency}ms</div>
      <div className='text-xs text-gray-500 capitalize'>{status}</div>
    </div>
  );
}
