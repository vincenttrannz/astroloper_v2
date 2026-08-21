/**
 * Router that maps a Wagtail page's `meta.type` to a React component.
 *
 * To wire up a new page type:
 *   1. Add a component file under this folder (e.g. `AboutPage.tsx`).
 *   2. Register it in the `registry` below, keyed by the backend `app_label.ModelName`.
 *
 * `renderPage()` dispatches on `page.meta.type` and falls back to `UnknownPage`.
 */

import type { WagtailPage } from "@/lib/wagtail";

import { BlogIndexPage } from "./BlogIndexPage";
import { BlogPage } from "./BlogPage";
import { ContactPage } from "./ContactPage";
import { HomePage } from "./HomePage";
import { ProjectIndexPage } from "./ProjectIndexPage";
import { ProjectPage } from "./ProjectPage";
import { UnknownPage } from "./UnknownPage";

const registry: Record<string, React.FC<{ page: WagtailPage }>> = {
  "models.HomePage": HomePage,
  "models.BlogIndexPage": BlogIndexPage,
  "models.BlogPage": BlogPage,
  "models.ProjectIndexPage": ProjectIndexPage,
  "models.ProjectPage": ProjectPage,
  "models.ContactPage": ContactPage,
};

export function renderPage(page: WagtailPage) {
  const Component = registry[page.meta.type] ?? UnknownPage;
  return <Component page={page} />;
}
