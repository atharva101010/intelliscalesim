import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Network, Server, ExternalLink, BarChart3 } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// VERSION 2.0 - FULL WIDTH DASHBOARD
export default function AnalyticsV2() {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/metrics/containers`);
      setSystemMetrics(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #EEF2FF, #E0E7FF)'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{width: '80px', height: '80px', border: '5px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px'}}></div>
          <p style={{fontSize: '24px', fontWeight: 'bold', color: '#374151'}}>Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{width: '100%', minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF, #EDE9FE)', padding: '40px', boxSizing: 'border-box'}}>
      
      {/* HEADER SECTION */}
      <div style={{width: '100%', background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '40px', marginBottom: '40px', border: '2px solid #E0E7FF'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '30px'}}>
            <div style={{width: '100px', height: '100px', background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)'}}>
              <BarChart3 style={{color: 'white', width: '50px', height: '50px'}} />
            </div>
            <div>
              <h1 style={{fontSize: '48px', fontWeight: '900', color: '#111827', margin: 0}}>Analytics Dashboard</h1>
              <p style={{fontSize: '18px', color: '#6B7280', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite'}}></span>
                Live Monitoring • Updates Every 5 Seconds
              </p>
            </div>
          </div>
          <div style={{display: 'flex', gap: '20px'}}>
            <button
              onClick={() => window.open('http://localhost:3000', '_blank')}
              style={{padding: '20px 40px', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', color: 'white', fontWeight: 'bold', fontSize: '18px', borderRadius: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)', transition: 'transform 0.2s'}}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <ExternalLink size={24} />
              Grafana
            </button>
            <button
              onClick={() => window.open('http://localhost:9090', '_blank')}
              style={{padding: '20px 40px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white', fontWeight: 'bold', fontSize: '18px', borderRadius: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)', transition: 'transform 0.2s'}}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <ExternalLink size={24} />
              Prometheus
            </button>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: '40px'}}>
        {/* Card 1 */}
        <div style={{background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', borderRadius: '30px', padding: '50px', boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.5)', color: 'white', transition: 'transform 0.3s'}}
             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px'}}>
            <Server size={70} style={{opacity: 0.8}} />
            <span style={{background: 'rgba(255,255,255,0.3)', padding: '12px 24px', borderRadius: '20px', fontSize: '16px', fontWeight: 'bold'}}>ACTIVE</span>
          </div>
          <p style={{fontSize: '24px', fontWeight: '600', opacity: 0.9, marginBottom: '15px'}}>Total Containers</p>
          <p style={{fontSize: '96px', fontWeight: '900', margin: '20px 0'}}>{systemMetrics?.total_containers || 0}</p>
          <p style={{fontSize: '18px', opacity: 0.9}}>Currently being monitored</p>
        </div>

        {/* Card 2 */}
        <div style={{background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '30px', padding: '50px', boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.5)', color: 'white', transition: 'transform 0.3s'}}
             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px'}}>
            <Activity size={70} style={{opacity: 0.8}} />
            <div style={{background: 'rgba(255,255,255,0.3)', padding: '12px 24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div style={{width: '12px', height: '12px', background: 'white', borderRadius: '50%', animation: 'pulse 2s infinite'}}></div>
              <span style={{fontSize: '16px', fontWeight: 'bold'}}>LIVE</span>
            </div>
          </div>
          <p style={{fontSize: '24px', fontWeight: '600', opacity: 0.9, marginBottom: '15px'}}>System Status</p>
          <p style={{fontSize: '80px', fontWeight: '900', margin: '20px 0'}}>Active</p>
          <p style={{fontSize: '18px', opacity: 0.9}}>All systems operational</p>
        </div>

        {/* Card 3 */}
        <div style={{background: 'linear-gradient(135deg, #3B82F6, #2563EB)', borderRadius: '30px', padding: '50px', boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.5)', color: 'white', transition: 'transform 0.3s'}}
             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{marginBottom: '40px'}}>
            <BarChart3 size={70} style={{opacity: 0.8}} />
          </div>
          <p style={{fontSize: '24px', fontWeight: '600', opacity: 0.9, marginBottom: '20px'}}>Monitoring Stack</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '30px'}}>
            <span style={{padding: '15px 30px', background: 'rgba(255,255,255,0.3)', borderRadius: '20px', fontSize: '18px', fontWeight: 'bold'}}>Prometheus</span>
            <span style={{padding: '15px 30px', background: 'rgba(255,255,255,0.3)', borderRadius: '20px', fontSize: '18px', fontWeight: 'bold'}}>Grafana</span>
            <span style={{padding: '15px 30px', background: 'rgba(255,255,255,0.3)', borderRadius: '20px', fontSize: '18px', fontWeight: 'bold'}}>cAdvisor</span>
          </div>
        </div>
      </div>

      {/* CONTAINER METRICS */}
      <div style={{width: '100%', background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '50px', border: '2px solid #E0E7FF'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '50px'}}>
          <div style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #6366F1, #7C3AED)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'}}>
            <Server style={{color: 'white', width: '40px', height: '40px'}} />
          </div>
          <div>
            <h2 style={{fontSize: '44px', fontWeight: '900', color: '#111827', margin: 0}}>Container Metrics</h2>
            <p style={{fontSize: '20px', color: '#6B7280', marginTop: '8px'}}>Real-time resource usage per container</p>
          </div>
        </div>

        {systemMetrics?.containers && systemMetrics.containers.length > 0 ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '40px'}}>
            {systemMetrics.containers.map((container, index) => (
              <div
                key={container.id}
                style={{width: '100%', background: 'linear-gradient(135deg, #F9FAFB, #EEF2FF)', border: '2px solid #E0E7FF', borderRadius: '25px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', transition: 'all 0.3s'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                }}
              >
                {/* Container Header */}
                <div style={{display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '40px', paddingBottom: '30px', borderBottom: '2px solid #E0E7FF'}}>
                  <div style={{width: '90px', height: '90px', background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', fontWeight: '900', color: 'white', boxShadow: '0 10px 30px rgba(124, 58, 237, 0.3)'}}>
                    {index + 1}
                  </div>
                  <div style={{flex: 1}}>
                    <h3 style={{fontSize: '36px', fontWeight: '900', color: '#111827', margin: 0}}>{container.name}</h3>
                    <p style={{fontSize: '16px', color: '#6B7280', fontFamily: 'monospace', marginTop: '8px'}}>Container ID: {container.id}</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px'}}>
                  {/* CPU */}
                  <div style={{background: 'white', borderRadius: '20px', padding: '40px', border: '2px solid #DBEAFE', boxShadow: '0 10px 25px rgba(59,130,246,0.15)', transition: 'all 0.3s'}}
                       onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 15px 35px rgba(59,130,246,0.25)'}
                       onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(59,130,246,0.15)'}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px'}}>
                      <div style={{width: '65px', height: '65px', background: '#EFF6FF', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Cpu style={{color: '#3B82F6', width: '35px', height: '35px'}} />
                      </div>
                      <p style={{fontSize: '22px', fontWeight: 'bold', color: '#374151', margin: 0}}>CPU Usage</p>
                    </div>
                    <p style={{fontSize: '72px', fontWeight: '900', color: '#3B82F6', margin: 0}}>{container.cpu}</p>
                  </div>

                  {/* Memory */}
                  <div style={{background: 'white', borderRadius: '20px', padding: '40px', border: '2px solid #D1FAE5', boxShadow: '0 10px 25px rgba(16,185,129,0.15)', transition: 'all 0.3s'}}
                       onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 15px 35px rgba(16,185,129,0.25)'}
                       onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(16,185,129,0.15)'}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px'}}>
                      <div style={{width: '65px', height: '65px', background: '#ECFDF5', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <HardDrive style={{color: '#10B981', width: '35px', height: '35px'}} />
                      </div>
                      <p style={{fontSize: '22px', fontWeight: 'bold', color: '#374151', margin: 0}}>Memory</p>
                    </div>
                    <p style={{fontSize: '72px', fontWeight: '900', color: '#10B981', margin: 0}}>{container.memory}</p>
                  </div>

                  {/* Network */}
                  <div style={{background: 'white', borderRadius: '20px', padding: '40px', border: '2px solid #E9D5FF', boxShadow: '0 10px 25px rgba(124,58,237,0.15)', transition: 'all 0.3s'}}
                       onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 15px 35px rgba(124,58,237,0.25)'}
                       onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(124,58,237,0.15)'}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px'}}>
                      <div style={{width: '65px', height: '65px', background: '#FAF5FF', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Network style={{color: '#7C3AED', width: '35px', height: '35px'}} />
                      </div>
                      <p style={{fontSize: '22px', fontWeight: 'bold', color: '#374151', margin: 0}}>Network I/O</p>
                    </div>
                    <p style={{fontSize: '52px', fontWeight: '900', color: '#7C3AED', margin: 0}}>{container.net_io}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{width: '100%', background: '#EFF6FF', border: '2px solid #DBEAFE', borderRadius: '25px', padding: '100px', textAlign: 'center'}}>
            <Server size={100} style={{color: '#93C5FD', margin: '0 auto 30px'}} />
            <h3 style={{fontSize: '40px', fontWeight: '900', color: '#111827', marginBottom: '15px'}}>No Containers Running</h3>
            <p style={{fontSize: '24px', color: '#6B7280'}}>Deploy applications to see metrics here</p>
          </div>
        )}
      </div>
    </div>
  );
}
