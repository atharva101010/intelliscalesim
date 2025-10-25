const express = require('express');
const router = express.Router();
const dockerMetrics = require('../services/dockerMetrics');

router.get('/status', async (req, res) => {
  try {
    const status = await dockerMetrics.checkDockerStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/containers', async (req, res) => {
  try {
    const userId = req.query.userId;
    const aggregated = await dockerMetrics.getAggregatedMetrics(userId);
    
    res.json({
      success: true,
      data: aggregated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/container/:id', async (req, res) => {
  try {
    const metrics = await dockerMetrics.getContainerMetrics(req.params.id);
    
    if (metrics.error && !metrics.running) {
      return res.status(404).json({
        success: false,
        message: metrics.error
      });
    }
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/container/:id/logs', async (req, res) => {
  try {
    const tail = parseInt(req.query.tail) || 100;
    const logs = await dockerMetrics.getContainerLogs(req.params.id, tail);
    
    res.json({
      success: true,
      data: {
        logs,
        containerId: req.params.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/live', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userId = req.query.userId;

  const interval = setInterval(async () => {
    try {
      const metrics = await dockerMetrics.getAggregatedMetrics(userId);
      res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    } catch (error) {
      console.error('Error streaming metrics:', error);
    }
  }, 3000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

module.exports = router;
