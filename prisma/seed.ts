// Crée (ou met à jour) le compte administrateur à partir de ADMIN_EMAIL / ADMIN_PASSWORD (.env).
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env");

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", status: "APPROVED" },
    create: { email, passwordHash, role: "ADMIN", status: "APPROVED" },
  });
  console.log(`Administrateur prêt : ${email}`);
}

main().finally(() => db.$disconnect());
