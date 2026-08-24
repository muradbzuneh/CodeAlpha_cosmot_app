import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "products");

export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(400).send(JSON.stringify({ error: "No file uploaded" }));
      return;
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const filename = req.file.filename;
    const url = `/uploads/products/${filename}`;

    res.status(201).send(JSON.stringify({ url, filename }));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Failed to upload file" }));
  }
}
