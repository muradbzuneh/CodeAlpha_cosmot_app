import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { sendJson } from "../lib/response.js";

export async function getStats(_req: Request, res: Response) {
  try {
    const [totalOrders, totalProducts, totalUsers, revenueResult, ordersByStatus, recentOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.product.count(),
        prisma.user.count(),
        prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
        prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { email: true, name: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of ordersByStatus) {
      statusMap[s.status] = s._count.id;
    }

    sendJson(res, 200, {
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: revenueResult._sum.total ?? 0,
      ordersByStatus: statusMap,
      recentOrders,
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Failed to fetch stats" });
  }
}
