import { PostCard, type PostCardData } from "@/components/blog/PostCard";

type Props = {
  heading?: string;
  posts?: PostCardData[];
};

export function RecentPosts({ heading = "Recent Blog Posts", posts }: Props) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="container py-16">
      <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
