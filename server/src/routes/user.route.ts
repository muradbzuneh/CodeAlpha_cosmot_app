import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { sendJson } from "../lib/response.js";

const router = Router();

// GET /api/user/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, name: true, role: true, image: true, emailVerified: true, createdAt: true },
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

// PUT /api/user/profile
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });
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

      // Check current password from Account or User
      const credentialAccount = user.accounts.find((a) => a.providerId === "credential");
      let valid = false;

      if (credentialAccount?.password) {
        valid = await bcrypt.compare(body.currentPassword, credentialAccount.password);
      } else if (user.password) {
        valid = await bcrypt.compare(body.currentPassword, user.password);
      }

      if (!valid) {
        sendJson(res, 400, { error: "Current password is incorrect" });
        return;
      }

      const hashedPassword = await bcrypt.hash(body.newPassword, 10);
      updateData.password = hashedPassword;

      // Update password in credential account if exists
      if (credentialAccount) {
        await prisma.account.update({
          where: { id: credentialAccount.id },
          data: { password: hashedPassword },
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, image: true, emailVerified: true, createdAt: true },
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
