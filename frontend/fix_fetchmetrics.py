# Read the file
with open('src/components/student/RealTimeBilling.jsx', 'r') as f:
    lines = f.readlines()

# Find the start and end of fetchMetrics function
start_idx = None
end_idx = None
brace_count = 0

for i, line in enumerate(lines):
    if 'const fetchMetrics = async () => {' in line:
        start_idx = i
        brace_count = 1
        continue
    
    if start_idx is not None and end_idx is None:
        brace_count += line.count('{') - line.count('}')
        if brace_count == 0:
            end_idx = i
            break

# Create the new fetchMetrics function
new_function = '''  const fetchMetrics = async () => {
    try {
      const intervalParam = encodeURIComponent(selectedInterval);
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
'''

# Replace the function
if start_idx is not None and end_idx is not None:
    lines = lines[:start_idx] + [new_function + '\n'] + lines[end_idx+1:]
    
    # Write back
    with open('src/components/student/RealTimeBilling.jsx', 'w') as f:
        f.writelines(lines)
    
    print("✅ Successfully replaced fetchMetrics function!")
    print(f"   Replaced lines {start_idx + 1} to {end_idx + 1}")
else:
    print("❌ Could not find fetchMetrics function boundaries")
