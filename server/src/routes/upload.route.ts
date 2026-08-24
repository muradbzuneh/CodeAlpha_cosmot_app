import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, requireRole } from "../middleware/auth.js";
import { uploadImage } from "../controller/upload.js";

const UPLOAD_DIR = path.join(process.cwd(), "public", "products");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only image files (jpg, png, webp) are allowed"));
  },
});

const router = Router();

router.post("/", authenticate, requireRole("ADMIN"), upload.single("image"), uploadImage);

export default router;
