/**
 * Reusable renderer for Wagtail RichText HTML.
 *
 * Wagtail's ``RichTextField`` / ``RichTextBlock`` emit sanitized HTML strings
 * (headings, lists, links, blockquotes, embedded images, etc.). This
 * component wraps ``dangerouslySetInnerHTML`` with the Tailwind Typography
 * ``prose`` class so the output has sensible default styling everywhere it
 * appears (StreamField ``rich_text`` block, ``body_intro`` on Pages, blog
 * intros, ...).
 *
 * Pass ``size`` to opt into a different `prose` size, or ``className`` to
 * layer additional utilities on top.
 */

import { cn } from "@/lib/utils";

type ProseSize = "sm" | "base" | "lg" | "xl" | "2xl";

type Props = {
  /** Raw HTML string from the Wagtail API (already sanitized server-side). */
  html?: string | null;

  /** Tailwind Typography size class. Default `base`. */
  size?: ProseSize;

  /** Extra classes appended after the defaults (Tailwind-merge safe via cn). */
  className?: string;
};

const SIZE_CLASS: Record<ProseSize, string> = {
  sm: "prose-sm",
  base: "prose-base",
  lg: "prose-lg",
  xl: "prose-xl",
  "2xl": "prose-2xl",
};

export function RichText({ html, size = "base", className }: Props) {
  if (!html) return null;
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert",
        SIZE_CLASS[size],
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
