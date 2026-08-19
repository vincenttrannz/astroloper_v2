import { RichText } from "@/components/media/RichText";

type Props = {
  heading?: string;
  body?: string;
};

export function About({ heading = "About Me", body }: Props) {
  if (!body) return null;
  return (
    <section className="container py-16">
      <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
      <RichText html={body} className="mt-6 max-w-3xl" />
    </section>
  );
}
