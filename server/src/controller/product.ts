import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  bodyPart: z.string().optional(),
  size: z.string().optional(),
  isNew: z.boolean().optional(),
});

export async function getProducts(_req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const validatedData = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: validatedData });
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid product data", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create product" });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const body = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to update product" });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Product not found" });
  }
}
