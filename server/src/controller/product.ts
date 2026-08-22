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

import { Prisma } from "@prisma/client";

export async function getProducts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    const category = req.query.category as string | undefined;
    if (category && category !== "all") {
      where.category = category;
    }

    const gender = req.query.gender as string | undefined;
    if (gender && gender !== "all") {
      where.gender = gender;
    }

    const age = req.query.age as string | undefined;
    if (age && age !== "all") {
      where.age = age;
    }

    const search = req.query.search as string | undefined;
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const minPrice = req.query.minPrice as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
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
      return res.status(400).json({ error: "Invalid product data", details: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create product" });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const body = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id },
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
    const id = String(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Product not found" });
  }
}
