/**
 * Next.js Draft Mode entrypoint.
 *
 * The Wagtail admin redirects here when an editor clicks "Preview". We
 * verify the shared secret, enable draft mode, and forward the reader to
 * the target URL. Server components can then bypass their cache when
 * draftMode().isEnabled is true.
 */

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

const SECRET = process.env.WAGTAIL_PREVIEW_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug") ?? "/";

  if (!SECRET || secret !== SECRET) {
    return new Response("Invalid preview secret.", { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(slug);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
