import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BillingSimulator = () => {
  // State for resource configuration
  const [provider, setProvider] = useState('AWS');
  const [cpuCores, setCpuCores] = useState(2);
  const [memoryGb, setMemoryGb] = useState(4);
  const [storageGb, setStorageGb] = useState(10);
  const [durationHours, setDurationHours] = useState(24);
  const [dataTransferGb, setDataTransferGb] = useState(0);
  
  // State for pricing data
  const [pricingData, setPricingData] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch pricing data on component mount
  useEffect(() => {
    fetchPricingData();
  }, []);

  // Calculate cost whenever inputs change
  useEffect(() => {
    calculateCost();
  }, [provider, cpuCores, memoryGb, storageGb, durationHours, dataTransferGb]);

  const fetchPricingData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/billing/pricing');
      setPricingData(response.data.data);
    } catch (err) {
      setError('Failed to fetch pricing data');
      console.error(err);
    }
  };

  const calculateCost = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/billing/calculate', {
        provider: provider,
        cpu_cores: cpuCores,
        memory_gb: memoryGb,
        storage_gb: storageGb,
        duration_hours: durationHours,
        data_transfer_out_gb: dataTransferGb
      });
      setCostBreakdown(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to calculate cost');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const providerColors = {
    AWS: { primary: '#FF9900', secondary: '#232F3E' },
    GCP: { primary: '#4285F4', secondary: '#34A853' },
    Azure: { primary: '#0078D4', secondary: '#50E6FF' }
  };

  const providerLogos = {
    AWS: '☁️',
    GCP: '🌐',
    Azure: '🔷'
  };

  return (
    <div style={{
      padding: '30px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: 'white', fontSize: '42px', marginBottom: '10px' }}>
          ☁️ Cloud Billing Simulator
        </h1>
        <p style={{ color: '#E0E0E0', fontSize: '18px' }}>
          Learn cloud cost optimization by simulating real-world pricing
        </p>
      </div>

      {/* Main Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '30px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        
        {/* Left Column: Configuration Panel */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '25px', fontSize: '24px' }}>
            ⚙️ Resource Configuration
          </h2>

          {/* Provider Selection */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
              Cloud Provider:
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {['AWS', 'GCP', 'Azure'].map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    border: provider === p ? `3px solid ${providerColors[p].primary}` : '2px solid #ddd',
                    borderRadius: '12px',
                    background: provider === p ? `${providerColors[p].primary}15` : 'white',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: provider === p ? providerColors[p].primary : '#666',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{providerLogos[p]}</span>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* CPU Cores Slider */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
              CPU Cores: <span style={{ color: providerColors[provider].primary }}>{cpuCores}</span>
            </label>
            <input
              type="range"
              min="1"
              max="32"
              value={cpuCores}
              onChange={(e) => setCpuCores(parseFloat(e.target.value))}
              style={{ width: '100%', height: '8px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
              <span>1 core</span>
              <span>32 cores</span>
            </div>
          </div>

          {/* Memory Slider */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
              Memory: <span style={{ color: providerColors[provider].primary }}>{memoryGb} GB</span>
            </label>
            <input
              type="range"
              min="1"
              max="128"
              value={memoryGb}
              onChange={(e) => setMemoryGb(parseFloat(e.target.value))}
              style={{ width: '100%', height: '8px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
              <span>1 GB</span>
              <span>128 GB</span>
            </div>
          </div>

          {/* Storage Slider */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
              Storage: <span style={{ color: providerColors[provider].primary }}>{storageGb} GB</span>
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={storageGb}
              onChange={(e) => setStorageGb(parseFloat(e.target.value))}
              style={{ width: '100%', height: '8px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
              <span>10 GB</span>
              <span>1000 GB</span>
            </div>
          </div>

          {/* Duration Slider */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
              Duration: <span style={{ color: providerColors[provider].primary }}>{durationHours} hours ({(durationHours/24).toFixed(1)} days)</span>
            </label>
            <input
              type="range"
              min="1"
              max="720"
              value={durationHours}
              onChange={(e) => setDurationHours(parseFloat(e.target.value))}
              style={{ width: '100%', height: '8px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
              <span>1 hour</span>
              <span>720 hours (30 days)</span>
            </div>
          </div>

          {/* Data Transfer Slider */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
              Data Transfer Out: <span style={{ color: providerColors[provider].primary }}>{dataTransferGb} GB</span>
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={dataTransferGb}
              onChange={(e) => setDataTransferGb(parseFloat(e.target.value))}
              style={{ width: '100%', height: '8px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
              <span>0 GB</span>
              <span>500 GB</span>
            </div>
          </div>
        </div>

        {/* Right Column: Cost Breakdown */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '25px', fontSize: '24px' }}>
            💰 Cost Breakdown
          </h2>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              Calculating costs...
            </div>
          )}

          {error && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '20px', 
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {costBreakdown && !loading && (
            <div>
              {/* Total Cost */}
              <div style={{
                background: `linear-gradient(135deg, ${providerColors[provider].primary}, ${providerColors[provider].secondary})`,
                padding: '30px',
                borderRadius: '16px',
                marginBottom: '30px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '10px', opacity: 0.9 }}>
                  Total Estimated Cost
                </div>
                <div style={{ fontSize: '56px', fontWeight: 'bold' }}>
                  ${costBreakdown.total_cost.toFixed(4)}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '10px' }}>
                  for {durationHours} hours on {provider}
                </div>
              </div>

              {/* Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* CPU Cost */}
                <div style={{
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#fafafa'
                }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                    🖥️ CPU Cost
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                    ${costBreakdown.cpu_cost.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {cpuCores} cores × {durationHours}h
                  </div>
                </div>

                {/* Memory Cost */}
                <div style={{
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#fafafa'
                }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                    🧠 Memory Cost
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                    ${costBreakdown.memory_cost.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {memoryGb} GB × {durationHours}h
                  </div>
                </div>

                {/* Storage Cost */}
                <div style={{
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#fafafa'
                }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                    💾 Storage Cost
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                    ${costBreakdown.storage_cost.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {storageGb} GB
                  </div>
                </div>

                {/* Network Cost */}
                <div style={{
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#fafafa'
                }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                    🌐 Network Cost
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                    ${costBreakdown.network_cost.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {dataTransferGb} GB transfer
                  </div>
                </div>
              </div>

              {/* Pricing Details */}
              <div style={{
                marginTop: '30px',
                padding: '20px',
                background: '#f9f9f9',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#666'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                  📊 Rate Details for {provider}:
                </div>
                <div>CPU: ${costBreakdown.breakdown.cpu.price_per_vcpu_hour}/vCPU/hour</div>
                <div>Memory: ${costBreakdown.breakdown.memory.price_per_gb_hour}/GB/hour</div>
                <div>Storage: ${costBreakdown.breakdown.storage.price_per_gb_month}/GB/month</div>
                <div>Network: ${costBreakdown.breakdown.network.price_per_gb}/GB transfer</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Provider Comparison Table */}
      {pricingData.length > 0 && (
        <div style={{
          maxWidth: '1400px',
          margin: '40px auto 0',
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '25px', fontSize: '24px' }}>
            📈 Provider Pricing Comparison
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Provider</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Region</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>CPU ($/vCPU/hr)</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Memory ($/GB/hr)</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Storage ($/GB/mo)</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Network Out ($/GB)</th>
                </tr>
              </thead>
              <tbody>
                {pricingData.map((pricing, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: providerColors[pricing.provider]?.primary }}>
                      {providerLogos[pricing.provider]} {pricing.provider}
                    </td>
                    <td style={{ padding: '15px' }}>{pricing.region}</td>
                    <td style={{ padding: '15px' }}>${pricing.compute.cpu_per_vcpu_hour}</td>
                    <td style={{ padding: '15px' }}>${pricing.compute.memory_per_gb_hour}</td>
                    <td style={{ padding: '15px' }}>${pricing.storage.storage_per_gb_month}</td>
                    <td style={{ padding: '15px' }}>${pricing.network.data_transfer_out_per_gb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSimulator;
