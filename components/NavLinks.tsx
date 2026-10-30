"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil", exact: true, desktopOnly: true },
  { href: "/startups", label: "Startups", exact: false, desktopOnly: false },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`btn h-10 px-3 ${l.desktopOnly ? "max-md:hidden" : ""} ${
              active ? "bg-surface-2 text-signal" : "text-ink-muted hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
