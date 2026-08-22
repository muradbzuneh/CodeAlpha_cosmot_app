import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import statsRoutes from "./routes/stats.route.js";
import uploadRoutes from "./routes/upload.route.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message || err);
  res.status(err?.status ?? 500).json({ error: err?.message ?? "Internal server error" });
});

export default app;
