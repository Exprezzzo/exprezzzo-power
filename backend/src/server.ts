import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import winston from "winston";
// Assuming these routes are implemented within the backend/src/api/routes
import { authRoutes } from "./api/routes/auth";
import { metricsRoutes } from "./api/routes/metrics";
import stripeRoutes from "./api/routes/stripe"; // This would be the backend's own Stripe routes
import { errorHandler } from "./api/middleware/errorHandler";
import { initializeFirebase } from "./config/firebase";

// Load environment variables from backend's .env.local
dotenv.config({ path: ".env.local" });

// Initialize Firebase Admin SDK for backend
initializeFirebase();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Logger setup
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
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

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API to allow broader integrations if needed
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL, // This environment variable needs to be set in Vercel for the backend
      "http://localhost:3000",
      "https://exprezzzo-power.vercel.app" // Your Vercel deployment URL
    ].filter(Boolean); // Remove any undefined/null values

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Origin ${origin} not allowed`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"] // Add any custom headers your frontend sends
}));

// Stripe webhook needs raw body before body-parser
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    // body: req.body // Be cautious logging sensitive body data in production
  });
  next();
});

// Health check endpoint for monitoring
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Exprezzzo Power Backend API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    firebaseInitialized: initializeFirebase(), // Check if Firebase is truly initialized
  });
});

// API routes (Note: these are for the Express backend, not Next.js API routes)
app.use("/api/auth", authRoutes); // e.g., if frontend calls /api/auth via Express
app.use("/api/metrics", metricsRoutes);
app.use("/api/stripe", stripeRoutes); // e.g., if frontend proxies Stripe calls to Express backend

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Global error handler (must be the last middleware)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Exprezzzo Power Backend running on http://localhost:${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown for Vercel or other platforms
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});

// For local development with tsx, ensure no hot reload issues with firebase init
process.on("SIGUSR2", () => {
  logger.info("SIGUSR2 signal received (nodemon/tsx reload): attempting graceful shutdown");
  server.close(() => {
    logger.info("HTTP server closed for reload");
    process.kill(process.pid, 'SIGUSR2');
  });
});
