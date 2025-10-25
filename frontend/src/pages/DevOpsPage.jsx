import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, Server, TrendingUp, Brain, Gauge } from 'lucide-react';

const DevOpsPage = () => {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    // Fixed: Using absolute path for navigation
    navigate(`/dashboard/${path}`);
  };

  const stats = [
    { label: 'Active Containers', value: '12', icon: <Server size={24} />, color: '#3b82f6' },
    { label: 'Students Online', value: '47', icon: <Users size={24} />, color: '#10b981' },
    { label: 'System Uptime', value: '98%', icon: <Activity size={24} />, color: '#f59e0b' },
  ];

  const managementCards = [
    {
      title: 'Simulation Manager',
      description: 'Create and configure simulations',
      icon: <Server size={32} />,
      color: '#7c3aed',
      path: 'manage-simulations'
    },
    {
      title: 'Student Analytics',
      description: 'Track student performance',
      icon: <TrendingUp size={32} />,
      color: '#3b82f6',
      path: 'view-progress'
    },
    {
      title: 'Assignment Builder',
      description: 'Design learning modules',
      icon: <Brain size={32} />,
      color: '#f97316',
      path: 'create-assignments'
    }
  ];

  return (
    <div style={{ padding: '30px', background: '#f3f4f6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          IntelliScaleSim Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Kubernetes Auto-Scaling Education Platform
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px' 
      }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div style={{ 
              padding: '12px', 
              borderRadius: '10px', 
              background: `${stat.color}15`,
              color: stat.color 
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Management Cards */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
          Management Tools
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {managementCards.map((card, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(card.path)}
              style={{
                background: 'white',
                padding: '28px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = card.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                background: `${card.color}15`,
                color: card.color,
                width: 'fit-content',
                marginBottom: '16px'
              }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                {card.title}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* System Monitoring */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Gauge size={24} color="#7c3aed" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
              CPU Usage
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>
            45%
          </div>
          <div style={{ 
            height: '8px', 
            background: '#e5e7eb', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              width: '45%', 
              background: 'linear-gradient(90deg, #7c3aed, #4c1d95)',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Activity size={24} color="#3b82f6" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
              Memory Usage
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            62%
          </div>
          <div style={{ 
            height: '8px', 
            background: '#e5e7eb', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              width: '62%', 
              background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
              borderRadius: '4px'
            }} />
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div style={{
        background: 'white',
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
          System Architecture
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          {[
            { label: 'Monitoring', sublabel: 'Prometheus metrics', color: '#10b981' },
            { label: 'Prediction', sublabel: 'ML forecasting', color: '#f59e0b' },
            { label: 'Scaling', sublabel: 'Auto-scaling decisions', color: '#3b82f6' },
            { label: 'Execution', sublabel: 'Container orchestration', color: '#7c3aed' }
          ].map((item, index) => (
            <div key={index} style={{
              padding: '16px',
              borderRadius: '8px',
              background: `${item.color}10`,
              border: `2px solid ${item.color}30`
            }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: item.color, marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {item.sublabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DevOpsPage;
