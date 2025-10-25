# Find this function in autoscaler.py and replace it:

def get_container_stats(self) -> List[Dict]:
    """Get current stats for all containers"""
    try:
        # Fixed: Use proper filter syntax
        cmd = 'stats --no-stream --format "{{json .}}" --filter "label=intelliscalesim=true"'
        result = subprocess.run(f"docker {cmd}", shell=True, capture_output=True, text=True)
        output = result.stdout
        
        stats = []
        if output.strip():
            for line in output.strip().split('\n'):
                if line.strip():
                    stat = json.loads(line)
                    # Parse percentages - remove the % sign
                    cpu_str = stat.get("CPUPerc", "0%").replace("%", "")
                    mem_str = stat.get("MemPerc", "0%").replace("%", "")
                    
                    try:
                        cpu_percent = float(cpu_str)
                        mem_percent = float(mem_str)
                    except:
                        cpu_percent = 0.0
                        mem_percent = 0.0
                    
                    stats.append({
                        "id": stat.get("ID", "")[:12],
                        "name": stat.get("Name", ""),
                        "cpu": cpu_percent,
                        "memory": mem_percent
                    })
        
        return stats
    except Exception as e:
        print(f"Error getting container stats: {e}")
        return []
