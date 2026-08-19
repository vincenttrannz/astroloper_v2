import { ProjectCard, pageToProjectCard } from "@/components/projects/ProjectCard";
import { RichText } from "@/components/media/RichText";
import { StreamFieldRenderer } from "@/components/streamfield/StreamField";
import { listPages, type WagtailPage } from "@/lib/wagtail";

type ProjectIndexData = WagtailPage<{
  body_intro?: string;
  intro?: unknown[];
}>;

export async function ProjectIndexPage({ page }: { page: WagtailPage }) {
  const data = page as ProjectIndexData;
  const children = await listPages({
    child_of: page.id,
    type: "models.ProjectPage",
    limit: 24,
    order: "-first_published_at",
  });

  const hasIntro = Array.isArray(data.intro) && data.intro.length > 0;

  return (
    <div>
      <section className="container pt-16 pb-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
        <RichText
          html={data.body_intro}
          className="mt-3 max-w-3xl [&>p]:text-muted-foreground"
        />
        {hasIntro && (
          <div className="mt-6 max-w-3xl">
            <StreamFieldRenderer blocks={data.intro} />
          </div>
        )}
      </section>

      <section className="container pb-16">
        {children.items.length === 0 ? (
          <p className="text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {children.items.map((child) => (
              <ProjectCard key={child.id} project={pageToProjectCard(child)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
