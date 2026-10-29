import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendJson } from "../lib/response.js";
import { chapa } from "../lib/chapa.js";
import { sendOrderConfirmationEmail } from "../lib/email.js";
import { env } from "../env.js";

const VALID_PROMOS: Record<string, number> = {
  COSMOT10: 0.1,
  GLOW20: 0.2,
};

const createOrderSchema = z.object({
  address: z.string().min(1),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  customerName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  paymentMethod: z.string().default("chapa"),
  shipping: z.enum(["standard", "express"]).default("standard"),
  promoCode: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        variantTitle: z.string().optional(),
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
    const userId = req.user!.sub;

    const productIds = body.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      sendJson(res, 400, { error: "One or more selected products are no longer available." });
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate inventory
    for (const item of body.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        sendJson(res, 400, {
          error: `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`,
        });
        return;
      }
    }

    // 1. Calculate pricing server-side
    const subtotal = body.items.reduce((sum, item) => {
      return sum + productMap.get(item.productId)!.price * item.quantity;
    }, 0);

    const cleanPromo = body.promoCode?.trim().toUpperCase() || null;
    const discountRate = cleanPromo && VALID_PROMOS[cleanPromo] ? VALID_PROMOS[cleanPromo] : 0;
    const discount = +(subtotal * discountRate).toFixed(2);
    const taxable = subtotal - discount;
    const vat = +(taxable * 0.15).toFixed(2);
    const freeShipping = subtotal >= 4500;
    const shippingFee = body.shipping === "express" ? 850 : freeShipping ? 0 : 450;
    const grandTotal = +(taxable + vat + shippingFee).toFixed(2);

    const isCod = body.paymentMethod === "cod";
    // Max 20 characters for Chapa Global compatibility: e.g. "c_mvthxba7_8hy3" (15 chars)
    const txRef = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);

    // 2. Atomic Transaction: Concurrency-Safe Inventory Reservation & Order Creation
    const order = await prisma.$transaction(async (tx) => {
      // Row-level lock & conditional stock verification
      for (const item of body.items) {
        // Atomic product decrement (acquires PostgreSQL row write lock)
        const updatedProd = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updatedProd.count === 0) {
          const p = productMap.get(item.productId);
          throw new Error(
            `Insufficient stock for "${p?.name || "product"}". The item may have just sold out.`
          );
        }

        // Atomic variant decrement (if variant selected)
        if (item.variantId) {
          const updatedVar = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              productId: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (updatedVar.count === 0) {
            throw new Error(
              `The selected format/size for "${productMap.get(item.productId)?.name}" is no longer available in this quantity.`
            );
          }
        }
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          status: isCod ? "PROCESSING" : "PENDING",
          paymentStatus: isCod ? "PENDING_ON_DELIVERY" : "UNPAID",
          total: grandTotal,
          subtotal,
          discount,
          vat,
          shippingFee,
          promoCode: cleanPromo,
          txRef,
          address: body.address,
          city: body.city ?? null,
          postalCode: body.postalCode ?? null,
          customerName: body.customerName ?? req.user?.email?.split("@")[0] ?? "Customer",
          email: body.email ?? req.user?.email,
          phone: body.phone ?? null,
          paymentMethod: body.paymentMethod,
          shipping: body.shipping,
          items: {
            create: body.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              variantTitle: item.variantTitle || null,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: { items: { include: { product: true, variant: true } } },
      });

      return newOrder;
    });

    // 3. If Cash on Delivery, send confirmation email immediately
    if (isCod) {
      if (order.email) {
        sendOrderConfirmationEmail({
          orderId: order.id,
          customerName: order.customerName || "Customer",
          email: order.email,
          total: order.total,
          subtotal: order.subtotal,
          discount: order.discount,
          vat: order.vat,
          shippingFee: order.shippingFee,
          address: order.address || "",
          city: order.city || "",
          paymentMethod: "Cash On Delivery (COD)",
          items: order.items.map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.price,
          })),
        }).catch((err) => console.error("Email send error:", err));
      }
      sendJson(res, 201, { order, checkoutUrl: null });
      return;
    }

    // 4. Initialize Chapa payment session for Telebirr / Card / Chapa
    const origin = req.headers.origin || req.headers.referer || "";
    const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1") || env.NODE_ENV !== "production";

    const [firstName, ...restName] = (order.customerName || "Customer").split(" ");
    const lastName = restName.join(" ") || "Cosmot";

    try {
      const chapaSession = await chapa.initialize({
        amount: order.total,
        currency: "ETB",
        email: order.email || req.user!.email,
        firstName,
        lastName,
        phoneNumber: order.phone || "",
        txRef,
        returnUrl: `https://code-alpha-cosmot-app-back.vercel.app/api/orders/return?tx_ref=${txRef}&env=${isLocal ? "local" : "prod"}`,
        callbackUrl: `https://code-alpha-cosmot-app-back.vercel.app/api/orders/webhook`,
        title: "Cosmot Skincare",
        description: `Payment for Order #${order.id.slice(0, 8)}`,
      });

      sendJson(res, 201, {
        order,
        checkoutUrl: chapaSession.checkoutUrl,
        txRef,
      });
    } catch (paymentErr: any) {
      console.error("Chapa payment initialization failed:", paymentErr.message);

      // Clean up the order and restore stock if Chapa failed
      await prisma.$transaction(async (tx) => {
        await tx.order.delete({ where: { id: order.id } });
        for (const item of body.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      });

      sendJson(res, 400, {
        error: `Payment Gateway Error: ${paymentErr.message || "Failed to initialize payment with Chapa."}`,
      });
      return;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "Validation failed", details: error.issues });
      return;
    }
    console.error("Order creation error:", error);
    sendJson(res, 500, { error: "Failed to create order" });
  }
}

// GET /api/orders/verify/:txRef - verifies transaction with Chapa
export async function verifyOrderPayment(req: Request, res: Response) {
  try {
    const txRef = String(req.params.txRef);
    const order = await prisma.order.findUnique({
      where: { txRef },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }

    // If already marked as paid, return early
    if (order.paymentStatus === "PAID") {
      sendJson(res, 200, { verified: true, order });
      return;
    }

    // Verify with Chapa API
    const verifyResult = await chapa.verify(txRef);
    const isSuccess =
      verifyResult.status === "success" &&
      verifyResult.data?.status?.toLowerCase() === "success";

    if (isSuccess) {
      const paymentRef =
        verifyResult.data?.chapa_reference ||
        verifyResult.data?.processor_reference ||
        verifyResult.data?.reference ||
        null;

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
          paymentReference: paymentRef,
        },
        include: { items: { include: { product: true } } },
      });

      // Send confirmation email
      if (updatedOrder.email) {
        sendOrderConfirmationEmail({
          orderId: updatedOrder.id,
          customerName: updatedOrder.customerName || "Customer",
          email: updatedOrder.email,
          total: updatedOrder.total,
          subtotal: updatedOrder.subtotal,
          discount: updatedOrder.discount,
          vat: updatedOrder.vat,
          shippingFee: updatedOrder.shippingFee,
          address: updatedOrder.address || "",
          city: updatedOrder.city || "",
          paymentMethod: updatedOrder.paymentMethod || "Chapa",
          items: updatedOrder.items.map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.price,
          })),
        }).catch((err) => console.error("Email send error:", err));
      }

      sendJson(res, 200, { verified: true, order: updatedOrder });
    } else {
      sendJson(res, 400, {
        verified: false,
        message: verifyResult.message || "Payment not completed or failed",
        order,
      });
    }
  } catch (error: any) {
    console.error("Order payment verification error:", error);
    sendJson(res, 500, { error: error.message || "Failed to verify payment" });
  }
}

// POST /api/orders/webhook - Chapa Webhook receiver
export async function chapaWebhook(req: Request, res: Response) {
  try {
    const body = req.body;
    const txRef =
      body?.tx_ref ||
      body?.trx_ref ||
      body?.merchant_reference ||
      body?.reference;

    if (!txRef) {
      sendJson(res, 400, { error: "Missing transaction reference" });
      return;
    }

    // Double check with Chapa API for safety against forged webhook events
    const verifyResult = await chapa.verify(txRef);
    const isSuccess =
      verifyResult.status === "success" &&
      verifyResult.data?.status?.toLowerCase() === "success";

    if (isSuccess) {
      const order = await prisma.order.findUnique({
        where: { txRef },
        include: { items: { include: { product: true } } },
      });

      if (order && order.paymentStatus !== "PAID") {
        const paymentRef =
          verifyResult.data?.chapa_reference ||
          verifyResult.data?.processor_reference ||
          verifyResult.data?.reference ||
          null;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
            paymentReference: paymentRef,
          },
        });

        if (order.email) {
          sendOrderConfirmationEmail({
            orderId: order.id,
            customerName: order.customerName || "Customer",
            email: order.email,
            total: order.total,
            subtotal: order.subtotal,
            discount: order.discount,
            vat: order.vat,
            shippingFee: order.shippingFee,
            address: order.address || "",
            city: order.city || "",
            paymentMethod: order.paymentMethod || "Chapa",
            items: order.items.map((i) => ({
              name: i.product.name,
              quantity: i.quantity,
              price: i.price,
            })),
          }).catch((err) => console.error("Email send error:", err));
        }
      }
    }

    sendJson(res, 200, { status: "received" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    sendJson(res, 500, { error: "Webhook processing error" });
  }
}

// GET /api/orders/return - Chapa redirect destination after customer completes payment
export async function returnOrder(req: Request, res: Response) {
  try {
    const txRef = String(req.query.tx_ref || req.query.trx_ref || req.query.reference || "");
    const envParam = String(req.query.env || "");
    const isLocal = envParam === "local" || req.headers.host?.includes("localhost");

    if (txRef) {
      try {
        const verifyResult = await chapa.verify(txRef);
        const isSuccess =
          verifyResult.status === "success" &&
          verifyResult.data?.status?.toLowerCase() === "success";

        if (isSuccess) {
          const paymentRef =
            verifyResult.data?.chapa_reference ||
            verifyResult.data?.processor_reference ||
            verifyResult.data?.reference ||
            null;

          const updated = await prisma.order.update({
            where: { txRef },
            data: {
              paymentStatus: "PAID",
              status: "PROCESSING",
              paymentReference: paymentRef,
            },
            include: { items: { include: { product: true } } },
          });

          if (updated.email) {
            sendOrderConfirmationEmail({
              orderId: updated.id,
              customerName: updated.customerName || "Customer",
              email: updated.email,
              total: updated.total,
              subtotal: updated.subtotal,
              discount: updated.discount,
              vat: updated.vat,
              shippingFee: updated.shippingFee,
              address: updated.address || "",
              city: updated.city || "",
              paymentMethod: updated.paymentMethod || "Chapa",
              items: updated.items.map((i) => ({
                name: i.product.name,
                quantity: i.quantity,
                price: i.price,
              })),
            }).catch((err) => console.error("Email send error on return:", err));
          }
        }
      } catch (err) {
        console.error("Order verify on return error:", err);
      }
    }

    const targetUrl = isLocal
      ? `http://localhost:5173/orders?payment=success&tx_ref=${encodeURIComponent(txRef)}`
      : `https://code-alpha-cosmot-app.vercel.app/orders?payment=success&tx_ref=${encodeURIComponent(txRef)}`;

    res.redirect(targetUrl);
  } catch (error) {
    console.error("Return order error:", error);
    res.redirect("http://localhost:5173/orders");
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
    sendJson(res, 200, orders);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Failed to fetch orders" });
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

    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }

    if (req.user!.role !== "ADMIN" && order.userId !== req.user!.sub) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }

    sendJson(res, 200, order);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Failed to fetch order" });
  }
}

// PATCH /api/orders/:id/status (with inventory restock on cancellation)
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const body = updateStatusSchema.parse(req.body);

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }

    // If order transitions to CANCELLED and was not previously cancelled, RESTORE STOCK!
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: body.status },
      });

      if (body.status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return updated;
    });

    sendJson(res, 200, order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "Validation failed", details: error.issues });
      return;
    }
    console.error(error);
    sendJson(res, 500, { error: "Failed to update order" });
  }
}
