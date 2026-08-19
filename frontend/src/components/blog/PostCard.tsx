/**
 * PostCard - the shared blog post card used by both the blog listing and the
 * homepage "Recent Posts" grid.
 *
 * Accepts a `PostCardData` shape (id, title, url, first_published_at,
 * excerpt). Backend properties on ``BlogPage`` and the homepage
 * ``recent_posts`` derived field both emit this shape, and the
 * ``pageToPostCard()`` helper below converts a bare ``WagtailPage`` into it.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { WagtailPage } from "@/lib/wagtail";

export type PostCardData = {
  id: number;
  title: string;
  url: string;
  first_published_at: string | null;
  excerpt: string;
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function PostCard({ post }: { post: PostCardData }) {
  const date = post.first_published_at ? dateFmt.format(new Date(post.first_published_at)) : null;
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5">
      {date && <p className="text-xs font-medium text-emerald-600">{date}</p>}
      <h3 className="line-clamp-3 text-lg font-semibold leading-snug tracking-tight">
        {post.title}
      </h3>
      <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
      <Link
        href={post.url}
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline"
      >
        Read More <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </article>
  );
}

/** Convert a full ``WagtailPage`` (from ``listPages``) into a ``PostCardData``. */
export function pageToPostCard(
  page: WagtailPage<{ excerpt?: string; body_intro?: string }>,
): PostCardData {
  return {
    id: page.id,
    title: page.title,
    url: toPath(page.meta.html_url) ?? "/",
    first_published_at: page.meta.first_published_at,
    excerpt: page.excerpt ?? stripHtml(page.body_intro ?? "").slice(0, 280),
  };
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
