import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../env.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signAccessToken(payload: { sub: string; email: string; role: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

function signRefreshToken(payload: { sub: string; email: string; role: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions["expiresIn"],
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, password: hashed, name: body.name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const tokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const tokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
