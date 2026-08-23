import { Request, Response } from "express";

export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(400).send(JSON.stringify({ error: "No file uploaded" }));
      return;
    }

    const filename = req.file.filename;
    const url = `/uploads/products/${filename}`;

    res.status(201).send(JSON.stringify({ url, filename }));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Failed to upload file" }));
  }
}
