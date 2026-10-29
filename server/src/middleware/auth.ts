import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { env } from "../env.js";
import { sendJson } from "../lib/response.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Try Better-Auth session verification (cookies or Authorization header)
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      req.user = {
        sub: session.user.id,
        email: session.user.email,
        role: ((session.user as any).role as "CUSTOMER" | "ADMIN") || "CUSTOMER",
      };
      return next();
    }

    // 2. Fallback to legacy JWT Bearer header verification
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const token = header.slice(7);
      try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
        req.user = payload;
        return next();
      } catch {
        // invalid legacy token
      }
    }

    sendJson(res, 401, { error: "Unauthorized: Missing or invalid session" });
  } catch (err) {
    console.error("Auth middleware error:", err);
    sendJson(res, 401, { error: "Invalid or expired session" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendJson(res, 403, { error: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
}
