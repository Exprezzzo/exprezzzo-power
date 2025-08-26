import { Router } from 'express';
import { auth } from '../../config/firebase';
import { z } from 'zod';

export const authRoutes = Router();

// Verify token schema
const verifyTokenSchema = z.object({
  token: z.string().min(1)
});

// Verify Firebase token
authRoutes.post('/verify', async (req, res) => {
  try {
    const { token } = verifyTokenSchema.parse(req.body);
    
    const decodedToken = await auth.verifyIdToken(token);
    
    res.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Create custom token
authRoutes.post('/custom-token', async (req, res) => {
  try {
    const { uid } = req.body;
    const customToken = await auth.createCustomToken(uid);
    
    res.json({
      success: true,
      customToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create custom token'
    });
  }
});