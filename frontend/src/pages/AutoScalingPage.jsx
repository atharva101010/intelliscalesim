import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Settings, Play, Zap, Server, AlertCircle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';

const AutoScalingPage = () => {
  const [autoScalerActive, setAutoScalerActive] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState({
    cpuScaleUp: 70,
    cpuScaleDown: 20,
    memScaleUp: 75,
    memScaleDown: 25,
    minReplicas: 1,
    maxReplicas: 5,
    checkInterval: 30
  });

  // Real-time metrics state
  const [metrics, setMetrics] = useState({
    currentCpu: 45,
    currentMemory: 40,
    activeReplicas: 1
  });

  // Scaling history state
  const [scalingEvents, setScalingEvents] = useState([
    { id: 1, type: 'info', action: 'Auto-scaler initialized', replicas: 1, cpu: 0, memory: 0, time: 'Just now' }
  ]);

  // Simulate metrics changes
  useEffect(() => {
    if (!autoScalerActive && !simulationActive) return;

    const interval = setInterval(() => {
      setMetrics(prev => {
        let newCpu = prev.currentCpu;
        let newMemory = prev.currentMemory;
        let newReplicas = prev.activeReplicas;

        if (simulationActive) {
          // Simulation mode: increase load
          newCpu = Math.min(95, prev.currentCpu + Math.random() * 15);
          newMemory = Math.min(95, prev.currentMemory + Math.random() * 10);
        } else {
          // Normal fluctuation
          newCpu = Math.max(10, Math.min(95, prev.currentCpu + (Math.random() - 0.5) * 10));
          newMemory = Math.max(10, Math.min(95, prev.currentMemory + (Math.random() - 0.5) * 8));
        }

        // Auto-scaling logic
        if (autoScalerActive) {
          if ((newCpu >= config.cpuScaleUp || newMemory >= config.memScaleUp) && newReplicas < config.maxReplicas) {
            newReplicas = prev.activeReplicas + 1;
            addScalingEvent('up', newReplicas, newCpu, newMemory);
            // Reduce load after scaling up
            newCpu = newCpu * 0.7;
            newMemory = newMemory * 0.7;
          } else if ((newCpu <= config.cpuScaleDown && newMemory <= config.memScaleDown) && newReplicas > config.minReplicas) {
            newReplicas = prev.activeReplicas - 1;
            addScalingEvent('down', newReplicas, newCpu, newMemory);
            // Increase load slightly after scaling down
            newCpu = newCpu * 1.3;
            newMemory = newMemory * 1.3;
          }
        }

        return {
          currentCpu: Math.round(newCpu),
          currentMemory: Math.round(newMemory),
          activeReplicas: newReplicas
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [autoScalerActive, simulationActive, config]);

  const addScalingEvent = (type, replicas, cpu, memory) => {
    const event = {
      id: Date.now(),
      type: type,
      action: type === 'up' ? 'Scaled UP' : 'Scaled DOWN',
      replicas: replicas,
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      time: 'Just now'
    };
    setScalingEvents(prev => [event, ...prev.slice(0, 9)]);
  };

  const handleStartAutoScaler = () => {
    setAutoScalerActive(true);
    addScalingEvent('info', metrics.activeReplicas, metrics.currentCpu, metrics.currentMemory);
  };

  const handleStopAutoScaler = () => {
    setAutoScalerActive(false);
    setSimulationActive(false);
  };

  const handleSimulation = () => {
    if (!autoScalerActive) {
      alert('Please start the Auto-scaler first!');
      return;
    }
    setSimulationActive(!simulationActive);
    if (!simulationActive) {
      addScalingEvent('info', metrics.activeReplicas, metrics.currentCpu, metrics.currentMemory);
    }
  };

  const handleSaveConfig = () => {
    alert('Configuration saved successfully!');
  };

  const getCpuColor = (value) => {
    if (value >= 70) return '#ef4444';
    if (value >= 50) return '#f59e0b';
    return '#10b981';
  };

  const getMemoryColor = (value) => {
    if (value >= 75) return '#ef4444';
    if (value >= 50) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{ padding: '30px', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: '#10b98120', color: '#10b981' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>Auto-scaling</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: autoScalerActive ? '#10b981' : '#ef4444' }}></div>
              <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                {autoScalerActive ? 'Active' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {simulationActive && (
            <div style={{ padding: '8px 16px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} />
              Simulation Running
            </div>
          )}
          {!autoScalerActive ? (
            <button
              onClick={handleStartAutoScaler}
              style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Play size={20} />
              Start Auto-scaler
            </button>
          ) : (
            <button
              onClick={handleStopAutoScaler}
              style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Stop Auto-scaler
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Metrics Dashboard */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} />
          Real-Time Metrics Dashboard
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {/* CPU Metric */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>CPU Usage</h3>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: getCpuColor(metrics.currentCpu) }}>
                {metrics.currentCpu}%
              </span>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.currentCpu}%`, height: '100%', background: getCpuColor(metrics.currentCpu), transition: 'width 0.5s ease' }}></div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
              <span>Scale Down: {config.cpuScaleDown}%</span>
              <span>Scale Up: {config.cpuScaleUp}%</span>
            </div>
          </div>

          {/* Memory Metric */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>Memory Usage</h3>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: getMemoryColor(metrics.currentMemory) }}>
                {metrics.currentMemory}%
              </span>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.currentMemory}%`, height: '100%', background: getMemoryColor(metrics.currentMemory), transition: 'width 0.5s ease' }}></div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
              <span>Scale Down: {config.memScaleDown}%</span>
              <span>Scale Up: {config.memScaleUp}%</span>
            </div>
          </div>

          {/* Active Replicas */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>Active Replicas</h3>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>
                {metrics.activeReplicas}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Min</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6b7280' }}>{config.minReplicas}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '4px' }}>
                {Array.from({ length: config.maxReplicas }).map((_, i) => (
                  <Server
                    key={i}
                    size={24}
                    style={{ color: i < metrics.activeReplicas ? '#10b981' : '#e5e7eb' }}
                  />
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Max</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6b7280' }}>{config.maxReplicas}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Test Mode */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} />
              Simulation Test Mode
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Test auto-scaling by simulating high CPU and memory load without real traffic
            </p>
          </div>
          <button
            onClick={handleSimulation}
            disabled={!autoScalerActive}
            style={{
              padding: '12px 24px',
              background: simulationActive ? '#ef4444' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: autoScalerActive ? 'pointer' : 'not-allowed',
              opacity: autoScalerActive ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {simulationActive ? 'Stop Simulation' : 'Start Simulation'}
            <Zap size={18} />
          </button>
        </div>
        {!autoScalerActive && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '14px', color: '#92400e' }}>Start the Auto-scaler first to use simulation mode</span>
          </div>
        )}
      </div>

      {/* Scaling Activity Log */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} />
          Scaling Activity Log
        </h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {scalingEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
              No scaling events yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scalingEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: '16px',
                    background: event.type === 'up' ? '#dcfce720' : event.type === 'down' ? '#fef3c720' : '#f3f4f6',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${event.type === 'up' ? '#10b981' : event.type === 'down' ? '#f59e0b' : '#6b7280'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {event.type === 'up' ? (
                      <ArrowUp size={20} style={{ color: '#10b981' }} />
                    ) : event.type === 'down' ? (
                      <ArrowDown size={20} style={{ color: '#f59e0b' }} />
                    ) : (
                      <CheckCircle size={20} style={{ color: '#6b7280' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                        {event.action}
                        {event.type !== 'info' && (
                          <span style={{ marginLeft: '8px', color: '#6b7280', fontWeight: 'normal' }}>
                            → {event.replicas} replica{event.replicas > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {event.type !== 'info' && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          CPU: {event.cpu}% | Memory: {event.memory}%
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{event.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} />
          Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              CPU Scale Up Threshold (%)
            </label>
            <input
              type="number"
              value={config.cpuScaleUp}
              onChange={(e) => setConfig({ ...config, cpuScaleUp: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              CPU Scale Down Threshold (%)
            </label>
            <input
              type="number"
              value={config.cpuScaleDown}
              onChange={(e) => setConfig({ ...config, cpuScaleDown: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Memory Scale Up Threshold (%)
            </label>
            <input
              type="number"
              value={config.memScaleUp}
              onChange={(e) => setConfig({ ...config, memScaleUp: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Memory Scale Down Threshold (%)
            </label>
            <input
              type="number"
              value={config.memScaleDown}
              onChange={(e) => setConfig({ ...config, memScaleDown: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Minimum Replicas
            </label>
            <input
              type="number"
              value={config.minReplicas}
              onChange={(e) => setConfig({ ...config, minReplicas: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Maximum Replicas
            </label>
            <input
              type="number"
              value={config.maxReplicas}
              onChange={(e) => setConfig({ ...config, maxReplicas: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Check Interval (seconds)
            </label>
            <input
              type="number"
              value={config.checkInterval}
              onChange={(e) => setConfig({ ...config, checkInterval: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
        </div>
        <button
          onClick={handleSaveConfig}
          style={{ marginTop: '24px', width: '100%', padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Save Configuration
        </button>
      </div>

      {/* Managed Containers */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={20} style={{ color: '#10b981' }} />
          Managed Containers
        </h3>
        {metrics.activeReplicas === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
            <Server size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No Containers Running</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Deploy containers to enable auto-scaling</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {Array.from({ length: metrics.activeReplicas }).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '2px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Server size={24} style={{ color: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                      Container Replica #{i + 1}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      CPU: {Math.round(metrics.currentCpu / metrics.activeReplicas)}% | Memory: {Math.round(metrics.currentMemory / metrics.activeReplicas)}%
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', padding: '4px 12px', background: '#dcfce7', color: '#047857', borderRadius: '4px', fontWeight: 'bold' }}>
                  Running
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoScalingPage;
