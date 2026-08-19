import Link from "next/link";

import { RichText } from "@/components/media/RichText";
import { WagtailPicture } from "@/components/media/WagtailPicture";
import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/projects/ProjectCard";
import type { WagtailImage, WagtailPage } from "@/lib/wagtail";

type KeyFeature = { title: string; description: string };
type Technology = { name: string; description: string };

type ProjectPageData = WagtailPage<{
  role?: string;
  completed_label?: string;
  tech_stack?: string[];
  hero_image?: WagtailImage | null;
  body_intro?: string;
  project_url?: string;
  source_url?: string;
  key_features_list?: KeyFeature[];
  technologies_list?: Technology[];
  other_projects?: ProjectCardData[];
}>;

function toPath(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function isExternal(url: string): boolean {
  return /^https?:\/\//.test(url);
}

export function ProjectPage({ page }: { page: WagtailPage }) {
  const data = page as ProjectPageData;
  const parentPath = toPath(page.meta.parent?.meta.html_url) ?? "/projects/";
  const parentTitle = page.meta.parent?.title ?? "Projects";

  const features = data.key_features_list ?? [];
  const technologies = data.technologies_list ?? [];
  const otherProjects = data.other_projects ?? [];

  return (
    <article>
      {/* Top strip: breadcrumb (left) + meta (right) */}
      <section className="container pt-14 pb-6">
        <div className="flex flex-col-reverse items-start justify-between gap-3 text-sm sm:flex-row sm:items-center">
          <nav className="flex items-center gap-2 text-muted-foreground" aria-label="Breadcrumb">
            <Link href={parentPath} className="hover:text-foreground hover:underline">
              {parentTitle}
            </Link>
            <span aria-hidden>›</span>
            <span className="text-foreground">{page.title}</span>
          </nav>

          {(data.role || data.completed_label) && (
            <div className="flex items-center gap-6 text-muted-foreground">
              {data.role && (
                <span>
                  Role: <span className="font-medium text-foreground">{data.role}</span>
                </span>
              )}
              {data.completed_label && (
                <span>
                  Completed:{" "}
                  <span className="font-medium text-foreground">{data.completed_label}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Title + tech pills */}
      <header className="container pb-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
        {data.tech_stack && data.tech_stack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {data.tech_stack.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-emerald-500/40 px-2 py-0.5 text-xs font-medium text-emerald-600"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* Hero image */}
      {data.hero_image && (
        <section className="container pb-10">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted">
            <WagtailPicture
              image={data.hero_image}
              alt={page.title}
              sizes="(min-width: 1024px) 900px, 100vw"
              base="medium"
              className="h-auto w-full"
            />
          </div>
        </section>
      )}

      {/* Two-column: Overview + Key Features | CTAs + Technologies */}
      <section className="container pb-16">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-10 lg:col-span-2">
            {data.body_intro && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
                <RichText html={data.body_intro} className="mt-4" />
              </div>
            )}

            {features.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Key Features</h2>
                <ul className="mt-4 space-y-4">
                  {features.map((feature) => (
                    <li
                      key={feature.title}
                      className="rounded-xl border border-border/60 bg-card p-5"
                    >
                      <h3 className="text-base font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {(data.project_url || data.source_url) && (
              <div className="space-y-3">
                {data.project_url && (
                  <Link
                    href={data.project_url}
                    target={isExternal(data.project_url) ? "_blank" : undefined}
                    rel={isExternal(data.project_url) ? "noreferrer" : undefined}
                    className="block w-full rounded-md bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    View Live Site
                  </Link>
                )}
                {data.source_url && (
                  <Link
                    href={data.source_url}
                    target={isExternal(data.source_url) ? "_blank" : undefined}
                    rel={isExternal(data.source_url) ? "noreferrer" : undefined}
                    className="block w-full rounded-md border border-border bg-card px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    View Source Code
                  </Link>
                )}
              </div>
            )}

            {technologies.length > 0 && (
              <div>
                <h2 className="text-base font-bold tracking-tight">Technologies Used</h2>
                <ul className="mt-4 space-y-4">
                  {technologies.map((tech) => (
                    <li key={tech.name}>
                      <h3 className="text-sm font-semibold">{tech.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tech.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Other projects */}
      {otherProjects.length > 0 && (
        <section className="border-t border-border/60 bg-muted/30 py-16">
          <div className="container">
            <h2 className="text-2xl font-bold tracking-tight">Other Projects</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
