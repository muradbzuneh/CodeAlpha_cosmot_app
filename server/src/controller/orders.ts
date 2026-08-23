import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createOrderSchema = z.object({
  address: z.string().min(1),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  customerName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  paymentMethod: z.string().optional(),
  shipping: z.string().optional(),
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
      res.status(400).send(JSON.stringify({ error: "One or more products not found" }));
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of body.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        res.status(400).send(JSON.stringify({
          error: `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`,
        }));
        return;
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
          city: body.city ?? null,
          postalCode: body.postalCode ?? null,
          customerName: body.customerName ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
          paymentMethod: body.paymentMethod ?? null,
          shipping: body.shipping ?? "standard",
          items: {
            create: body.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of body.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    res.status(201).send(JSON.stringify(order));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send(JSON.stringify({ error: "Validation failed", details: error.issues }));
      return;
    }
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Failed to create order" }));
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const where = req.user!.role === "ADMIN" ? {} : { userId: req.user!.sub };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.send(JSON.stringify(orders));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Failed to fetch orders" }));
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!order) { res.status(404).send(JSON.stringify({ error: "Order not found" })); return; }

    if (req.user!.role !== "ADMIN" && order.userId !== req.user!.sub) {
      res.status(403).send(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    res.send(JSON.stringify(order));
  } catch (error) {
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Failed to fetch order" }));
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const body = updateStatusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id },
      data: { status: body.status },
    });
    res.send(JSON.stringify(order));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send(JSON.stringify({ error: "Validation failed", details: error.issues }));
      return;
    }
    console.error(error);
    res.status(500).send(JSON.stringify({ error: "Failed to update order" }));
  }
}
