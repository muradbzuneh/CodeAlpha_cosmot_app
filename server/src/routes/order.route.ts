import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { createOrder, getOrders, getOrderById, updateOrderStatus } from "../controller/orders.js";

const router = Router();

router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/status", authenticate, requireRole("ADMIN"), updateOrderStatus);

export default router;
