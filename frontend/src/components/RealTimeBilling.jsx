import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, TrendingUp } from 'lucide-react';

const RealTimeBilling = () => {
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [provider, setProvider] = useState('AWS');
  const [timeInterval, setTimeInterval] = useState('Last 1 Hour');
  const [totalCost, setTotalCost] = useState(0);
  const [costBreakdown, setCostBreakdown] = useState({
    cpu: 0,
    memory: 0,
    storage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    if (selectedContainer) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContainer, provider, timeInterval]);

  const fetchContainers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/containers');
      const data = await response.json();
      setContainers(data.containers || []);
      if (data.containers && data.containers.length > 0) {
        setSelectedContainer(data.containers[0].name);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching containers:', error);
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (!selectedContainer) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/metrics/${selectedContainer}?provider=${provider}&interval=${timeInterval}`
      );
      const data = await response.json();

      setTotalCost(data.total_cost || 0);
      setCostBreakdown(data.cost_breakdown || { cpu: 0, memory: 0, storage: 0 });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid #e5e7eb', 
          borderTop: '4px solid #f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column - Configuration */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '2px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f3f4f6' }}>
            <Activity style={{ width: '24px', height: '24px', color: '#f97316' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Real-Time Configuration
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Application Selection */}
            <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '12px', border: '2px solid #fde68a' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#92400e', marginBottom: '8px', fontSize: '14px' }}>
                Select Application <span style={{ color: '#6b7280', fontWeight: 'normal' }}>({containers.length} containers)</span>
              </label>
              <select
                value={selectedContainer || ""}
                onChange={(e) => setSelectedContainer(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #fbbf24", borderRadius: "8px", fontSize: "14px", background: "white", outline: "none", color: selectedContainer ? "#1f2937" : "#9ca3af" }}
              >
                {containers.length === 0 && <option value="">Loading containers...</option>}
                {containers.length > 0 && !selectedContainer && <option value="">Select a container</option>}
                {containers.map((container) => (
                  <option key={container.id} value={container.name}>
                    {container.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Selection */}
            <div style={{ padding: '20px', background: '#dbeafe', borderRadius: '12px', border: '2px solid #bfdbfe' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#1e40af', marginBottom: '8px', fontSize: '14px' }}>
                Provider Pricing Model
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #fbbf24", borderRadius: "8px", fontSize: "14px", background: "white", outline: "none", color: selectedContainer ? "#1f2937" : "#9ca3af" }}
              >
                <option value="AWS">AWS</option>
                <option value="GCP">GCP</option>
                <option value="AZURE">AZURE</option>
              </select>
            </div>

            {/* Time Interval */}
            <div style={{ padding: '20px', background: '#f3e8ff', borderRadius: '12px', border: '2px solid #e9d5ff' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#6b21a8', marginBottom: '8px', fontSize: '14px' }}>
                Time Interval
              </label>
              <select
                value={timeInterval}
                onChange={(e) => setTimeInterval(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #fbbf24", borderRadius: "8px", fontSize: "14px", background: "white", outline: "none", color: selectedContainer ? "#1f2937" : "#9ca3af" }}
              >
                <option value="Last 1 Hour">Last 1 Hour</option>
                <option value="Last 6 Hours">Last 6 Hours</option>
                <option value="Last 24 Hours">Last 24 Hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column - Cost Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign style={{ width: '20px', height: '20px', color: '#f97316' }} />
              Cost Breakdown - {provider}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>CPU Usage</span>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#3b82f6' }}>${costBreakdown.cpu.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Memory Usage</span>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>${costBreakdown.memory.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Storage</span>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#a855f7' }}>${costBreakdown.storage.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
              color: 'white'
            }}>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Estimated Cost</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>${totalCost.toFixed(4)}</p>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', fontSize: '16px' }}>Statistics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Provider</span>
                <span style={{ fontWeight: 'bold' }}>{provider}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Container</span>
                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{selectedContainer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Interval</span>
                <span style={{ fontWeight: 'bold' }}>{timeInterval}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RealTimeBilling;
