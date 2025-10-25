import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Clock, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function TrendsDashboard() {
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('response_time');

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/load-test/analytics/trends?limit=20`);
      setTrendsData(response.data);
    } catch (err) {
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
  };

  

  if (loading) {
    return (
      <div style={{ padding: '32px', minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity style={{ width: '48px', height: '48px', color: '#f97316', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', color: '#6b7280' }}>Loading trends data...</p>
        </div>
      </div>
    );
  }

  if (!trendsData?.has_data) {
    return (
      <div style={{ padding: '32px', minHeight: '100vh', background: '#f3f4f6' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '64px 32px', textAlign: 'center', border: '2px dashed #e5e7eb' }}>
          <BarChart3 style={{ width: '64px', height: '64px', color: '#d1d5db', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>No Test Data Yet</h2>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Run some load tests to see performance trends over time</p>
        </div>
      </div>
    );
  }

  const stats = trendsData.statistics;
  const trends = trendsData.trends;

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Avg Response Time */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Avg Response Time</span>
            <Clock style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            {stats.avg_response_time}ms
          </div>
          <div style={{ fontSize: '12px', color: stats.trend_direction === 'improving' ? '#10b981' : stats.trend_direction === 'degrading' ? '#ef4444' : '#6b7280' }}>
            {stats.trend_icon} {stats.trend_direction === 'improving' ? `${stats.improvement_percentage}% faster` : stats.trend_direction === 'degrading' ? `${Math.abs(stats.improvement_percentage)}% slower` : 'Stable'}
          </div>
        </div>

        {/* Avg Throughput */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Avg Throughput</span>
            <Zap style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            {stats.avg_throughput} <span style={{ fontSize: '16px', color: '#6b7280' }}>req/s</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Across all tests
          </div>
        </div>

        {/* Avg Success Rate */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Avg Success Rate</span>
            <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            {stats.avg_success_rate}%
          </div>
          <div style={{ fontSize: '12px', color: stats.avg_success_rate === 100 ? '#10b981' : '#f59e0b' }}>
            {stats.avg_success_rate === 100 ? '✓ Perfect reliability' : '! Some failures detected'}
          </div>
        </div>

        {/* Best Performance */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '24px', color: 'white', boxShadow: '0 4px 6px rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '600', marginBottom: '12px' }}>🏆 Best Performance</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {stats.best_response_time}ms
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            Test #{stats.best_test_id} • {stats.best_test_date}
          </div>
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '32px', border: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            📊 Performance Trends
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedMetric('response_time')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: selectedMetric === 'response_time' ? '#3b82f6' : '#f3f4f6',
                color: selectedMetric === 'response_time' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Response Time
            </button>
            <button
              onClick={() => setSelectedMetric('throughput')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: selectedMetric === 'throughput' ? '#3b82f6' : '#f3f4f6',
                color: selectedMetric === 'throughput' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Throughput
            </button>
            <button
              onClick={() => setSelectedMetric('success_rate')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: selectedMetric === 'success_rate' ? '#3b82f6' : '#f3f4f6',
                color: selectedMetric === 'success_rate' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Success Rate
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          {selectedMetric === 'response_time' ? (
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="test_number" label={{ value: 'Test Number', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={(value) => `Test #${value}`}
              />
              <Legend />
              <Area type="monotone" dataKey="avg_response_time" stroke="#f97316" fillOpacity={1} fill="url(#colorResponse)" name="Avg Response Time (ms)" strokeWidth={2} />
            </AreaChart>
          ) : selectedMetric === 'throughput' ? (
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="test_number" label={{ value: 'Test Number', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Requests/Second', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={(value) => `Test #${value}`}
              />
              <Legend />
              <Line type="monotone" dataKey="requests_per_second" stroke="#8b5cf6" name="Throughput (req/s)" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
            </LineChart>
          ) : (
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="test_number" label={{ value: 'Test Number', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={(value) => `Test #${value}`}
              />
              <Legend />
              <Line type="monotone" dataKey="success_rate" stroke="#10b981" name="Success Rate (%)" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Test History Table */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '2px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>
          📝 Test History Details
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>#</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>Test ID</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>Avg Time</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>Throughput</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>Success Rate</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((test) => (
                <tr key={test.test_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1f2937' }}>{test.test_number}</td>
                  <td style={{ padding: '16px 12px', fontSize: '13px', color: '#6b7280' }}>{test.date}</td>
                  <td style={{ padding: '16px 12px', fontSize: '13px', fontFamily: 'monospace', color: '#6b7280' }}>{test.test_id_short}...</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: test.avg_response_time < stats.avg_response_time ? '#10b981' : '#6b7280' }}>
                    {test.avg_response_time}ms
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
                    {test.requests_per_second}
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: test.success_rate === 100 ? '#10b981' : '#f59e0b' }}>
                    {test.success_rate}%
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                    {test.success_rate === 100 ? (
                      <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#d1fae5', color: '#065f46', fontSize: '12px', fontWeight: '600' }}>✓ Pass</span>
                    ) : (
                      <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '600' }}>! Issues</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
