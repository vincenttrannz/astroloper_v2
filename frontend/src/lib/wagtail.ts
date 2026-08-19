/**
 * Typed Wagtail API v2 client.
 *
 * Server-side calls go through `WAGTAIL_API_URL` (internal Docker DNS,
 * e.g. `http://backend:8000`). Browser-side calls use `NEXT_PUBLIC_SITE_URL`
 * which is the public origin behind Traefik.
 */

const SERVER_API_URL = process.env.WAGTAIL_API_URL ?? "http://backend:8000";
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://astroloper.localhost";

/** Base URL to use depending on runtime. */
export function wagtailBaseUrl(): string {
  if (typeof window === "undefined") return SERVER_API_URL;
  return PUBLIC_SITE_URL;
}

/** Cache tag namespace so all Wagtail responses can be invalidated together. */
export const WAGTAIL_TAG = "wagtail";

// -------------------------------------------------------------------------
// Types (a minimal subset - extend as you grow the API surface)
// -------------------------------------------------------------------------

/** A single rendition emitted by the backend `serialize_image()` helper. */
export type WagtailRendition = {
  url: string;
  width: number;
  height: number;
};

/**
 * The shape produced by `models.api.images.serialize_image()` on the backend
 * (used by both `APIImageChooserBlock` inside StreamFields and
 * `ImageRenditionsField` on FKs like `og_image`).
 *
 * Rendition keys mirror `IMAGE_RENDITION_SPECS` in `backend/models/api/images.py`.
 * Keep the two in sync if you add/remove renditions.
 */
export type WagtailImage = {
  id: number;
  title: string;
  alt: string;
  width: number;
  height: number;
  renditions: {
    thumbnail: WagtailRendition;
    card: WagtailRendition;
    medium: WagtailRendition;
    large: WagtailRendition;
  } & Record<string, WagtailRendition>;
};

export type WagtailPageRef = {
  id: number;
  title: string;
  meta: {
    type: string;
    detail_url: string;
    html_url: string | null;
  };
};

export type WagtailMeta = {
  type: string;
  detail_url: string;
  html_url: string | null;
  slug: string;
  first_published_at: string | null;
  locale?: string;
  parent?: WagtailPageRef | null;
};

export type WagtailPage<TExtra = Record<string, unknown>> = TExtra & {
  id: number;
  title: string;
  meta: WagtailMeta;
};

export type WagtailPageList<T = WagtailPage> = {
  meta: { total_count: number };
  items: T[];
};

// -------------------------------------------------------------------------
// Low-level fetch helper
// -------------------------------------------------------------------------

type FetchOpts = {
  revalidate?: number | false;
  tags?: string[];
  signal?: AbortSignal;
};

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${wagtailBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const revalidate = opts.revalidate === undefined ? 60 : opts.revalidate;

  const res = await fetch(url, {
    signal: opts.signal,
    headers: { Accept: "application/json" },
    next: {
      revalidate: revalidate === false ? undefined : revalidate,
      tags: [WAGTAIL_TAG, ...(opts.tags ?? [])],
    },
  });

  if (!res.ok) {
    throw new Error(`Wagtail API ${res.status} ${res.statusText} at ${url}`);
  }
  return (await res.json()) as T;
}

// -------------------------------------------------------------------------
// Public helpers
// -------------------------------------------------------------------------

/**
 * Look a page up by its `html_path` (Wagtail's URL, e.g. "/blog/hello-world/").
 *
 * Wagtail's `/api/v2/pages/find/` endpoint responds with a 302 whose Location
 * is built from the configured Wagtail Site (hostname + port). That hostname is
 * typically the public one (e.g. `astroloper.localhost`) which the frontend
 * *container* cannot resolve. So we intercept the redirect and re-issue the
 * detail request against our controlled base URL (`http://backend:8000` when
 * running server-side inside docker).
 */
export async function findPageByPath(
  htmlPath: string,
  opts: FetchOpts = {},
): Promise<WagtailPage | null> {
  const path = htmlPath.startsWith("/") ? htmlPath : `/${htmlPath}`;
  const query = new URLSearchParams({ html_path: path, fields: "*" });
  const findUrl = `${wagtailBaseUrl()}/api/v2/pages/find/?${query.toString()}`;

  const findRes = await fetch(findUrl, {
    method: "GET",
    redirect: "manual",
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (findRes.status === 404) return null;

  // Wagtail returns 302 (or fetch reports 0/opaqueredirect with redirect:manual).
  const isRedirect =
    findRes.status === 302 ||
    findRes.status === 301 ||
    findRes.status === 0 ||
    findRes.type === "opaqueredirect";

  if (!isRedirect) {
    if (!findRes.ok) throw new Error(`Wagtail API ${findRes.status} at ${findUrl}`);
    return (await findRes.json()) as WagtailPage;
  }

  const location = findRes.headers.get("location");
  if (!location) return null;

  // Take the path only; the base URL (host + port) comes from `wagtailBaseUrl()`.
  let detailPath: string;
  try {
    detailPath = new URL(location, findUrl).pathname;
  } catch {
    return null;
  }

  return apiFetch<WagtailPage>(`${detailPath}?fields=*`, opts);
}

/** Fetch the child pages of a given parent id (or the root if omitted). */
export async function listPages(
  params: {
    type?: string;
    child_of?: number | string;
    limit?: number;
    offset?: number;
    order?: string;
  } = {},
  opts: FetchOpts = {},
): Promise<WagtailPageList> {
  const query = new URLSearchParams({ fields: "*" });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query.set(k, String(v));
  }
  return apiFetch<WagtailPageList>(`/api/v2/pages/?${query.toString()}`, opts);
}

/** Fetch a page by numeric id. */
export async function getPage(id: number, opts: FetchOpts = {}): Promise<WagtailPage> {
  const query = new URLSearchParams({ fields: "*" });
  return apiFetch<WagtailPage>(`/api/v2/pages/${id}/?${query.toString()}`, opts);
}
