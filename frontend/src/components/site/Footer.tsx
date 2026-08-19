/**
 * Site footer -- copyright + social icons.
 *
 * Only shows social icons whose URLs are set on the SiteSettings so an empty
 * settings record still produces a clean footer.
 */

import { Github, Linkedin, Twitter } from "lucide-react";

import type { SiteChrome } from "@/lib/site-chrome";

const currentYear = new Date().getFullYear();

export function Footer({ chrome }: { chrome: SiteChrome }) {
  const s = chrome.settings;
  const copy = s?.footer_text?.trim() || `© ${currentYear} All rights reserved.`;

  const socials = [
    s?.github_url ? { key: "github", href: s.github_url, Icon: Github, label: "GitHub" } : null,
    s?.linkedin_url
      ? { key: "linkedin", href: s.linkedin_url, Icon: Linkedin, label: "LinkedIn" }
      : null,
    s?.twitter_url
      ? { key: "twitter", href: s.twitter_url, Icon: Twitter, label: "Twitter" }
      : null,
  ].filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container flex h-16 items-center justify-between text-sm text-muted-foreground">
        <p>{copy}</p>
        {socials.length > 0 && (
          <ul className="flex items-center gap-5">
            {socials.map(({ key, href, Icon, label }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-muted-foreground transition-colors hover:text-emerald-600"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
