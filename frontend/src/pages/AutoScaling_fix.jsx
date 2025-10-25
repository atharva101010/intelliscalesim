// Find and replace the updateConfig function (around line 50-60)

const updateConfig = async () => {
  try {
    // Backend expects these exact field names
    const configPayload = {
      cpu_scale_up: parseFloat(config.cpu_scale_up),
      cpu_scale_down: parseFloat(config.cpu_scale_down),
      memory_scale_up: parseFloat(config.memory_scale_up),
      memory_scale_down: parseFloat(config.memory_scale_down),
      min_replicas: parseInt(config.min_replicas),
      max_replicas: parseInt(config.max_replicas),
      check_interval: parseInt(config.check_interval)
    };
    
    await axios.put(`${API_BASE_URL}/autoscaler/config`, configPayload);
    alert('✅ Configuration updated successfully!');
    fetchData();
  } catch (err) {
    console.error('Failed to update config:', err);
    alert('❌ Failed to update configuration: ' + (err.response?.data?.detail || err.message));
  }
};
