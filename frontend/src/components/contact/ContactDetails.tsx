/**
 * ContactDetails - right-hand column on the contact page.
 *
 * Plain, borderless layout matching the design:
 *   Contact details
 *   <editable intro paragraph>
 *   <emerald mail icon>  <bold email>
 *
 *   Elsewhere
 *   <icon>  github.com/handle
 *   <icon>  linkedin.com/in/handle
 *   ...
 *
 * The socials list is derived from the same `SiteSettings` used by the
 * footer so there's a single source of truth.
 */

import { Facebook, Github, Linkedin, Mail, Twitter } from "lucide-react";

import type { SiteChrome } from "@/lib/site-chrome";

type Props = {
  email?: string;
  intro?: string;
  chrome: SiteChrome;
};

/** Strip protocol + trailing slash so the URL reads as plain text. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

export function ContactDetails({ email, intro, chrome }: Props) {
  const s = chrome.settings;

  const socials = [
    s?.github_url ? { key: "github", href: s.github_url, Icon: Github, label: "GitHub" } : null,
    s?.facebook_url ? { key: "facebook", href: s.facebook_url, Icon: Facebook, label: "Facebook" } : null,
    s?.linkedin_url
      ? { key: "linkedin", href: s.linkedin_url, Icon: Linkedin, label: "LinkedIn" }
      : null,
    s?.twitter_url
      ? { key: "twitter", href: s.twitter_url, Icon: Twitter, label: "Twitter" }
      : null,
  ].filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <aside className="space-y-10">
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Contact details
        </h2>
        {intro && (
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-neutral-500">
            {intro}
          </p>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="mt-6 inline-flex items-center gap-3 text-base font-semibold text-neutral-900 transition-colors hover:text-emerald-600"
          >
            <Mail className="h-5 w-5 text-emerald-600" aria-hidden />
            {email}
          </a>
        )}
      </section>

      {socials.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Elsewhere
          </h2>
          <ul className="mt-4 space-y-3 text-base">
            {socials.map(({ key, href, Icon, label }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex items-center gap-3 text-neutral-500 transition-colors hover:text-emerald-600"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {displayUrl(href)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
