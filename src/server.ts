import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

// --- Example Health Check Route ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PowerUI API is running!' });
});

// --- Example Placeholder Route ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint works!' });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PowerUI backend running on http://localhost:${PORT}`);
});
