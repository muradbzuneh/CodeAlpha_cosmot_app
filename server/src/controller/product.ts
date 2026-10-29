import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendJson } from "../lib/response.js";

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

    // Default to active only; include archived only if explicitly requested
    if (req.query.includeArchived !== "true") {
      where.isActive = true;
    }

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

    const [rawProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reviews: { select: { rating: true } },
          variants: { select: { id: true, title: true, price: true, stock: true, isDefault: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const products = rawProducts.map((p) => {
      const reviewCount = p.reviews.length;
      const avg = reviewCount > 0 ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount : 5.0;
      return {
        ...p,
        averageRating: +avg.toFixed(1),
        reviewCount,
      };
    });

    sendJson(res, 200, {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Failed to fetch products" });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { price: "asc" },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      sendJson(res, 404, { error: "Product not found" });
      return;
    }

    const reviewCount = product.reviews.length;
    const avg = reviewCount > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
      : 5.0;

    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of product.reviews) {
      if (ratingDistribution[r.rating] !== undefined) {
        ratingDistribution[r.rating]++;
      }
    }

    sendJson(res, 200, {
      ...product,
      averageRating: +avg.toFixed(1),
      reviewCount,
      ratingDistribution,
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Failed to fetch product" });
  }
}

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(3).max(1000),
  skinType: z.string().max(50).optional(),
});

export async function createProductReview(req: Request, res: Response) {
  try {
    const productId = String(req.params.id);
    const userId = req.user!.sub;

    const validated = reviewSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      sendJson(res, 404, { error: "Product not found" });
      return;
    }

    // Check if customer previously completed a paid order containing this product
    const purchasedOrder = await prisma.order.findFirst({
      where: {
        userId,
        paymentStatus: "PAID",
        items: { some: { productId } },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: validated.rating,
        title: validated.title || null,
        comment: validated.comment,
        skinType: validated.skinType || null,
        verified: !!purchasedOrder,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    sendJson(res, 201, review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "Validation failed", details: error.issues });
      return;
    }
    console.error("Create review error:", error);
    sendJson(res, 500, { error: "Failed to submit review" });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const validatedData = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: validatedData });
    sendJson(res, 201, product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "Invalid product data", details: error.issues });
      return;
    }
    console.error(error);
    sendJson(res, 500, { error: "Failed to create product" });
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
    sendJson(res, 200, product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "Validation failed", details: error.issues });
      return;
    }
    console.error(error);
    sendJson(res, 500, { error: "Failed to update product" });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    // Soft delete / archive to safely preserve historical orders and invoices
    const archived = await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });
    sendJson(res, 200, { message: "Product archived successfully", id: archived.id });
  } catch (error) {
    console.error("Archive product error:", error);
    sendJson(res, 404, { error: "Product not found" });
  }
}
