"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Which page is currently active — controls which nav links are shown. */
export type LegalPage = "privacy" | "terms" | "contact";

interface LegalNavProps {
  activePage: LegalPage;
}

const LINKS: { page: LegalPage; href: string; label: string }[] = [
  { page: "privacy", href: "/privacy", label: "Privacy" },
  { page: "terms", href: "/terms", label: "Terms" },
  { page: "contact", href: "/contact", label: "Contact" },
];

export default function LegalNav({ activePage }: LegalNavProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo — mirrors homepage exactly */}
        <Link href="/" className="flex items-center gap-2">
          {mounted && (
            <Image
              src={resolvedTheme === "dark" ? "/icons/icon-text-light.png" : "/icons/icon-text.png"}
              alt="SolidSeed"
              width={148}
              height={60}
              priority
            />
          )}
        </Link>

        {/* Right-side links: show the other two pages + Back to Home */}
        <div className="flex items-center gap-4">
          {LINKS.filter((l) => l.page !== activePage).map((l) => (
            <Link
              key={l.page}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/"
            className="text-sm text-primary font-medium hover:underline transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
