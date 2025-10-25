const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class DockerMetricsService {
  constructor() {
    this.metricsCache = new Map();
  }

  async getStudentContainers(userId = null) {
    try {
      const filters = {
        label: ['deployed_by=student']
      };
      
      if (userId) {
        filters.label.push(`user_id=${userId}`);
      }

      const containers = await docker.listContainers({
        all: true,
        filters: filters
      });

      return containers.map(container => ({
        id: container.Id.substring(0, 12),
        fullId: container.Id,
        name: container.Names[0].replace('/', ''),
        image: container.Image,
        status: container.State,
        state: container.Status,
        created: new Date(container.Created * 1000).toISOString(),
        ports: this.formatPorts(container.Ports),
        labels: container.Labels
      }));
    } catch (error) {
      console.error('Error getting student containers:', error);
      return [];
    }
  }

  async getContainerMetrics(containerId) {
    try {
      const container = docker.getContainer(containerId);
      
      const inspection = await container.inspect();
      if (!inspection.State.Running) {
        return {
          containerId,
          running: false,
          cpu: 0,
          memory: 0,
          error: 'Container is not running'
        };
      }

      const stats = await container.stats({ stream: false });

      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - 
                       (stats.precpu_stats.cpu_usage?.total_usage || 0);
      const systemDelta = stats.cpu_stats.system_cpu_usage - 
                          (stats.precpu_stats.system_cpu_usage || 0);
      const cpuCount = stats.cpu_stats.online_cpus || 1;
      
      let cpuPercent = 0;
      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
      }

      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 1;
      const memoryPercent = (memoryUsage / memoryLimit) * 100;

      const networks = stats.networks || {};
      let networkRx = 0;
      let networkTx = 0;
      Object.values(networks).forEach(net => {
        networkRx += net.rx_bytes || 0;
        networkTx += net.tx_bytes || 0;
      });

      const metrics = {
        containerId: containerId.substring(0, 12),
        running: true,
        cpu: Math.min(Math.round(cpuPercent * 100) / 100, 100),
        memory: Math.min(Math.round(memoryPercent * 100) / 100, 100),
        memoryUsage: this.formatBytes(memoryUsage),
        memoryLimit: this.formatBytes(memoryLimit),
        memoryUsageBytes: memoryUsage,
        memoryLimitBytes: memoryLimit,
        networkRx: this.formatBytes(networkRx),
        networkTx: this.formatBytes(networkTx),
        networkRxBytes: networkRx,
        networkTxBytes: networkTx,
        timestamp: new Date().toISOString()
      };

      this.metricsCache.set(containerId, metrics);
      
      return metrics;
    } catch (error) {
      console.error(`Error getting metrics for container ${containerId}:`, error.message);
      return {
        containerId,
        running: false,
        cpu: 0,
        memory: 0,
        error: error.message
      };
    }
  }

  async getAggregatedMetrics(userId = null) {
    try {
      const containers = await this.getStudentContainers(userId);
      
      if (containers.length === 0) {
        return {
          avgCpu: 0,
          avgMemory: 0,
          totalContainers: 0,
          runningContainers: 0,
          stoppedContainers: 0,
          containers: []
        };
      }

      const runningContainers = containers.filter(c => c.status === 'running');
      const metricsPromises = runningContainers.map(c => this.getContainerMetrics(c.fullId));
      const metrics = await Promise.all(metricsPromises);
      const validMetrics = metrics.filter(m => m.running && !m.error);

      const avgCpu = validMetrics.length > 0 
        ? validMetrics.reduce((sum, m) => sum + m.cpu, 0) / validMetrics.length 
        : 0;
      const avgMemory = validMetrics.length > 0 
        ? validMetrics.reduce((sum, m) => sum + m.memory, 0) / validMetrics.length 
        : 0;

      const containersWithMetrics = containers.map(container => {
        const metric = metrics.find(m => m.containerId === container.id) || {
          cpu: 0,
          memory: 0,
          running: container.status === 'running'
        };
        return {
          ...container,
          metrics: metric
        };
      });

      return {
        avgCpu: Math.round(avgCpu * 100) / 100,
        avgMemory: Math.round(avgMemory * 100) / 100,
        totalContainers: containers.length,
        runningContainers: runningContainers.length,
        stoppedContainers: containers.length - runningContainers.length,
        containers: containersWithMetrics
      };
    } catch (error) {
      console.error('Error getting aggregated metrics:', error);
      return {
        avgCpu: 0,
        avgMemory: 0,
        totalContainers: 0,
        runningContainers: 0,
        stoppedContainers: 0,
        containers: [],
        error: error.message
      };
    }
  }

  async getContainerLogs(containerId, tail = 100) {
    try {
      const container = docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail,
        timestamps: true
      });
      
      return logs.toString('utf-8');
    } catch (error) {
      console.error(`Error getting logs for container ${containerId}:`, error);
      return `Error: ${error.message}`;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatPorts(ports) {
    if (!ports || ports.length === 0) return [];
    return ports.map(port => ({
      private: port.PrivatePort,
      public: port.PublicPort || null,
      type: port.Type
    }));
  }

  async checkDockerStatus() {
    try {
      await docker.ping();
      const info = await docker.info();
      return {
        running: true,
        containers: info.Containers,
        containersRunning: info.ContainersRunning,
        containersPaused: info.ContainersPaused,
        containersStopped: info.ContainersStopped,
        images: info.Images,
        serverVersion: info.ServerVersion
      };
    } catch (error) {
      return {
        running: false,
        error: error.message
      };
    }
  }
}

module.exports = new DockerMetricsService();
