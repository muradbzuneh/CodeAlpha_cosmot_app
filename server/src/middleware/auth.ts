import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    sendJson(res, 401, { error: "Missing or invalid token" });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    sendJson(res, 401, { error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }
    next();
  };
}
