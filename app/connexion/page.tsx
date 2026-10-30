import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Rocket } from "@/components/icons";
import LoginForm from "@/components/LoginForm";
import { getUser } from "@/lib/session";
import { safeNext } from "@/lib/redirect";

export const metadata: Metadata = { title: "Connexion" };

export default async function Page({ searchParams }: PageProps<"/connexion">) {
  const raw = (await searchParams).next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw, "");
  if (await getUser()) redirect(next || "/espace");
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex flex-col gap-3">
        <p className="label text-[0.6875rem] text-ink-faint">Pas encore de compte ? Inscrivez-vous</p>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/inscription/startup" className="btn-primary h-12">
            <Rocket width={18} height={18} />
            Startup
          </Link>
          <Link href={next ? `/inscription/investisseur?next=${encodeURIComponent(next)}` : "/inscription/investisseur"} className="btn-primary h-12">
            <Briefcase width={18} height={18} />
            Investisseur
          </Link>
        </div>
      </div>
      <h1 className="display text-[clamp(2rem,5vw,3rem)]">Connexion</h1>
      <LoginForm next={next || undefined} />
    </div>
  );
}
