"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { destroySession, requireAdmin, requireUser } from "@/lib/session";
import { deleteImages } from "@/lib/startup-files";
import type { FormState } from "@/lib/validation";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

async function removeUser(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, include: { startup: true } });
  if (!user || user.role === "ADMIN") return false;
  const files: string[] = [];
  if (user.startup) {
    if (user.startup.logo) files.push(user.startup.logo);
    for (const m of JSON.parse(user.startup.team) as { photo?: string }[]) if (m.photo) files.push(m.photo);
  }
  await db.user.delete({ where: { id: userId } }); // les profils et rencontres partent en cascade
  await deleteImages(files);
  revalidatePath("/startups");
  revalidatePath("/admin");
  return true;
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = str(fd, "current");
  const next = str(fd, "next");
  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { error: "Le mot de passe actuel est incorrect.", fieldErrors: { current: "Mot de passe incorrect" } };
  }
  if (next.length < 8 || next.length > 100) {
    return { error: "Certains champs sont à corriger.", fieldErrors: { next: "Mot de passe : 8 caractères minimum" } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true };
}

export async function deleteMyAccount(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role === "ADMIN") return { error: "Le compte administrateur ne peut pas être supprimé ici." };
  if (!(await bcrypt.compare(str(fd, "password"), user.passwordHash))) {
    return { error: "Mot de passe incorrect : le compte n'a pas été supprimé." };
  }
  await removeUser(user.id);
  await destroySession();
  redirect("/?compte=supprime");
}

export async function adminDeleteUser(userId: string): Promise<FormState> {
  await requireAdmin();
  return (await removeUser(userId)) ? { ok: true } : { error: "Suppression impossible." };
}

/** Génère un mot de passe temporaire (affiché une seule fois à l'administrateur). */
export async function adminResetPassword(userId: string): Promise<FormState & { password?: string }> {
  await requireAdmin();
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "ADMIN") return { error: "Réinitialisation impossible." };
  const password = randomBytes(6).toString("base64url");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  return { ok: true, password };
}
