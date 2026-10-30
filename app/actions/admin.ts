"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function setUserStatus(userId: string, status: "APPROVED" | "REJECTED" | "PENDING") {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/startups");
}
