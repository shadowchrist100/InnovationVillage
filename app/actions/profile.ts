"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { applyStartupFiles, deleteImages } from "@/lib/startup-files";
import {
  fieldErrors,
  investorSchema,
  rawValues,
  readTeam,
  startupSchema,
  teamSchema,
  type FormState,
} from "@/lib/validation";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function updateStartup(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "STARTUP" || !user.startup) return { error: "Action non autorisée." };

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
  if (!profile.success || !team.success) {
    return {
      error: "Certains champs sont à corriger.",
      values: rawValues(fd),
      fieldErrors: {
        ...(profile.success ? {} : fieldErrors(profile.error)),
        ...(team.success ? {} : { team: team.error.issues[0].message }),
      },
    };
  }

  const files = await applyStartupFiles(fd, members, {
    logo: user.startup.logo,
    team: JSON.parse(user.startup.team),
  });
  if (!files.ok) {
    return { error: "Certains champs sont à corriger.", fieldErrors: files.fieldErrors, values: rawValues(fd) };
  }

  try {
    await db.startup.update({
      where: { id: user.startup.id },
      data: { ...profile.data, logo: files.logo, team: JSON.stringify(files.team) },
    });
  } catch (e) {
    await deleteImages(files.created);
    throw e;
  }
  await deleteImages(files.obsolete);
  revalidatePath("/espace");
  revalidatePath("/startups");
  revalidatePath(`/startups/${user.startup.id}`);
  return { ok: true };
}

export async function updateInvestor(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "INVESTOR" || !user.investor) return { error: "Action non autorisée." };

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
  if (!profile.success) {
    return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(profile.error), values: rawValues(fd) };
  }

  await db.investor.update({
    where: { id: user.investor.id },
    data: { ...profile.data, sectors: profile.data.sectors.join(",") },
  });
  revalidatePath("/espace");
  return { ok: true };
}
