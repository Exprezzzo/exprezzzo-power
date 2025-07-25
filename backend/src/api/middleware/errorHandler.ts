import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string; // Custom error code
  details?: any; // For additional error details in dev
}

export function errorHandler(
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction // next is required for Express error handlers even if not used
) {
  // Log error details for debugging
  logger.error('Error occurred in API:', {
    error: err.message,
    stack: err.stack,
    status: err.status,
    code: err.code,
    path: req.path,
    method: req.method,
    // body: req.body, // Be cautious logging sensitive body data in production
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const status = err.status || 500;

  // Customize error message for production to avoid leaking sensitive info
  const message = process.env.NODE_ENV === 'production' 
    ? getProductionMessage(err)
    : err.message; // In development, show detailed message

  res.status(status).json({
    success: false,
    error: message,
    // Include stack trace and raw error details only in development
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err // Include the raw error object for full context
    })
  });
}

// Helper function for production error messages
function getProductionMessage(err: ErrorWithStatus): string {
  // Map specific error codes or status codes to user-friendly messages
  const errorMessages: { [key: string]: string } = {
    'auth/invalid-token': 'Invalid authentication. Please log in again.',
    'auth/expired-token': 'Your session has expired. Please log in again.',
    'stripe/invalid-request': 'A payment processing error occurred. Please check your card details or contact support.',
    'rate-limit': 'Too many requests. Please try again after some time.',
    'ECONNREFUSED': 'Service currently unavailable. Please try again shortly.', // Example for connection errors
    // Add more specific mappings based on common errors from your services (Firebase, Stripe, etc.)
  };

  // Prioritize specific error codes, then generic status messages, then a fallback
  return errorMessages[err.code || ''] || 
         (err.status === 401 ? 'Authentication failed.' : 
         (err.status === 403 ? 'Access forbidden.' :
         (err.status === 404 ? 'Resource not found.' :
         'An unexpected error occurred. Please try again.')));
}
