/**
 * Site header -- logo + main nav.
 *
 * The logo split ("astro" / ".dev") is derived from the site tagline field;
 * everything after (and including) the first dot renders in the accent
 * colour. Fallback = the env-provided site name.
 */

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { MenuLinkItem, SiteChrome } from "@/lib/site-chrome";

type Props = {
  chrome: SiteChrome;
  currentPath?: string;
};

export function Header({ chrome, currentPath = "/" }: Props) {
  const brand = brandFromTagline(chrome.settings?.tagline);
  const items = chrome.main_menu.items;

  return (
    <header className="border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span>{brand.head}</span>
          <span className="text-emerald-600">{brand.tail}</span>
        </Link>

        <nav aria-label="Main">
          <ul className="flex items-center gap-8 text-sm font-medium">
            {items.map((item) => (
              <NavItem key={item.id} item={item} active={isActive(item, currentPath)} />
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function NavItem({ item, active }: { item: MenuLinkItem; active: boolean }) {
  const target = item.url ?? "#";
  const external = /^https?:\/\//.test(target) || item.open_in_new_tab;
  return (
    <li>
      <Link
        href={target}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={cn(
          "relative py-1 transition-colors hover:text-emerald-600",
          active ? "text-emerald-600" : "text-foreground/80",
        )}
      >
        {item.label}
        {active && (
          <span
            aria-hidden
            className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-emerald-600"
          />
        )}
      </Link>
    </li>
  );
}

function isActive(item: MenuLinkItem, currentPath: string): boolean {
  if (!item.url) return false;
  const path = item.url.replace(/^https?:\/\/[^/]+/, "") || "/";
  if (path === "/") return currentPath === "/";
  return currentPath === path || currentPath.startsWith(`${path}/`);
}

function brandFromTagline(tagline?: string): { head: string; tail: string } {
  const raw = (tagline || process.env.NEXT_PUBLIC_SITE_NAME || "astro.dev").trim();
  const idx = raw.indexOf(".");
  if (idx < 0) return { head: raw, tail: "" };
  return { head: raw.slice(0, idx), tail: raw.slice(idx) };
}
