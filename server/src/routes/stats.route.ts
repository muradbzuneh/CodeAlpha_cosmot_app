import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { getStats } from "../controller/stats.js";

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), getStats);

export default router;
