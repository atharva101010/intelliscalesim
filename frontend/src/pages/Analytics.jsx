import { useState, useEffect } from 'react';
import { Activity, Container, TrendingUp, Server } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function Analytics() {
  const [metrics, setMetrics] = useState({ total_containers: 0, containers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metrics/containers`);
      if (response.data.success) {
        setMetrics({
          total_containers: response.data.data.totalContainers || 0,
          containers: response.data.data.containers || []
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{width: '100%', minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF, #EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{width: '80px', height: '80px', border: '5px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px'}}></div>
          <p style={{fontSize: '24px', fontWeight: 'bold', color: '#374151'}}>Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{width: '100%', minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF, #EDE9FE)', padding: '40px'}}>
      
      {/* Header */}
      <div style={{width: '100%', background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '40px', marginBottom: '40px', border: '2px solid #E0E7FF'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '30px'}}>
            <div style={{width: '100px', height: '100px', background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)'}}>
              <Activity style={{color: 'white', width: '50px', height: '50px'}} />
            </div>
            <div>
              <h1 style={{fontSize: '48px', fontWeight: '900', color: '#111827', margin: 0}}>Analytics Dashboard</h1>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px'}}>
                <div style={{width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite'}}></div>
                <p style={{fontSize: '18px', color: '#6B7280', margin: 0}}>Live Monitoring • Updates Every 5 Seconds</p>
              </div>
            </div>
          </div>
          <div style={{display: 'flex', gap: '15px'}}>
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" style={{padding: '15px 30px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', fontWeight: 'bold', fontSize: '16px', borderRadius: '15px', border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'}}>
              📊 Grafana
            </a>
            <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer" style={{padding: '15px 30px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white', fontWeight: 'bold', fontSize: '16px', borderRadius: '15px', border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'}}>
              🔥 Prometheus
            </a>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px'}}>
        
        {/* Total Containers */}
        <div style={{background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', borderRadius: '25px', padding: '40px', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)', border: '2px solid rgba(255, 255, 255, 0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <Container style={{width: '50px', height: '50px', color: 'white', opacity: 0.9}} />
            <span style={{padding: '8px 16px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold'}}>ACTIVE</span>
          </div>
          <h2 style={{fontSize: '20px', color: 'white', opacity: 0.9, margin: 0, marginBottom: '10px'}}>Total Containers</h2>
          <p style={{fontSize: '56px', fontWeight: '900', color: 'white', margin: 0}}>{metrics.total_containers}</p>
          <p style={{fontSize: '14px', color: 'white', opacity: 0.7, marginTop: '10px'}}>Currently being monitored</p>
        </div>

        {/* System Status */}
        <div style={{background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '25px', padding: '40px', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)', border: '2px solid rgba(255, 255, 255, 0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <TrendingUp style={{width: '50px', height: '50px', color: 'white', opacity: 0.9}} />
            <span style={{padding: '8px 16px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold'}}>LIVE</span>
          </div>
          <h2 style={{fontSize: '20px', color: 'white', opacity: 0.9, margin: 0, marginBottom: '10px'}}>System Status</h2>
          <p style={{fontSize: '48px', fontWeight: '900', color: 'white', margin: 0}}>Active</p>
          <p style={{fontSize: '14px', color: 'white', opacity: 0.7, marginTop: '10px'}}>All systems operational</p>
        </div>

        {/* Monitoring Stack */}
        <div style={{background: 'linear-gradient(135deg, #3B82F6, #2563EB)', borderRadius: '25px', padding: '40px', boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)', border: '2px solid rgba(255, 255, 255, 0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <Server style={{width: '50px', height: '50px', color: 'white', opacity: 0.9}} />
          </div>
          <h2 style={{fontSize: '20px', color: 'white', opacity: 0.9, margin: 0, marginBottom: '10px'}}>Monitoring Stack</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px'}}>
            <div style={{padding: '12px 20px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '16px'}}>
              Prometheus
            </div>
            <div style={{padding: '12px 20px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '16px'}}>
              Grafana
            </div>
            <div style={{padding: '12px 20px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '16px'}}>
              cAdvisor
            </div>
          </div>
        </div>
      </div>

      {/* Container Metrics */}
      <div style={{width: '100%', background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '40px', border: '2px solid #E0E7FF'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px'}}>
          <div style={{width: '70px', height: '70px', background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)'}}>
            <Container style={{color: 'white', width: '35px', height: '35px'}} />
          </div>
          <div>
            <h2 style={{fontSize: '32px', fontWeight: '900', color: '#111827', margin: 0}}>Container Metrics</h2>
            <p style={{fontSize: '16px', color: '#6B7280', marginTop: '5px'}}>Real-time resource usage per container</p>
          </div>
        </div>

        {metrics.total_containers > 0 ? (
          <div style={{display: 'grid', gap: '20px'}}>
            {metrics.containers.map((container, index) => (
              <div
                key={index}
                style={{background: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)', borderRadius: '20px', padding: '30px', border: '2px solid #E5E7EB', transition: 'all 0.3s'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'}}>
                  <div>
                    <h3 style={{fontSize: '24px', fontWeight: '900', color: '#111827', margin: 0}}>{container.name}</h3>
                    <p style={{fontSize: '14px', color: '#6B7280', fontFamily: 'monospace', marginTop: '8px'}}>ID: {container.id}</p>
                  </div>
                  
                  <div style={{display: 'flex', gap: '20px'}}>
                    {/* CPU Metric */}
                    <div style={{textAlign: 'center'}}>
                      <p style={{fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '8px'}}>CPU</p>
                      <div style={{width: '100px', height: '100px', borderRadius: '50%', background: `conic-gradient(#7C3AED ${(container.metrics?.cpu || 0) * 3.6}deg, #E5E7EB 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <div style={{width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <span style={{fontSize: '20px', fontWeight: '900', color: '#111827'}}>{container.metrics?.cpu || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Memory Metric */}
                    <div style={{textAlign: 'center'}}>
                      <p style={{fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '8px'}}>Memory</p>
                      <div style={{width: '100px', height: '100px', borderRadius: '50%', background: `conic-gradient(#10B981 ${(container.metrics?.memory || 0) * 3.6}deg, #E5E7EB 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <div style={{width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <span style={{fontSize: '20px', fontWeight: '900', color: '#111827'}}>{container.metrics?.memory || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Network I/O */}
                    <div style={{textAlign: 'center'}}>
                      <p style={{fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '8px'}}>Network I/O</p>
                      <div style={{padding: '10px 20px', background: 'white', borderRadius: '12px', border: '2px solid #E5E7EB'}}>
                        <p style={{fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0}}>{container.metrics?.networkIO || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '80px 20px'}}>
            <Container size={100} style={{color: '#DBEAFE', margin: '0 auto 30px'}} />
            <h3 style={{fontSize: '28px', fontWeight: '900', color: '#111827', marginBottom: '10px'}}>No Containers Running</h3>
            <p style={{fontSize: '18px', color: '#6B7280'}}>Deploy applications to see metrics here</p>
          </div>
        )}
      </div>
    </div>
  );
}
