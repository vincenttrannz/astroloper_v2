import type { WagtailPage } from "@/lib/wagtail";

export function UnknownPage({ page }: { page: WagtailPage }) {
  return (
    <article className="container py-16">
      <h1 className="text-3xl font-semibold">{page.title}</h1>
      <p className="mt-4 text-muted-foreground">
        No renderer registered for page type <code>{page.meta.type}</code>. Add one in{" "}
        <code>src/components/pages/index.tsx</code>.
      </p>
    </article>
  );
}
