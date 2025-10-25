import { useEffect, useState } from 'react';
import { Users, Settings, Activity, Shield, Database, Server } from 'lucide-react';
import DashboardStats from '../components/dashboard/DashboardStats';
import { getContainers, getAutoscalerStatus, getHealth } from '../api/api';

const AdminPage = () => {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '120' },
    { label: 'System Health', value: '85%' },
    { label: 'Active Configs', value: '7' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [containers, autoscaler, health] = await Promise.all([
          getContainers(),
          getAutoscalerStatus(),
          getHealth()
        ]);
        
        const totalUsers = 120; // Mock data
        const systemHealth = health.data.docker_connected ? 85 : 0;
        const activeConfigs = autoscaler.data.replica_groups_count || 0;
        
        setStats([
          { label: 'Total Users', value: totalUsers.toString() },
          { label: 'System Health', value: `${systemHealth}%` },
          { label: 'Active Configs', value: activeConfigs.toString() }
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const adminActions = [
    { icon: Users, label: 'Manage Users', desc: 'Add, edit, and manage user accounts', color: '#8b5cf6' },
    { icon: Activity, label: 'System Stats', desc: 'View detailed system metrics', color: '#3b82f6' },
    { icon: Settings, label: 'Configure Settings', desc: 'System-wide configuration', color: '#f59e0b' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Shield style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.25rem' }}>
            Admin Panel
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage users, system stats, and configuration settings for IntelliScaleSim.
          </p>
        </div>
      </div>

      <DashboardStats stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {adminActions.map((action, idx) => (
          <button
            key={idx}
            className="card"
            style={{
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
              <action.icon style={{ width: '4rem', height: '4rem', color: action.color, marginBottom: '1rem' }} />
              <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#4c1d95', marginBottom: '0.5rem' }}>
                {action.label}
              </span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                {action.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#4c1d95', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
            User Distribution
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            [Pie Chart] - Breakdown by user role
          </p>
          <div style={{ 
            padding: '1rem', 
            background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)',
            borderRadius: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Students</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4c1d95' }}>95</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Teachers</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4c1d95' }}>22</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Admins</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4c1d95' }}>3</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#4c1d95', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
            System Metrics
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            [Metrics Chart] - Real-time system performance
          </p>
          <div style={{ 
            padding: '1rem', 
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            borderRadius: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>API Requests/min</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e3a8a' }}>1,247</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>Active Sessions</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e3a8a' }}>89</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>Uptime</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e3a8a' }}>99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
