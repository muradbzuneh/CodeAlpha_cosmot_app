import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createOrderSchema = z.object({
  address: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export async function createOrder(req: Request, res: Response) {
  try {
    const body = createOrderSchema.parse(req.body);

    const productIds = body.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: "One or more products not found" });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of body.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`,
        });
      }
    }

    const total = body.items.reduce((sum, item) => {
      return sum + productMap.get(item.productId)!.price * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.sub,
          total,
          address: body.address,
          items: {
            create: body.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of body.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const where = req.user!.role === "ADMIN" ? {} : { userId: req.user!.sub };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (req.user!.role !== "ADMIN" && order.userId !== req.user!.sub) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const body = updateStatusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: body.status },
    });
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to update order" });
  }
}
