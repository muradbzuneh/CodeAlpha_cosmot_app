import express from "express";
import {Router} from "express";
import {authenticate, requireRole} from "../middleware/auth.js";
import { getProducts,
      getProductById,
     createProduct,
      updateProduct,
       deleteProduct } from "../controller/product.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", authenticate, requireRole("ADMIN"), createProduct);
router.put("/:id", authenticate, requireRole("ADMIN"), updateProduct);
router.delete("/:id", authenticate, requireRole("ADMIN"), deleteProduct);

export default router;