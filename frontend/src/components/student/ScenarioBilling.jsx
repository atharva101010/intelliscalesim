import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

const ScenarioBilling = () => {
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [provider, setProvider] = useState('AWS');
  const [cpuCores, setCpuCores] = useState(2);
  const [memory, setMemory] = useState(4);
  const [storage, setStorage] = useState(10);
  const [duration, setDuration] = useState(24);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/containers');
      const data = await response.json();
      setContainers(data.containers || []);
      if (data.containers && data.containers.length > 0) {
        setSelectedContainer(data.containers[0].container_name);
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
    }
  };

  const calculateCost = async () => {
    if (!selectedContainer) {
      alert('Please select a container');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/scenario/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          cpu_cores: cpuCores,
          memory_gb: memory,
          storage_gb: storage,
          duration_hours: duration,
        }),
      });

      const data = await response.json();
      setCostData(data);
    } catch (error) {
      console.error('Error calculating cost:', error);
      alert('Failed to calculate cost');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `$${typeof value === 'number' ? value.toFixed(4) : '0.0000'}`;
  };

  return (
    <div className="p-6">
      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-orange-500">⚙️</span>
              Scenario Configuration
            </h3>

            <div className="space-y-4">
              {/* Select Application - YELLOW Background */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Application ({containers.length} containers)
                </label>
                <select
                  value={selectedContainer}
                  onChange={(e) => setSelectedContainer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select application...</option>
                  {containers.map((container) => (
                    <option key={container.container_id} value={container.name}>
                      {container.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cloud Provider - BLUE Background */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cloud Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="AWS">AWS</option>
                  <option value="Azure">Azure</option>
                  <option value="GCP">GCP</option>
                </select>
              </div>

              {/* CPU Cores - BLUE Background */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPU Cores <span className="text-orange-500 text-xs">(Max: 16)</span>
                </label>
                <input
                  type="number"
                  value={cpuCores}
                  onChange={(e) => setCpuCores(Math.max(1, Math.min(16, Number(e.target.value))))}
                  min="1"
                  max="16"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Memory (GB) - BLUE Background */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Memory (GB) <span className="text-orange-500 text-xs">(Max: 64)</span>
                </label>
                <input
                  type="number"
                  value={memory}
                  onChange={(e) => setMemory(Math.max(1, Math.min(64, Number(e.target.value))))}
                  min="1"
                  max="64"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Storage (GB) - PURPLE Background */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage (GB) <span className="text-orange-500 text-xs">(Max: 500)</span>
                </label>
                <input
                  type="number"
                  value={storage}
                  onChange={(e) => setStorage(Math.max(1, Math.min(500, Number(e.target.value))))}
                  min="1"
                  max="500"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Duration (hours) - PURPLE Background */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours) <span className="text-orange-500 text-xs">(Max: 720)</span>
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(720, Number(e.target.value))))}
                  min="1"
                  max="720"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Calculate Button - Orange to Pink Gradient */}
              <button
                onClick={calculateCost}
                disabled={loading || !selectedContainer}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3.5 rounded-lg font-semibold text-base hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Calculating...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Calculate Cost
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Cost Breakdown (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="text-orange-500 w-5 h-5" />
              Cost Breakdown - {provider}
            </h3>

            {costData ? (
              <div className="space-y-4">
                {/* CPU Usage */}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(costData.cpu_cost)}</span>
                </div>

                {/* Memory Usage */}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(costData.memory_cost)}</span>
                </div>

                {/* Storage */}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="text-lg font-bold text-purple-600">{formatCurrency(costData.storage_cost)}</span>
                </div>

                {/* Total Cost - Orange to Pink Gradient */}
                <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-4 mt-6 text-white">
                  <p className="text-sm opacity-90 mb-1">Total Estimated Cost</p>
                  <p className="text-3xl font-bold">{formatCurrency(costData.total_cost)}</p>
                </div>

                {/* Statistics */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider</span>
                      <span className="font-semibold text-gray-900">{provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Container</span>
                      <span className="font-semibold text-gray-900 text-xs truncate max-w-[150px]" title={selectedContainer}>
                        {selectedContainer || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interval</span>
                      <span className="font-semibold text-gray-900">Last {duration} Hours</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm">
                  Configure resources and calculate to see cost estimate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioBilling;
