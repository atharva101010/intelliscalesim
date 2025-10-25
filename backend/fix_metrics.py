import sys

# Read main.py
with open('main.py', 'r') as f:
    content = f.read()

# Find and replace the get_system_metrics function
new_function = '''@app.get("/metrics/system")
def get_system_metrics():
    try:
        cmd = 'stats --no-stream --format "{{json .}}"'
        result = subprocess.run(f"docker {cmd}", shell=True, capture_output=True, text=True)
        output = result.stdout
        
        containers = []
        total = 0
        
        if output.strip():
            for line in output.strip().split('\\n'):
                if line.strip():
                    try:
                        stat = json.loads(line)
                        container_id = stat.get("ID", "")[:12]
                        
                        # Check if container has intelliscalesim label
                        inspect_cmd = f'inspect {container_id} --format "{{{{.Config.Labels.intelliscalesim}}}}"'
                        inspect_result = subprocess.run(f"docker {inspect_cmd}", shell=True, capture_output=True, text=True)
                        
                        if inspect_result.stdout.strip() != "true":
                            continue
                        
                        # Parse CPU and Memory
                        cpu_str = stat.get("CPUPerc", "0%").replace("%", "")
                        mem_str = stat.get("MemPerc", "0%").replace("%", "")
                        
                        containers.append({
                            "id": container_id,
                            "name": stat.get("Name", ""),
                            "cpu": cpu_str,
                            "memory": mem_str,
                            "net_io": stat.get("NetIO", "0B / 0B")
                        })
                        total += 1
                    except Exception as e:
                        print(f"Error parsing container: {e}")
                        continue
        
        return {
            "total_containers": total,
            "containers": containers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))'''

# Replace the function
import re
pattern = r'@app\.get\("/metrics/system"\).*?raise HTTPException\(status_code=500, detail=str\(e\)\)'
content = re.sub(pattern, new_function, content, flags=re.DOTALL)

# Write back
with open('main.py', 'w') as f:
    f.write(content)

print("✅ Fixed /metrics/system endpoint")
