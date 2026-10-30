"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { safeNext } from "@/lib/redirect";
import { createSession, destroySession } from "@/lib/session";
import { applyStartupFiles, deleteImages } from "@/lib/startup-files";
import {
  accountSchema,
  fieldErrors,
  investorSchema,
  rawValues,
  readTeam,
  startupSchema,
  teamSchema,
  type FormState,
} from "@/lib/validation";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function registerStartup(_: FormState, fd: FormData): Promise<FormState> {
  const account = accountSchema.safeParse({ email: str(fd, "email"), password: str(fd, "password") });
  const profile = startupSchema.safeParse({
    name: str(fd, "name"),
    sector: str(fd, "sector"),
    country: str(fd, "country"),
    website: str(fd, "website"),
    demoVideoUrl: str(fd, "demoVideoUrl"),
    whatTheyDo: str(fd, "whatTheyDo"),
    origin: str(fd, "origin"),
    goal: str(fd, "goal"),
    problem: str(fd, "problem"),
  });
  const members = readTeam(fd);
  const team = teamSchema.safeParse(members);
  const logoGiven = fd.get("logo") instanceof File && (fd.get("logo") as File).size > 0;

  const errors = {
    ...(logoGiven ? {} : { logo: "Ajoutez le logo de votre startup." }),
    ...(account.success ? {} : fieldErrors(account.error)),
    ...(profile.success ? {} : fieldErrors(profile.error)),
    ...(team.success ? {} : { team: team.error.issues[0].message }),
  };
  if (!account.success || !profile.success || !team.success || !logoGiven) {
    return { error: "Certains champs sont à corriger.", fieldErrors: errors, values: rawValues(fd) };
  }

  if (await db.user.findUnique({ where: { email: account.data.email } })) {
    return { error: "Un compte existe déjà avec cette adresse e-mail.", fieldErrors: { email: "Adresse déjà utilisée" }, values: rawValues(fd) };
  }

  const files = await applyStartupFiles(fd, members, null);
  if (!files.ok) {
    return { error: "Certains champs sont à corriger.", fieldErrors: files.fieldErrors, values: rawValues(fd) };
  }

  let user;
  try {
    user = await db.user.create({
      data: {
        email: account.data.email,
        passwordHash: await bcrypt.hash(account.data.password, 12),
        role: "STARTUP",
        status: "APPROVED", // actif dès l'inscription (pas de validation préalable)
        startup: { create: { ...profile.data, logo: files.logo, team: JSON.stringify(files.team) } },
      },
    });
  } catch (e) {
    await deleteImages(files.created);
    throw e;
  }
  await createSession(user.id);
  redirect("/espace");
}

export async function registerInvestor(_: FormState, fd: FormData): Promise<FormState> {
  const account = accountSchema.safeParse({ email: str(fd, "email"), password: str(fd, "password") });
  const profile = investorSchema.safeParse({
    fullName: str(fd, "fullName"),
    organization: str(fd, "organization"),
    position: str(fd, "position"),
    country: str(fd, "country"),
    city: str(fd, "city"),
    bio: str(fd, "bio"),
    sectors: fd.getAll("sectors").map(String),
    website: str(fd, "website"),
  });

  if (!account.success || !profile.success) {
    return {
      error: "Certains champs sont à corriger.",
      values: rawValues(fd),
      fieldErrors: {
        ...(account.success ? {} : fieldErrors(account.error)),
        ...(profile.success ? {} : fieldErrors(profile.error)),
      },
    };
  }

  if (await db.user.findUnique({ where: { email: account.data.email } })) {
    return { error: "Un compte existe déjà avec cette adresse e-mail.", fieldErrors: { email: "Adresse déjà utilisée" }, values: rawValues(fd) };
  }

  const user = await db.user.create({
    data: {
      email: account.data.email,
      passwordHash: await bcrypt.hash(account.data.password, 12),
      role: "INVESTOR",
      status: "APPROVED", // actif dès l'inscription (pas de validation préalable)
      investor: { create: { ...profile.data, sectors: profile.data.sectors.join(",") } },
    },
  });
  await createSession(user.id);
  redirect(safeNext(str(fd, "next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").trim().toLowerCase();
  const password = str(fd, "password");
  const user = await db.user.findUnique({ where: { email } });
  // Même message dans les deux cas pour ne pas révéler quelles adresses existent.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : safeNext(str(fd, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
