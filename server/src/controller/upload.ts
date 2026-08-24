import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { sendJson } from "../lib/response.js";

const UPLOAD_DIR = path.join(process.cwd(), "public", "products");

export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      sendJson(res, 400, { error: "No file uploaded" });
      return;
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const filename = req.file.filename;
    const url = `/uploads/products/${filename}`;

    sendJson(res, 201, { url, filename });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Failed to upload file" });
  }
}
