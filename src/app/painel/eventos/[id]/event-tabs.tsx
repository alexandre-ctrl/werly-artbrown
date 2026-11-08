"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EventTabs({ tabs }: { tabs: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              active ? "border-gold text-gold-700" : "border-transparent text-muted hover:text-gold-700"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
