import { RichText } from "@/components/media/RichText";
import { StreamFieldRenderer } from "@/components/streamfield/StreamField";
import type { WagtailPage } from "@/lib/wagtail";

type BlogPageData = WagtailPage<{
  date?: string;
  body_intro?: string;
  hero?: unknown[];
  body?: unknown[];
  author?: { name?: string } | null;
}>;

export function BlogPage({ page }: { page: WagtailPage }) {
  const data = page as BlogPageData;
  return (
    <article className="container py-16">
      <header className="mb-10 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        <div className="text-sm text-muted-foreground">
          {data.date}
          {data.author?.name ? ` · ${data.author.name}` : null}
        </div>
      </header>
      <RichText html={data.body_intro} size="lg" />
      {data.hero && <StreamFieldRenderer blocks={data.hero} />}
      {data.body && <StreamFieldRenderer blocks={data.body} />}
    </article>
  );
}
