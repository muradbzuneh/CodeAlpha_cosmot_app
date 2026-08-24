import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../env.js";
import { authenticate } from "../middleware/auth.js";
import { sendJson } from "../lib/response.js";

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
      sendJson(res, 409, { error: "Email already registered" });
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

    sendJson(res, 201, { user, accessToken, refreshToken });
  } catch (err) {
    if (err instanceof z.ZodError) {
      sendJson(res, 400, { error: "Validation failed", details: err.issues });
      return;
    }
    console.error("REGISTER ERROR:", err);
    sendJson(res, 500, { error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      sendJson(res, 401, { error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      sendJson(res, 401, { error: "Invalid credentials" });
      return;
    }

    const tokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    sendJson(res, 200, {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      sendJson(res, 400, { error: "Validation failed", details: err.issues });
      return;
    }
    console.error("LOGIN ERROR:", err);
    sendJson(res, 500, { error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) {
      sendJson(res, 404, { error: "User not found" });
      return;
    }
    sendJson(res, 200, user);
  } catch (err) {
    console.error("ME ERROR:", err);
    sendJson(res, 500, { error: "Internal server error" });
  }
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
    if (!user) {
      sendJson(res, 404, { error: "User not found" });
      return;
    }

    if (body.email && body.email !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email: body.email } });
      if (exists) {
        sendJson(res, 409, { error: "Email already in use" });
        return;
      }
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;

    if (body.newPassword) {
      if (!body.currentPassword) {
        sendJson(res, 400, { error: "Current password is required to set a new password" });
        return;
      }
      const valid = await bcrypt.compare(body.currentPassword, user.password);
      if (!valid) {
        sendJson(res, 400, { error: "Current password is incorrect" });
        return;
      }
      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    sendJson(res, 200, updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      sendJson(res, 400, { error: "Validation failed", details: err.issues });
      return;
    }
    console.error("PROFILE ERROR:", err);
    sendJson(res, 500, { error: "Failed to update profile" });
  }
});

export default router;
