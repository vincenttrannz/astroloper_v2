import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RichText } from "@/components/media/RichText";
import { StreamFieldRenderer } from "@/components/streamfield/StreamField";
import type { WagtailPage } from "@/lib/wagtail";

type BlogCategory = { id: number; name: string; slug: string } | null;
type BlogAuthor = { id: number; name: string; slug: string } | null;

type BlogPageData = WagtailPage<{
  category?: BlogCategory;
  author?: BlogAuthor;
  date?: string;
  reading_time?: number;
  body_intro?: string;
  body?: unknown[];
  tag_names?: string[];
}>;

const publishedFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function toPath(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function BlogPage({ page }: { page: WagtailPage }) {
  const data = page as BlogPageData;
  const backTo = toPath(page.meta.parent?.meta.html_url) ?? "/blog/";
  const published = data.meta.first_published_at
    ? publishedFmt.format(new Date(data.meta.first_published_at))
    : data.date
      ? publishedFmt.format(new Date(data.date))
      : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <header className="space-y-5">
        {(data.category || data.reading_time) && (
          <div className="flex items-center gap-3 text-xs font-semibold">
            {data.category && (
              <span className="uppercase tracking-widest text-emerald-600">
                {data.category.name}
              </span>
            )}
            {data.category && data.reading_time ? (
              <span className="text-neutral-300" aria-hidden>
                •
              </span>
            ) : null}
            {data.reading_time && (
              <span className="text-muted-foreground">{data.reading_time} min read</span>
            )}
          </div>
        )}

        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {page.title}
        </h1>

        {(data.author?.name || published) && (
          <div className="text-sm text-muted-foreground">
            {data.author?.name && (
              <span className="font-semibold text-foreground">{data.author.name}</span>
            )}
            {data.author?.name && published && (
              <span className="mx-2 text-neutral-300" aria-hidden>
                •
              </span>
            )}
            {published && <span>Published {published}</span>}
          </div>
        )}

        {data.tag_names && data.tag_names.length > 0 && (
          <ul className="mt-12 flex flex-wrap gap-2">
            {data.tag_names.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-emerald-500/40 px-2 py-0.5 text-xs font-medium text-emerald-600"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      <hr className="my-10 border-border/60" />

      <RichText html={data.body_intro} />
      {data.body && <StreamFieldRenderer blocks={data.body} />}

      <hr className="my-12 border-border/60" />

      <Link
        href={backTo}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to Blog
      </Link>
    </article>
  );
}
