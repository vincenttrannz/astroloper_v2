/**
 * Site chrome = global data every page needs (branding, main menu, footer menu).
 *
 * The RootLayout fetches this once per request and passes the result down to
 * `<Header>` and `<Footer>`. Uses ISR (revalidate 60s) so authors' menu edits
 * propagate quickly without hammering the backend.
 */

import { wagtailBaseUrl, type WagtailImage } from "@/lib/wagtail";

export type SiteSettingsPayload = {
  tagline: string;
  footer_text: string;
  logo: WagtailImage | null;
  favicon: WagtailImage | null;
  twitter_url: string;
  github_url: string;
  linkedin_url: string;
};

export type MenuLinkItem = {
  id: string;
  label: string;
  url: string | null;
  open_in_new_tab: boolean;
};

export type SiteChrome = {
  settings: SiteSettingsPayload | null;
  main_menu: { items: MenuLinkItem[] };
  footer_menu: { items: MenuLinkItem[] };
};

const EMPTY: SiteChrome = {
  settings: null,
  main_menu: { items: [] },
  footer_menu: { items: [] },
};

export async function getSiteChrome(): Promise<SiteChrome> {
  const url = `${wagtailBaseUrl()}/api/v2/site-chrome/`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: ["wagtail", "site-chrome"] },
    });
    if (!res.ok) return EMPTY;
    return (await res.json()) as SiteChrome;
  } catch {
    // Never let missing chrome crash the layout; render with sensible defaults.
    return EMPTY;
  }
}
