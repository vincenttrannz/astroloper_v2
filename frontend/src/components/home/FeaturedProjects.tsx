import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";

type Props = {
  heading?: string;
  projects?: ProjectCardData[];
};

export function FeaturedProjects({ heading = "Featured Projects", projects }: Props) {
  if (!projects || projects.length === 0) return null;
  return (
    <section className="border-y border-border/60 bg-muted/30 py-16">
      <div className="container">
        <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
