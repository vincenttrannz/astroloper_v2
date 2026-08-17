import { RichText } from "@/components/media/RichText";
import { StreamFieldRenderer } from "@/components/streamfield/StreamField";
import type { WagtailPage } from "@/lib/wagtail";

type HomePageData = WagtailPage<{
  body_intro?: string;
  hero?: unknown[];
  body?: unknown[];
}>;

export function HomePage({ page }: { page: WagtailPage }) {
  const data = page as HomePageData;
  return (
    <article className="container py-16">
      <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
      <RichText html={data.body_intro} className="mt-6" />
      {data.hero && <StreamFieldRenderer blocks={data.hero} />}
      {data.body && <StreamFieldRenderer blocks={data.body} />}
    </article>
  );
}
