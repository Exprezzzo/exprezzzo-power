import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRoutes } from "./api/routes/auth";
import { metricsRoutes } from "./api/routes/metrics";
import stripeRoutes from "./api/routes/stripe";
import { errorHandler } from "./api/middleware/errorHandler";
import { initializeFirebase } from "./config/firebase";
dotenv.config({ path: ".env.local" });
initializeFirebase();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Exprezzzo Power API is running!" });
});
app.use("/api/auth", authRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/stripe", stripeRoutes);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(` Backend: http://localhost:${PORT}`);
});

