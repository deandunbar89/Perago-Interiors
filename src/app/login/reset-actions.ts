"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";

const TOKEN_TTL_MINUTES = 60;
const APP_URL = (process.env.APP_URL || "https://perago-interiors-production.up.railway.app").replace(/\/$/, "");

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(
  _prev: { error?: string; sent?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email address." };
  if (!emailConfigured()) return { error: "Password reset emails aren't set up yet. Ask an admin to reset your password." };

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  });

  // Same answer whether or not the email exists, so the form can't be used to find accounts.
  if (user) {
    const recent = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent < 5) {
      const token = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000) },
      });
      const link = `${APP_URL}/login/reset?token=${token}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Perago password",
          html: `<p>Hi ${user.name.split(" ")[0]},</p>
<p>Someone (hopefully you) asked to reset your Perago password. Click the link below to choose a new one. It works once and expires in ${TOKEN_TTL_MINUTES} minutes.</p>
<p><a href="${link}">Reset my password</a></p>
<p>If you didn't ask for this, ignore this email. Your password stays the same.</p>
<p>Perago Interiors</p>`,
        });
      } catch (e) {
        console.error("Password reset email failed", e);
        return { error: "Couldn't send the email just now. Try again in a minute, or ask an admin." };
      }
    }
  }
  return { sent: true };
}

export async function resetPassword(
  _prev: { error?: string; done?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; done?: boolean }> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const record = token ? await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link has expired or already been used. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  return { done: true };
}
