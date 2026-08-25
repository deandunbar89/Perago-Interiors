"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
}

export async function createUser(_prevState: unknown, formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) === "ADMIN" ? "ADMIN" : "MEMBER";

  if (!name || !email || !password) return { error: "All fields are required" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with that email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role } });

  revalidatePath("/team");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  if (session.user.id === userId) {
    throw new Error("You cannot remove your own account");
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/team");
}
