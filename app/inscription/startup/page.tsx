import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StartupForm from "@/components/StartupForm";
import { registerStartup } from "@/app/actions/auth";
import { getUser } from "@/lib/session";

export const metadata: Metadata = { title: "Inscription startup" };

export default async function Page() {
  if (await getUser()) redirect("/espace");
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="label mb-4 text-signal/80">Startups</p>
      <h1 className="mb-3 display text-[clamp(2rem,5vw,3rem)]">
        Inscrire ma startup
      </h1>
      <p className="mb-12 text-ink-muted">
        Votre profil sera visible dans l’annuaire dès votre inscription.
      </p>
      <StartupForm action={registerStartup} mode="register" />
    </div>
  );
}
