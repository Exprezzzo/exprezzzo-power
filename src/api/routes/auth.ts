import { Router } from 'express';

const router = Router();

// Dummy register/login endpoint for test
router.post('/register', (req, res) => {
  res.json({ success: true, message: "Register endpoint (stub)" });
});

router.post('/login', (req, res) => {
  res.json({ success: true, message: "Login endpoint (stub)" });
});

// Add real logic as you wire up Firebase/Auth/DB

export default router;
