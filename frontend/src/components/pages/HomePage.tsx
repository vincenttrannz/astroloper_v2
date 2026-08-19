import { About } from "@/components/home/About";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { RecentPosts } from "@/components/home/RecentPosts";
import type { ProjectCardData } from "@/components/projects/ProjectCard";
import type { PostCardData } from "@/components/blog/PostCard";
import { StreamFieldRenderer } from "@/components/streamfield/StreamField";
import type { WagtailPage } from "@/lib/wagtail";

type HomePageData = WagtailPage<{
  availability_label?: string;
  hero_heading?: string;
  hero_intro?: string;
  hero_cta_label?: string;
  hero_cta_url?: string;
  hero_code?: string;

  about_heading?: string;
  about_body?: string;

  projects_heading?: string;
  featured_projects?: ProjectCardData[];

  blog_heading?: string;
  recent_posts?: PostCardData[];

  body?: unknown[];
}>;

export function HomePage({ page }: { page: WagtailPage }) {
  const data = page as HomePageData;

  return (
    <>
      <Hero
        availabilityLabel={data.availability_label}
        heading={data.hero_heading}
        intro={data.hero_intro}
        ctaLabel={data.hero_cta_label}
        ctaUrl={data.hero_cta_url}
        code={data.hero_code}
      />

      <About heading={data.about_heading} body={data.about_body} />

      <FeaturedProjects heading={data.projects_heading} projects={data.featured_projects} />

      <RecentPosts heading={data.blog_heading} posts={data.recent_posts} />

      {data.body && data.body.length > 0 && (
        <div className="container">
          <StreamFieldRenderer blocks={data.body} />
        </div>
      )}
    </>
  );
}
