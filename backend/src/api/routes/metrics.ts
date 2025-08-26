import { Router } from 'express';
import { db } from '../../config/firebase';
import { rateLimiter } from '../middleware/rateLimit';

export const metricsRoutes = Router();

// Apply rate limiting
metricsRoutes.use(rateLimiter);

// Get user metrics
metricsRoutes.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const metricsDoc = await db
      .collection('metrics')
      .doc(userId)
      .get();
    
    if (!metricsDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Metrics not found'
      });
    }
    
    res.json({
      success: true,
      data: metricsDoc.data()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

// Update metrics
metricsRoutes.post('/update', async (req, res) => {
  try {
    const { userId, metrics } = req.body;
    
    await db
      .collection('metrics')
      .doc(userId)
      .set({
        ...metrics,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    
    res.json({
      success: true,
      message: 'Metrics updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update metrics'
    });
  }
});