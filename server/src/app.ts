import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./env.js";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import statsRoutes from "./routes/stats.route.js";
import uploadRoutes from "./routes/upload.route.js";
import { sendJson } from "./lib/response.js";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());

const publicDir = path.join(process.cwd(), "public");
app.use("/uploads", express.static(publicDir));

app.get("/health", (_req, res) => {
  sendJson(res, 200, { status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message || err);
  sendJson(res, err?.status ?? 500, { error: err?.message ?? "Internal server error" });
});

export default app;
