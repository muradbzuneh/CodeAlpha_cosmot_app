import express from "express";
import cors from "cors";
import { env } from "./env.js";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
export default app;
