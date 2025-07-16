import { Router } from 'express';

const router = Router();

router.get('/current', (req, res) => {
  // Return dummy data (replace with real metrics logic)
  res.json({
    data: {
      revenue: { current: 1500, previous: 1200, trend: [1000, 1100, 1200, 1300, 1400, 1500], growth: 25 },
      users: { total: 205, active: 47, new: 10, trend: [30, 31, 32, 39, 44, 47] },
      usage: { requests: 12000, tokens: 100000, cost: 75, trend: [4000, 6000, 8000, 10000, 12000] },
      health: { uptime: 99.97, latency: 87, errorRate: 0.01, providers: { openai: 'healthy', anthropic: 'healthy' } },
      margins: { gross: 55, net: 42, byProvider: { openai: 53, anthropic: 48 }, trend: [30, 35, 40, 42, 47, 55] }
    }
  });
});

export default router;
