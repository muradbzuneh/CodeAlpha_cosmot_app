import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  verifyOrderPayment,
  chapaWebhook,
} from "../controller/orders.js";

const router = Router();

// Public webhook from Chapa (must not require user bearer auth)
router.post("/webhook", chapaWebhook);

// Protected routes
router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);
router.get("/verify/:txRef", authenticate, verifyOrderPayment);
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/status", authenticate, requireRole("ADMIN"), updateOrderStatus);

export default router;
