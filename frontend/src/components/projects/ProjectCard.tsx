/**
 * ProjectCard - the shared card used by:
 *
 *  - the homepage "Featured Projects" strip (backend `featured_projects` field
 *    on HomePage, shaped by `_project_card_payload()`)
 *  - the Projects listing page (from `listPages()` — see `pageToProjectCard()`)
 *  - the "Other Projects" strip on a Project detail page
 *
 * All three feed a common `ProjectCardData` shape, and `pageToProjectCard()`
 * converts a bare `WagtailPage` into it when needed.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { WagtailPicture } from "@/components/media/WagtailPicture";
import type { WagtailImage, WagtailPage } from "@/lib/wagtail";

export type ProjectCardData = {
  id: number;
  title: string;
  slug: string;
  url: string;
  description: string;
  image: WagtailImage | null;
  tech_stack: string[];
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow hover:shadow-md">
      {project.image && (
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          <WagtailPicture
            image={project.image}
            alt={project.title}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            base="card"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold tracking-tight">{project.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

        {project.tech_stack?.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-2">
            {project.tech_stack.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-emerald-500/40 px-2 py-0.5 text-xs font-medium text-emerald-600"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <Link
          href={project.url}
          target={isExternal(project.url) ? "_blank" : undefined}
          rel={isExternal(project.url) ? "noreferrer" : undefined}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline"
        >
          View Project <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/** Convert a full `WagtailPage` (from `listPages`) into a `ProjectCardData`. */
export function pageToProjectCard(
  page: WagtailPage<{
    card_description?: string;
    body_intro?: string;
    tech_stack?: string[];
    hero_image?: WagtailImage | null;
  }>,
): ProjectCardData {
  return {
    id: page.id,
    title: page.title,
    slug: page.meta.slug,
    url: toPath(page.meta.html_url) ?? "/",
    description: page.card_description ?? stripHtml(page.body_intro ?? "").slice(0, 220),
    image: page.hero_image ?? null,
    tech_stack: page.tech_stack ?? [],
  };
}

function isExternal(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function toPath(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}
