import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import auth from "./lib/auth.js";
import { env } from "./env.js";
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import statsRoutes from "./routes/stats.route.js";
import uploadRoutes from "./routes/upload.route.js";
import { sendJson } from "./lib/response.js";

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Let frontend Vite manage assets
  })
);

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 1. Better Auth Route Handler (must be mounted before express.json() for raw stream handling, though better-auth handles both)
app.use("/api/auth", authLimiter);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.all("/api/auth", toNodeHandler(auth));

// Express body parser for regular API routes
app.use(express.json());

const publicDir = path.join(process.cwd(), "public");
app.use("/uploads", express.static(publicDir));

app.get("/health", (_req, res) => {
  sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);

// Unhandled error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message || err);
  sendJson(res, err?.status ?? 500, { error: err?.message ?? "Internal server error" });
});

export default app;
