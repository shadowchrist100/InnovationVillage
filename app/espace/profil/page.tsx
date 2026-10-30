import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import StartupForm from "@/components/StartupForm";
import InvestorForm from "@/components/InvestorForm";
import { updateInvestor, updateStartup } from "@/app/actions/profile";

export const metadata: Metadata = { title: "Modifier mon profil" };

export default async function Page() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/espace" className="btn-ghost -ml-3 mb-6 h-9 px-3">
        ← Mon espace
      </Link>
      <h1 className="mb-12 display text-[clamp(2rem,5vw,3rem)]">Modifier mon profil</h1>
      {user.role === "STARTUP" && user.startup ? (
        <StartupForm
          mode="edit"
          action={updateStartup}
          initial={{ ...user.startup, team: JSON.parse(user.startup.team) }}
        />
      ) : user.investor ? (
        <InvestorForm
          mode="edit"
          action={updateInvestor}
          initial={{ ...user.investor, sectors: user.investor.sectors.split(",").filter(Boolean) }}
        />
      ) : null}
    </div>
  );
}
