import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as any);
}

function signRefreshToken(payload: { sub: string; email: string; role: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  } as any);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      res.status(409).send(JSON.stringify({ error: "Email already registered" }));
      return;
    }

    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, password: hashed, name: body.name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const tokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.status(201).send(JSON.stringify({ user, accessToken, refreshToken }));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).send(JSON.stringify({ error: "Validation failed", details: err.issues }));
      return;
    }
    console.error("REGISTER ERROR:", err);
    res.status(500).send(JSON.stringify({ error: "Internal server error" }));
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      res.status(401);
      res.json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      res.status(401);
      res.json({ error: "Invalid credentials" });
      return;
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
      res.status(400);
      res.json({ error: "Validation failed", details: err.issues });
      return;
    }
    console.error("LOGIN ERROR:", err);
    res.status(500);
    res.json({ error: "Internal server error" });
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

// PUT /api/auth/profile
const profileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

router.put("/profile", authenticate, async (req, res) => {
  try {
    const body = profileSchema.parse(req.body);
    const userId = req.user!.sub;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (body.email && body.email !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email: body.email } });
      if (exists) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;

    if (body.newPassword) {
      if (!body.currentPassword) {
        return res.status(400).json({ error: "Current password is required to set a new password" });
      }
      const valid = await bcrypt.compare(body.currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
