import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

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
    res.status(401).send(JSON.stringify({ error: "Missing or invalid token" }));
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).send(JSON.stringify({ error: "Invalid or expired token" }));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).send(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    next();
  };
}
