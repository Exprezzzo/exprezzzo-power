import express from 'express';
import cors from 'cors';
import path from 'path';

// Import routes
import authRoutes from './api/routes/auth';
import metricsRoutes from './api/routes/metrics';
// Add other route imports as needed

const app = express();
app.use(cors());
app.use(express.json());

// Example Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PowerUI API is running!' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
// Add any other routers (e.g., /api/usage, /api/integrations, etc.)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PowerUI backend running on http://localhost:${PORT}`);
});
