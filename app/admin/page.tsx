'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 3,
    activeKeys: 2,
    apiCalls: 1847,
    revenue: 297,
    savedByUsers: 127
  });

  useEffect(() => {
    // Check auth
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      router.push('/login');
    }
    
    // Simulate live updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 10),
        savedByUsers: prev.savedByUsers + Math.floor(Math.random() * 5)
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#000',
      color: 'white',
      padding: '40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{ fontSize: '48px', margin: 0 }}>⚡ Power Grid Admin</h1>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#333',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ color: '#666', margin: '0 0 10px 0' }}>Total Users</h3>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{stats.totalUsers}</div>
          </div>
          
          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ color: '#666', margin: '0 0 10px 0' }}>Active API Keys</h3>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{stats.activeKeys}</div>
          </div>
          
          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ color: '#666', margin: '0 0 10px 0' }}>API Calls Today</h3>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{stats.apiCalls}</div>
          </div>
          
          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ color: '#666', margin: '0 0 10px 0' }}>Monthly Revenue</h3>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#22c55e' }}>
              ${stats.revenue}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          background: '#1a1a1a', 
          padding: '30px', 
          borderRadius: '16px',
          marginBottom: '40px'
        }}>
          <h2>Quick Actions</h2>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button style={{
              padding: '15px 30px',
              background: '#22c55e',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}>
              + Create API Key
            </button>
            
            <button style={{
              padding: '15px 30px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}>
              Generate Invite Link
            </button>
            
            <button style={{
              padding: '15px 30px',
              background: '#a855f7',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}>
              Export User List
            </button>
          </div>
        </div>

        {/* Recent Users */}
        <div style={{ 
          background: '#1a1a1a', 
          padding: '30px', 
          borderRadius: '16px'
        }}>
          <h2>Recent Signups</h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Plan</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>API Key</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '15px' }}>john@example.com</td>
                  <td style={{ padding: '15px' }}>Founding ($99)</td>
                  <td style={{ padding: '15px' }}><code>pk_john_001</code></td>
                  <td style={{ padding: '15px', color: '#22c55e' }}>Active</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '15px' }}>sarah@company.com</td>
                  <td style={{ padding: '15px' }}>Founding ($99)</td>
                  <td style={{ padding: '15px' }}><code>pk_sarah_002</code></td>
                  <td style={{ padding: '15px', color: '#22c55e' }}>Active</td>
                </tr>
                <tr>
                  <td style={{ padding: '15px' }}>mike@startup.io</td>
                  <td style={{ padding: '15px' }}>Trial</td>
                  <td style={{ padding: '15px' }}><code>pk_trial_003</code></td>
                  <td style={{ padding: '15px', color: '#f59e0b' }}>Pending Payment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}