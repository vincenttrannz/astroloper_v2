import { notFound } from "next/navigation";

import { renderPage } from "@/components/pages";
import { findPageByPath } from "@/lib/wagtail";

export const revalidate = 60;

export default async function HomePage() {
  const page = await findPageByPath("/");
  if (!page) return notFound();
  return renderPage(page);
}
