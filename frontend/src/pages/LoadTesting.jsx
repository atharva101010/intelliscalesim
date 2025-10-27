import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LoadTesting = () => {
  const [config, setConfig] = useState({
    target_url: 'http://localhost:8000',
    total_requests: 100,
    concurrency: 10,
    duration: 30
  });
  
  const [limits, setLimits] = useState({
    max_requests: 1000,
    max_concurrency: 50,
    max_duration: 60
  });
  
  const [errors, setErrors] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const progressInterval = useRef(null);

  useEffect(() => {
    fetchLimits();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (isRunning && currentTestId) {
      progressInterval.current = setInterval(() => {
        fetchProgress(currentTestId);
      }, 500);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isRunning, currentTestId]);

  const fetchLimits = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/loadtest/limits/info');
      setLimits(response.data);
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    }
  };

  const fetchProgress = async (testId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/loadtest/progress/${testId}`);
      setProgress(response.data);
      
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        setIsRunning(false);
        fetchHistory();
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/loadtest/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    if (!config.target_url.startsWith('http://') && !config.target_url.startsWith('https://')) {
      newErrors.target_url = 'URL must start with http:// or https://';
    }
    
    if (config.total_requests < 1) {
      newErrors.total_requests = 'Requests must be at least 1';
    } else if (config.total_requests > limits.max_requests) {
      newErrors.total_requests = `Maximum requests allowed: ${limits.max_requests}`;
    }
    
    if (config.concurrency < 1) {
      newErrors.concurrency = 'Concurrency must be at least 1';
    } else if (config.concurrency > limits.max_concurrency) {
      newErrors.concurrency = `Concurrency cannot exceed ${limits.max_concurrency}`;
    }
    
    if (config.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 second';
    } else if (config.duration > limits.max_duration) {
      newErrors.duration = `Time should not exceed more than ${limits.max_duration} seconds`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startTest = async () => {
    if (!validateInputs()) {
      return;
    }
    
    try {
      setIsRunning(true);
      setProgress({
        progress: 0,
        requests_sent: 0,
        successful: 0,
        failed: 0,
        cpu_usage: [],
        memory_usage: [],
        status: 'running'
      });
      
      const response = await axios.post('http://localhost:8000/api/loadtest/start', config);
      setCurrentTestId(response.data.id);
    } catch (error) {
      setIsRunning(false);
      alert('Failed to start test: ' + (error.response?.data?.detail || error.message));
    }
  };

  const exportToPDF = async (test) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const results = test.results || {};
      
      let yPos = 20;
      
      // Header
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('Load Testing Report', 105, 18, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Test ID: ${test.id} | ${new Date(test.created_at).toLocaleString()}`, 105, 27, { align: 'center' });
      
      yPos = 50;
      doc.setTextColor(0, 0, 0);
      
      // Test Configuration
      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.setFont(undefined, 'bold');
      doc.text('Test Configuration', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text(`Target URL: ${test.target_url}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Requests: ${test.total_requests}`, 14, yPos);
      yPos += 6;
      doc.text(`Concurrency Level: ${test.concurrency}`, 14, yPos);
      yPos += 6;
      doc.text(`Duration: ${test.duration} seconds`, 14, yPos);
      yPos += 6;
      doc.text(`Status: ${test.status.toUpperCase()}`, 14, yPos);
      yPos += 12;
      
      // Performance Results
      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.setFont(undefined, 'bold');
      doc.text('Performance Results', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Requests Sent: ${results.total_requests_sent || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Successful Requests: ${results.successful_requests || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Failed Requests: ${results.failed_requests || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Actual Duration: ${(results.actual_duration || 0).toFixed(2)}s`, 14, yPos);
      yPos += 6;
      doc.text(`Requests per Second: ${(results.requests_per_second || 0).toFixed(2)}`, 14, yPos);
      yPos += 6;
      doc.text(`Average Response Time: ${((results.avg_response_time || 0) * 1000).toFixed(2)}ms`, 14, yPos);
      yPos += 6;
      doc.text(`Min Response Time: ${((results.min_response_time || 0) * 1000).toFixed(2)}ms`, 14, yPos);
      yPos += 6;
      doc.text(`Max Response Time: ${((results.max_response_time || 0) * 1000).toFixed(2)}ms`, 14, yPos);
      yPos += 12;
      
      // System Resources
      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.setFont(undefined, 'bold');
      doc.text('System Resource Usage', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text(`Average CPU Usage: ${(results.avg_cpu_usage || 0).toFixed(2)}%`, 14, yPos);
      yPos += 6;
      doc.text(`Peak CPU Usage: ${(results.peak_cpu_usage || 0).toFixed(2)}%`, 14, yPos);
      yPos += 6;
      doc.text(`Average Memory Usage: ${(results.avg_memory_usage || 0).toFixed(2)}%`, 14, yPos);
      yPos += 6;
      doc.text(`Peak Memory Usage: ${(results.peak_memory_usage || 0).toFixed(2)}%`, 14, yPos);
      yPos += 12;
      
      // Summary
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.setFont(undefined, 'bold');
      doc.text('Summary', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      
      const successRate = results.total_requests_sent > 0 
        ? ((results.successful_requests / results.total_requests_sent) * 100).toFixed(2) 
        : 0;
      
      const summaryText = `This load test completed with a ${successRate}% success rate. Out of ${results.total_requests_sent || 0} requests over ${(results.actual_duration || 0).toFixed(2)} seconds, ${results.successful_requests || 0} succeeded and ${results.failed_requests || 0} failed. The app handled ${(results.requests_per_second || 0).toFixed(2)} requests/sec with ${((results.avg_response_time || 0) * 1000).toFixed(2)}ms average response time. CPU averaged ${(results.avg_cpu_usage || 0).toFixed(2)}% and memory ${(results.avg_memory_usage || 0).toFixed(2)}%.`;
      
      const lines = doc.splitTextToSize(summaryText, 180);
      doc.text(lines, 14, yPos);
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated by IntelliScaleSim - ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
      
      doc.save(`load-test-report-${test.id}.pdf`);
      console.log('✅ PDF generated successfully!');
    } catch (error) {
      console.error('❌ PDF Export Error:', error);
      alert('Failed to export PDF: ' + error.message);
    }
  };

  const exportData = (test, format) => {
    if (format === 'pdf') {
      exportToPDF(test);
      return;
    }
    
    const data = {
      id: test.id,
      target_url: test.target_url,
      configuration: {
        total_requests: test.total_requests,
        concurrency: test.concurrency,
        duration: test.duration
      },
      results: test.results,
      created_at: test.created_at
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `load-test-${test.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const results = test.results || {};
      const csv = `Metric,Value
Total Requests,${results.total_requests_sent || 0}
Successful,${results.successful_requests || 0}
Failed,${results.failed_requests || 0}
Duration,${(results.actual_duration || 0).toFixed(2)}s
Requests/sec,${(results.requests_per_second || 0).toFixed(2)}
Avg Response Time,${((results.avg_response_time || 0) * 1000).toFixed(2)}ms
Min Response Time,${((results.min_response_time || 0) * 1000).toFixed(2)}ms
Max Response Time,${((results.max_response_time || 0) * 1000).toFixed(2)}ms
Avg CPU Usage,${(results.avg_cpu_usage || 0).toFixed(2)}%
Peak CPU Usage,${(results.peak_cpu_usage || 0).toFixed(2)}%
Avg Memory Usage,${(results.avg_memory_usage || 0).toFixed(2)}%
Peak Memory Usage,${(results.peak_memory_usage || 0).toFixed(2)}%`;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `load-test-${test.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const cpuChartData = {
    labels: progress?.cpu_usage?.map((_, i) => i) || [],
    datasets: [{
      label: 'CPU Usage (%)',
      data: progress?.cpu_usage || [],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      tension: 0.1
    }]
  };

  const memoryChartData = {
    labels: progress?.memory_usage?.map((_, i) => i) || [],
    datasets: [{
      label: 'Memory Usage (%)',
      data: progress?.memory_usage || [],
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '48px' }}>⚡</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px' }}>Load Testing</h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
              Test your application's performance under load
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        border: '2px solid #f093fb'
      }}>
        <h2 style={{ marginTop: 0, color: '#667eea', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📋 Test Configuration
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '15px' }}>
            🎯 Target URL (localhost only)
          </label>
          <input
            type="text"
            value={config.target_url}
            onChange={(e) => setConfig({...config, target_url: e.target.value})}
            placeholder="http://localhost:8000"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: errors.target_url ? '2px solid #ff4444' : '2px solid #e0e0e0',
              fontSize: '15px',
              background: '#fff',
              color: '#333',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.target_url) e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              if (!errors.target_url) e.target.style.borderColor = '#e0e0e0';
            }}
          />
          {errors.target_url && (
            <div style={{ color: '#ff4444', marginTop: '5px', fontWeight: '600', fontSize: '14px' }}>
              ⚠️ {errors.target_url}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '15px' }}>
            📊 Total Requests (Max: {limits.max_requests})
          </label>
          <input
            type="number"
            value={config.total_requests}
            onChange={(e) => setConfig({...config, total_requests: parseInt(e.target.value)})}
            min="1"
            max={limits.max_requests}
            placeholder="100"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: errors.total_requests ? '2px solid #ff4444' : '2px solid #e0e0e0',
              fontSize: '15px',
              background: '#fff',
              color: '#333',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.total_requests) e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              if (!errors.total_requests) e.target.style.borderColor = '#e0e0e0';
            }}
          />
          {errors.total_requests && (
            <div style={{ color: '#ff4444', marginTop: '5px', fontWeight: '600', fontSize: '14px' }}>
              ⚠️ {errors.total_requests}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '15px' }}>
            🔄 Concurrency (Max: {limits.max_concurrency})
          </label>
          <input
            type="number"
            value={config.concurrency}
            onChange={(e) => setConfig({...config, concurrency: parseInt(e.target.value)})}
            min="1"
            max={limits.max_concurrency}
            placeholder="10"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: errors.concurrency ? '2px solid #ff4444' : '2px solid #e0e0e0',
              fontSize: '15px',
              background: '#fff',
              color: '#333',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.concurrency) e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              if (!errors.concurrency) e.target.style.borderColor = '#e0e0e0';
            }}
          />
          {errors.concurrency && (
            <div style={{ color: '#ff4444', marginTop: '5px', fontWeight: '600', fontSize: '14px' }}>
              ⚠️ {errors.concurrency}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '15px' }}>
            ⏱️ Duration (seconds, Max: {limits.max_duration})
          </label>
          <input
            type="number"
            value={config.duration}
            onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})}
            min="1"
            max={limits.max_duration}
            placeholder="30"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: errors.duration ? '2px solid #ff4444' : '2px solid #e0e0e0',
              fontSize: '15px',
              background: '#fff',
              color: '#333',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.duration) e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              if (!errors.duration) e.target.style.borderColor = '#e0e0e0';
            }}
          />
          {errors.duration && (
            <div style={{ color: '#ff4444', marginTop: '5px', fontWeight: '600', fontSize: '14px' }}>
              ⚠️ {errors.duration}
            </div>
          )}
        </div>

        <button
          onClick={startTest}
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '12px',
            border: 'none',
            background: isRunning ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: isRunning ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = isRunning ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          {isRunning ? '⏳ Test Running...' : '▶ Start Load Test'}
        </button>
      </div>

      {/* Live Dashboard */}
      {isRunning && progress && (
        <div style={{
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          padding: '30px',
          borderRadius: '15px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0 }}>📊 Live Dashboard</h2>
          
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong>Progress</strong>
              <strong>{progress.progress}%</strong>
            </div>
            <div style={{
              width: '100%',
              height: '30px',
              background: '#fff',
              borderRadius: '15px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '30px'
          }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Requests Sent</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{progress.requests_sent}</div>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Successful</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                {progress.successful}
              </div>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Failed</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
                {progress.failed}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '10px', height: '250px' }}>
              <Line data={cpuChartData} options={chartOptions} />
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '10px', height: '250px' }}>
              <Line data={memoryChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Test History */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>📜 Test History</h2>
          <button
            onClick={fetchHistory}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#667eea',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Target URL</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Requests</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Concurrency</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Export</th>
              </tr>
            </thead>
            <tbody>
              {history.map((test) => (
                <tr key={test.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    {new Date(test.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px' }}>{test.target_url}</td>
                  <td style={{ padding: '12px' }}>{test.total_requests}</td>
                  <td style={{ padding: '12px' }}>{test.concurrency}</td>
                  <td style={{ padding: '12px' }}>{test.duration}s</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: test.status === 'completed' ? '#4caf50' : '#ff9800',
                      color: 'white'
                    }}>
                      {test.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => exportData(test, 'pdf')}
                      style={{
                        padding: '6px 12px',
                        marginRight: '5px',
                        borderRadius: '5px',
                        border: 'none',
                        background: '#e74c3c',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => exportData(test, 'json')}
                      style={{
                        padding: '6px 12px',
                        marginRight: '5px',
                        borderRadius: '5px',
                        border: 'none',
                        background: '#2196f3',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📄 JSON
                    </button>
                    <button
                      onClick={() => exportData(test, 'csv')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '5px',
                        border: 'none',
                        background: '#4caf50',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📊 CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Configure and start a load test to see results
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadTesting;
