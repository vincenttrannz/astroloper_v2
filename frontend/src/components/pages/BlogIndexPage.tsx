import Link from "next/link";

import { RichText } from "@/components/media/RichText";
import { StreamFieldRenderer } from "@/components/streamfield/StreamField";
import { listPages, type WagtailPage } from "@/lib/wagtail";

type BlogIndexData = WagtailPage<{
  body_intro?: string;
  intro?: unknown[];
}>;

export async function BlogIndexPage({ page }: { page: WagtailPage }) {
  const data = page as BlogIndexData;
  const children = await listPages({ child_of: page.id, type: "models.BlogPage" });

  return (
    <article className="container py-16">
      <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
      <RichText html={data.body_intro} className="mt-6" />
      {data.intro && <StreamFieldRenderer blocks={data.intro} />}
      <ul className="mt-10 space-y-6">
        {children.items.map((child) => (
          <li key={child.id}>
            <Link
              href={child.meta.html_url ?? "/"}
              className="text-2xl font-semibold hover:underline"
            >
              {child.title}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
