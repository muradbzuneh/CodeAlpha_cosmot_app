import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { env } from "../env.js";
import { Resend } from "resend";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: env.BETTER_AUTH_URL || `http://localhost:${env.PORT || 5000}`,
  secret: env.BETTER_AUTH_SECRET || env.JWT_ACCESS_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }: { user: any; url: string }) {
      if (!resend) {
        console.log(`\n[Resend Not Configured] Reset password URL for ${user.email}:\n${url}\n`);
        return;
      }
      try {
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL || "Cosmot <onboarding@resend.dev>",
          to: user.email,
          subject: "Reset your Cosmot password",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
              <h2 style="font-style: italic; font-size: 28px; margin-bottom: 8px;">Cosmot.</h2>
              <p style="text-transform: uppercase; letter-spacing: 0.15em; font-size: 11px; color: #78716c; margin-bottom: 24px;">Security Notification</p>
              <p style="font-size: 15px; line-height: 1.6; color: #1c1917;">Hello ${user.name || "Customer"},</p>
              <p style="font-size: 15px; line-height: 1.6; color: #44403c;">We received a request to reset your Cosmot account password. Click the button below to set a new password:</p>
              <div style="margin: 32px 0;">
                <a href="${url}" style="background-color: #1c1917; color: #ffffff; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Reset Password</a>
              </div>
              <p style="font-size: 13px; color: #78716c; line-height: 1.5;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #a8a29e; word-break: break-all;">${url}</p>
              <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;" />
              <p style="font-size: 12px; color: #a8a29e;">If you did not request this change, you can safely ignore this email.</p>
            </div>
          `,
        });
        console.log(`[Resend] Sent password reset email to ${user.email}`);
      } catch (err) {
        console.error("[Resend Error] Failed to send password reset email:", err);
      }
    },
    async sendVerificationEmail({ user, url }: { user: any; url: string }) {
      if (!resend) {
        console.log(`\n[Resend Not Configured] Email verification URL for ${user.email}:\n${url}\n`);
        return;
      }
      try {
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL || "Cosmot <onboarding@resend.dev>",
          to: user.email,
          subject: "Verify your Cosmot email address",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
              <h2 style="font-style: italic; font-size: 28px; margin-bottom: 8px;">Cosmot.</h2>
              <p style="text-transform: uppercase; letter-spacing: 0.15em; font-size: 11px; color: #78716c; margin-bottom: 24px;">Welcome</p>
              <p style="font-size: 15px; line-height: 1.6; color: #1c1917;">Hello ${user.name || "there"},</p>
              <p style="font-size: 15px; line-height: 1.6; color: #44403c;">Thank you for joining Cosmot. Please confirm your email address by clicking below:</p>
              <div style="margin: 32px 0;">
                <a href="${url}" style="background-color: #1c1917; color: #ffffff; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Verify Email</a>
              </div>
              <p style="font-size: 12px; color: #a8a29e; word-break: break-all;">${url}</p>
            </div>
          `,
        });
        console.log(`[Resend] Sent verification email to ${user.email}`);
      } catch (err) {
        console.error("[Resend Error] Failed to send verification email:", err);
      }
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CUSTOMER",
        input: false,
      },
    },
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5000",
    "http://localhost:3000",
    ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((s) => s.trim()) : []),
  ],
});

export default auth;
