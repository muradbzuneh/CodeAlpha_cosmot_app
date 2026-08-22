import express from "express";
import cors from "cors";
import { env } from "./env.js";
import authRoutes from "./routes/auth.route.js";

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);

app.listen(env.PORT, () => {
  console.log(`Test server on :${env.PORT}`);
});
