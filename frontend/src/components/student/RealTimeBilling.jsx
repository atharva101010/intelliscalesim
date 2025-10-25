import React, { useState, useEffect } from 'react';
import { Activity, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RealTimeBilling = () => {
  const [containers, setContainers] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [provider, setProvider] = useState('AWS');
  const [timeInterval, setTimeInterval] = useState('1h');
  const [costs, setCosts] = useState({ cpu: 0, memory: 0, storage: 0, total: 0 });
  const [metrics, setMetrics] = useState([]);
  const [pricing, setPricing] = useState({ cpuPerCore: 0, memoryPerGB: 0, storagePerGB: 0 });
  const [loading, setLoading] = useState(true);

  // Generate realistic demo costs based on container name (for display purposes)
  const getDemoCosts = (appName) => {
    if (!appName) return { cpu: 0, memory: 0, storage: 0, total: 0 };
    const hash = appName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const cpuCost = ((hash % 50) + 10) / 1000;
    const memoryCost = ((hash % 70) + 30) / 10000;
    const storageCost = ((hash % 90) + 50) / 10000;
    return {
      cpu: cpuCost,
      memory: memoryCost,
      storage: storageCost,
      total: cpuCost + memoryCost + storageCost
    };
  };



  // Update costs when selectedApp changes (demo/placeholder mode)
  useEffect(() => {
    if (selectedApp) {
      const demoCosts = getDemoCosts(selectedApp);
      setCosts(demoCosts);
    }
  }, [selectedApp]);


  // Update costs when selectedApp changes (demo/placeholder mode)
  useEffect(() => {
    if (selectedApp) {
      const demoCosts = getDemoCosts(selectedApp);
      setCosts(demoCosts);
    }
  }, [selectedApp]);

  // Fetch containers list on mount
  useEffect(() => {
    fetchContainers();
  }, []);

  // Fetch pricing when provider changes
  useEffect(() => {
    fetchPricing();
  }, [provider]);

  // Fetch metrics periodically
  useEffect(() => {
    if (selectedApp) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedApp, timeInterval]);

  const fetchContainers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/containers');
      const data = await response.json();
      setContainers(data.containers || []);
      if (data.length > 0) {
        setSelectedApp(data[0].name);
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/pricing/${provider}`);
      const data = await response.json();
      setPricing(data);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const intervalParam = encodeURIComponent(timeInterval);
      const response = await fetch(
        `http://localhost:8000/api/metrics/${selectedApp}?provider=${provider}&interval=${intervalParam}`
      );
      const data = await response.json();
      
      // Set costs directly from API response
      setCosts({
        cpu: data.cpu_cost || 0,
        memory: data.memory_cost || 0,
        storage: data.storage_cost || 0,
        total: data.total_cost || 0
      });
      
      // Transform for metrics display (if still needed)
      setMetrics([{
        cpu: data.cpu_usage || 0,
        memory: data.memory_usage || 0,
        storage: data.storage_usage || 0
      }]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setLoading(false);
    }
  };


  const calculateCosts = () => {
    if (!metrics || metrics.length === 0 || !pricing) {
      return { cpu: 0, memory: 0, storage: 0, total: 0, avgCpu: 0, avgMemory: 0, avgStorage: 0 };
    }

    const totalCpu = metrics.reduce((sum, m) => sum + m.cpu, 0);
    const totalMemory = metrics.reduce((sum, m) => sum + m.memory, 0);
    const totalStorage = metrics.reduce((sum, m) => sum + m.storage, 0);

    const avgCpu = totalCpu / metrics.length;
    const avgMemory = totalMemory / metrics.length;
    const avgStorage = totalStorage / metrics.length;

    const hours = 1;
    const cpuCost = avgCpu * hours * pricing.cpuPerCore;
    const memoryCost = avgMemory * hours * pricing.memoryPerGB;
    const storageCost = avgStorage * pricing.storagePerGB;

    return {
      cpu: cpuCost,
      memory: memoryCost,
      storage: storageCost,
      total: cpuCost + memoryCost + storageCost,
      avgCpu,
      avgMemory,
      avgStorage
    };
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 pt-6">
            <button className="flex items-center gap-2 px-6 py-3 text-indigo-600 border-b-2 border-indigo-600 font-medium">
              <Activity className="w-5 h-5" />
              Real-Time Billing
            </button>
            <button className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700">
              <DollarSign className="w-5 h-5" />
              Scenario-Based Billing
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real-Time Billing</h1>
              <p className="text-gray-600 mt-1">Track actual resource usage and costs in real-time</p>
            </div>
          </div>

          {/* Input Controls */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Application ({containers.length} containers)
              </label>
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {containers.length === 0 ? (
                  <option value="">No containers running</option>
                ) : (
                  containers.map((container) => (
                    <option key={container.id} value={container.name}>
                      {container.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Pricing Model
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="Google Cloud">Google Cloud</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Interval
              </label>
              <select
                value={timeInterval}
                onChange={(e) => setTimeInterval(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* CPU Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              CPU Usage Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: 'Cores', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU Cores" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Memory Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Memory Usage Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: 'GB', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} name="Memory GB" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Cost Breakdown - {provider}
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <p className="text-gray-900 font-medium">CPU Usage</p>
                <p className="text-sm text-gray-500">
                  {costs.avgCpu.toFixed(2)} cores × 1 hours × ${pricing.cpuPerCore?.toFixed(4)}/hour
                </p>
              </div>
              <p className="text-xl font-bold text-blue-600">{costs.cpu > 0 ? ((costs.cpu / costs.total) * 100).toFixed(1) + "%" : "0%"}</p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <p className="text-gray-900 font-medium">Memory Usage</p>
                <p className="text-sm text-gray-500">
                  {costs.avgMemory.toFixed(2)} GB × 1 hours × ${pricing.memoryPerGB?.toFixed(4)}/hour
                </p>
              </div>
              <p className="text-xl font-bold text-green-600">{costs.memory > 0 ? ((costs.memory / costs.total) * 100).toFixed(1) + "%" : "0%"}</p>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <p className="text-gray-900 font-medium">Storage Usage</p>
                <p className="text-sm text-gray-500">
                  {costs.avgStorage.toFixed(2)} GB × ${pricing.storagePerGB?.toFixed(2)}/month
                </p>
              </div>
              <p className="text-xl font-bold text-purple-600">{costs.storage > 0 ? ((costs.storage / costs.total) * 100).toFixed(1) + "%" : "0%"}</p>
            </div>

            <div className="flex justify-between items-center pt-6 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
              <p className="text-xl font-bold">Total Estimated Cost</p>
              <p className="text-3xl font-bold">${costs.total.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeBilling;
