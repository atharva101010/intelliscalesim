#!/usr/bin/env python3
import time
import multiprocessing

def cpu_stress():
    """Function to stress CPU"""
    while True:
        # Perform intensive calculations
        sum([i**2 for i in range(10000)])

if __name__ == "__main__":
    print("🔥 CPU Stress Test Started!")
    print("This will consume high CPU to test auto-scaling...")
    
    # Use multiple cores to generate high CPU usage
    num_processes = multiprocessing.cpu_count()
    processes = []
    
    for i in range(num_processes):
        p = multiprocessing.Process(target=cpu_stress)
        p.start()
        processes.append(p)
        print(f"Started stress process {i+1}/{num_processes}")
    
    # Keep running
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n🛑 Stopping stress test...")
        for p in processes:
            p.terminate()
        print("✅ Stopped")
