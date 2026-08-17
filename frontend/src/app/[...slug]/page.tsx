import { notFound } from "next/navigation";

import { renderPage } from "@/components/pages";
import { findPageByPath } from "@/lib/wagtail";

export const revalidate = 60;

type Params = { slug?: string[] };

export default async function CatchAllPage({ params }: { params: Promise<Params> }) {
  const { slug = [] } = await params;
  const htmlPath = `/${slug.join("/")}/`;
  const page = await findPageByPath(htmlPath);
  if (!page) return notFound();
  return renderPage(page);
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug = [] } = await params;
  const htmlPath = `/${slug.join("/")}/`;
  const page = await findPageByPath(htmlPath);
  if (!page) return {};
  return {
    title: page.title,
  };
}
