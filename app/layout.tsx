import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin", "latin-ext"] });
const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin", "latin-ext"] });

const title = "Le Village de l’Innovation · Startups & investisseurs";
const description =
  "Startups et investisseurs : inscrivez-vous et planifiez vos rencontres au Village de l’Innovation, Cotonou, pendant la Benin Digital & Innovation Week.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: title, template: "%s · Le Village de l’Innovation" },
  description,
  openGraph: {
    title,
    description,
    siteName: "Le Village de l’Innovation",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Le Village de l’Innovation" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#061430" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-signal focus:px-4 focus:py-2 focus:text-night"
        >
          Aller au contenu
        </a>
        <Header />
        <BackButton />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
