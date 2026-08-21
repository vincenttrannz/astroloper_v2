/**
 * Client-side helpers for the two contact endpoints.
 *
 * These are called from the browser (client components) so we always
 * hit the public origin - `wagtailBaseUrl()` returns the internal
 * Docker URL server-side, which the browser can't reach.
 */

import { wagtailBaseUrl } from "@/lib/wagtail";

export type ContactFormPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type ContactFormResult =
  | { ok: true; id: number }
  | { ok: false; errors?: Record<string, string>; detail?: string };

export type ChatMessage = {
  role: "user" | "agent" | "system";
  content: string;
};

export type ChatRequest = {
  message: string;
  history?: ChatMessage[];
  session_id?: string;
};

export type ChatResult =
  | { ok: true; reply: string; session_id?: string; mock?: boolean }
  | { ok: false; detail: string };

function endpoint(path: string): string {
  return `${wagtailBaseUrl()}${path}`;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(endpoint(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<T> & {
    detail?: string;
    errors?: Record<string, string>;
  };
  if (!res.ok) {
    return { ok: false, ...data } as T;
  }
  return { ok: true, ...data } as T;
}

export async function submitContactForm(
  payload: ContactFormPayload,
): Promise<ContactFormResult> {
  return postJson<ContactFormResult>("/api/v2/contact/", payload);
}

export async function chatWithAgent(payload: ChatRequest): Promise<ChatResult> {
  return postJson<ChatResult>("/api/v2/agent/", payload);
}
