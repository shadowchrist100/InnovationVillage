import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InvestorForm from "@/components/InvestorForm";
import { registerInvestor } from "@/app/actions/auth";
import { getUser } from "@/lib/session";
import { safeNext } from "@/lib/redirect";

export const metadata: Metadata = { title: "Inscription investisseur" };

export default async function Page({ searchParams }: PageProps<"/inscription/investisseur">) {
  const raw = (await searchParams).next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw, "");
  if (await getUser()) redirect(next || "/espace");
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="label mb-4 text-signal/80">Investisseurs</p>
      <h1 className="mb-3 display text-[clamp(2rem,5vw,3rem)]">
        M’inscrire comme investisseur
      </h1>
      <p className="mb-12 text-ink-muted">
        Présentez-vous : qui vous êtes, d’où vous venez et où vous travaillez. Dès votre inscription, vous
        pourrez réserver des rencontres avec les startups.
      </p>
      <InvestorForm action={registerInvestor} mode="register" next={next || undefined} />
    </div>
  );
}
