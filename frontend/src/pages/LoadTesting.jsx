import { useState, useEffect } from 'react';
import { Activity, Play, AlertCircle, Clock, Zap, TrendingUp, CheckCircle2, Download, BarChart } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function LoadTesting() {
  const [formData, setFormData] = useState({
    target_url: 'http://localhost:',
    total_requests: 100,
    concurrency: 10,
    duration_seconds: 30,
    method: 'GET'
  });

  const [currentTest, setCurrentTest] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (currentTest && isRunning) {
      const interval = setInterval(() => {
        fetchTestResult(currentTest);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentTest, isRunning]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/load-test/history/all`);
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchTestResult = async (testId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/load-test/${testId}`);
      setTestResult(response.data);
      
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        setIsRunning(false);
        fetchHistory();
      }
    } catch (err) {
      console.error('Error fetching test result:', err);
    }
  };

  // Frontend validation limits
  const MAX_LIMITS = {
    total_requests: 1000,
    concurrency: 50,
    duration: 60
  };

  const startTest = async () => {
    // VALIDATE INPUTS BEFORE SENDING TO BACKEND
    const errors = [];
    
    if (parseInt(formData.total_requests) > MAX_LIMITS.total_requests) {
      errors.push(`Total Requests cannot exceed ${MAX_LIMITS.total_requests}`);
    }
    if (parseInt(formData.concurrency) > MAX_LIMITS.concurrency) {
      errors.push(`Concurrency cannot exceed ${MAX_LIMITS.concurrency}`);
    }
    if (parseInt(formData.duration_seconds) > MAX_LIMITS.duration) {
      errors.push(`Duration cannot exceed ${MAX_LIMITS.duration} seconds`);
    }
    
    // If there are validation errors, show them and STOP
    if (errors.length > 0) {
      setError(errors.join(' | '));
      return; // DON'T proceed with the request
    }

    setError(null);
    setTestResult(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/load-test/start`, formData);
      setCurrentTest(response.data.test_id);
      setIsRunning(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start test');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'target_url' ? value : parseInt(value)
    }));
  };

  const exportTest = async (testId, format) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/load-test/${testId}/export/${format}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `load_test_${testId.substring(0,8)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const toggleTestSelection = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const compareTests = async () => {
    if (selectedTests.length < 2) {
      alert('Please select at least 2 tests to compare');
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/load-test/compare`, selectedTests);
      setComparison(response.data);
      setShowComparison(true);
    } catch (err) {
      console.error('Comparison failed:', err);
    }
  };

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)', 
        borderRadius: '16px', 
        padding: '40px', 
        marginBottom: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            padding: '16px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <Zap style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: 0 }}>
              Load Testing
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '8px', fontSize: '16px' }}>
              Test your application's performance under load
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column - Configuration */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '2px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f3f4f6' }}>
            <Activity style={{ width: '24px', height: '24px', color: '#f97316' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Test Configuration
            </h2>
          </div>

          {error && (
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px', 
              background: '#fee2e2', 
              border: '2px solid #fecaca', 
              borderRadius: '12px',
              display: 'flex',
              gap: '12px'
            }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: '600', color: '#991b1b', margin: '0 0 4px 0' }}>Error</p>
                <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '12px', border: '2px solid #fde68a' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#92400e', marginBottom: '8px', fontSize: '14px' }}>
                Target URL <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(localhost only)</span>
              </label>
              <input
                type="text"
                name="target_url"
                value={formData.target_url}
                onChange={handleInputChange}
                placeholder="http://localhost:8002"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #fbbf24', borderRadius: '8px', fontSize: '14px', background: 'white', outline: 'none' }}
                disabled={isRunning}
              />
            </div>

            <div style={{ padding: '20px', background: '#dbeafe', borderRadius: '12px', border: '2px solid #bfdbfe' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#1e40af', marginBottom: '8px', fontSize: '14px' }}>
                Total Requests <span style={{ color: '#f97316', fontWeight: 'bold' }}>(Max: 1000)</span>
              </label>
              <input
                type="number"
                name="total_requests"
                value={formData.total_requests}
                onChange={handleInputChange}
                min="1"
                max="1000"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #3b82f6', borderRadius: '8px', fontSize: '14px', background: 'white', outline: 'none' }}
                disabled={isRunning}
              />
            </div>

            <div style={{ padding: '20px', background: '#e0e7ff', borderRadius: '12px', border: '2px solid #c7d2fe' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#3730a3', marginBottom: '8px', fontSize: '14px' }}>
                Concurrency <span style={{ color: '#f97316', fontWeight: 'bold' }}>(Max: 50)</span>
              </label>
              <input
                type="number"
                name="concurrency"
                value={formData.concurrency}
                onChange={handleInputChange}
                min="1"
                max="50"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #6366f1', borderRadius: '8px', fontSize: '14px', background: 'white', outline: 'none' }}
                disabled={isRunning}
              />
            </div>

            <div style={{ padding: '20px', background: '#f3e8ff', borderRadius: '12px', border: '2px solid #e9d5ff' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#6b21a8', marginBottom: '8px', fontSize: '14px' }}>
                Duration (seconds) <span style={{ color: '#f97316', fontWeight: 'bold' }}>(Max: 60)</span>
              </label>
              <input
                type="number"
                name="duration_seconds"
                value={formData.duration_seconds}
                onChange={handleInputChange}
                min="1"
                max="60"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #a855f7', borderRadius: '8px', fontSize: '14px', background: 'white', outline: 'none' }}
                disabled={isRunning}
              />
            </div>

            <button
              onClick={startTest}
              disabled={isRunning}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '16px',
                color: 'white',
                background: isRunning ? '#9ca3af' : 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: isRunning ? 'none' : '0 4px 6px rgba(249, 115, 22, 0.3)'
              }}
            >
              <Play style={{ width: '20px', height: '20px' }} />
              {isRunning ? 'Test Running...' : 'Start Load Test'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {testResult ? (
            <>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', fontSize: '16px' }}>Progress</h3>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#f97316' }}>
                    {testResult.progress.toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: '12px', background: '#fee2e2', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${testResult.progress}%`, height: '100%', background: 'linear-gradient(90deg, #f97316 0%, #ec4899 100%)', transition: 'width 0.5s ease' }} />
                </div>
                
                {/* Export Buttons with PDF */}
                {testResult.status === 'completed' && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <button
                      onClick={() => exportTest(testResult.test_id, 'pdf')}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(249, 115, 22, 0.3)'
                      }}
                    >
                      <Download size={16} />
                      📄 Download PDF Report
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => exportTest(testResult.test_id, 'csv')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '2px solid #10b981',
                          background: 'white',
                          color: '#10b981',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={14} />
                        CSV
                      </button>
                      <button
                        onClick={() => exportTest(testResult.test_id, 'json')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '2px solid #3b82f6',
                          background: 'white',
                          color: '#3b82f6',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={14} />
                        JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', fontSize: '16px' }}>Statistics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Requests</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{testResult.total_requests}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Completed</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>{testResult.completed_requests}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Failed</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ef4444' }}>{testResult.failed_requests}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Req/sec</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#3b82f6' }}>{testResult.requests_per_second.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #e5e7eb' }}>
                <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', fontSize: '16px' }}>Response Time (ms)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Average</span>
                    <span style={{ fontWeight: 'bold' }}>{testResult.avg_response_time.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Min</span>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{testResult.min_response_time.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Max</span>
                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{testResult.max_response_time.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', padding: '48px 24px', border: '2px dashed #e5e7eb', textAlign: 'center' }}>
              <TrendingUp style={{ width: '48px', height: '48px', color: '#d1d5db', margin: '0 auto 16px' }} />
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Configure and start a load test to see results
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Test History with Comparison */}
      {history.length > 0 && (
        <div style={{ marginTop: '32px', background: 'white', borderRadius: '16px', padding: '32px', border: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Test History</h2>
            {selectedTests.length >= 2 && (
              <button
                onClick={compareTests}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <BarChart size={16} />
                Compare {selectedTests.length} Tests
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {history.slice(0, 12).map((test) => (
              <div 
                key={test.test_id}
                onClick={() => toggleTestSelection(test.test_id)}
                style={{ 
                  border: selectedTests.includes(test.test_id) ? '3px solid #f97316' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  background: selectedTests.includes(test.test_id) ? '#fff7ed' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ 
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: test.status === 'completed' ? '#d1fae5' : '#fee2e2',
                    color: test.status === 'completed' ? '#065f46' : '#991b1b'
                  }}>
                    {test.status}
                  </span>
                  {selectedTests.includes(test.test_id) && (
                    <CheckCircle2 size={20} style={{ color: '#f97316' }} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Requests</span>
                    <span style={{ fontWeight: '600' }}>{test.completed_requests}/{test.total_requests}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Avg Time</span>
                    <span style={{ fontWeight: '600' }}>{test.avg_response_time.toFixed(0)}ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Req/sec</span>
                    <span style={{ fontWeight: '600' }}>{test.requests_per_second.toFixed(0)}</span>
                  </div>
                </div>
                
                {/* Export buttons with PDF */}
                {test.status === 'completed' && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); exportTest(test.test_id, 'pdf'); }}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Download size={12} />
                      📄 PDF
                    </button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); exportTest(test.test_id, 'csv'); }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid #10b981',
                          background: 'white',
                          color: '#10b981',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        CSV
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); exportTest(test.test_id, 'json'); }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid #3b82f6',
                          background: 'white',
                          color: '#3b82f6',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && comparison && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                Test Comparison ({comparison.test_count} tests)
              </h2>
              <button
                onClick={() => setShowComparison(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '24px', padding: '20px', background: '#f3f4f6', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Best Avg Response Time</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    {comparison.summary.best_avg_response_time.toFixed(2)}ms
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Worst Avg Response Time</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
                    {comparison.summary.worst_avg_response_time.toFixed(2)}ms
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Best Req/sec</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    {comparison.summary.best_requests_per_second.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Avg Success Rate</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {comparison.summary.avg_success_rate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Test ID</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Requests</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Success %</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Avg Time</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>Req/sec</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.tests.map((test, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {test.test_id.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                        {test.completed_requests}/{test.total_requests}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: test.success_rate === 100 ? '#10b981' : '#f59e0b' }}>
                        {test.success_rate}%
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: test.avg_response_time === comparison.summary.best_avg_response_time ? '#10b981' : 
                               test.avg_response_time === comparison.summary.worst_avg_response_time ? '#ef4444' : '#1f2937'
                      }}>
                        {test.avg_response_time}ms
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: test.requests_per_second === comparison.summary.best_requests_per_second ? '#10b981' : '#1f2937'
                      }}>
                        {test.requests_per_second}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
