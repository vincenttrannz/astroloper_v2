/**
 * Reusable image primitive for Wagtail-emitted images.
 *
 * The backend `serialize_image()` helper produces a `WagtailImage` with a
 * pre-computed set of `renditions`. This component turns that object into a
 * responsive `<img>` with proper `srcset` / `sizes` / intrinsic dimensions so:
 *
 *   - the browser picks the smallest rendition that fits the layout,
 *   - no cumulative layout shift (CLS) while the image loads,
 *   - lazy loading by default (opt-in `priority` for above-the-fold usage).
 *
 * Consume it from *any* block that carries an image:
 *
 * ```tsx
 * <WagtailPicture
 *   image={value.image}
 *   alt={value.alt_text}                       // optional block-level override
 *   sizes="(min-width: 1024px) 800px, 100vw"   // tune per layout
 * />
 * ```
 */

import { cn } from "@/lib/utils";
import type { WagtailImage } from "@/lib/wagtail";

type RenditionKey = keyof WagtailImage["renditions"] | (string & {});

type Props = {
  image: WagtailImage | null | undefined;

  /** Overrides `image.alt`. Blocks with their own `alt_text` field should pass it. */
  alt?: string;

  /**
   * The `sizes` attribute (CSS length descriptor for how wide the image will
   * render). Default is `"100vw"` (full viewport). Tune per layout for smaller
   * downloads:
   *
   *   - "(min-width: 1024px) 800px, 100vw"    // article body
   *   - "(min-width: 768px) 33vw, 100vw"      // 3-column card
   */
  sizes?: string;

  /**
   * Which rendition backs the `src` attribute (fallback for browsers that
   * ignore `srcset`, and the "default" the browser fetches). Default `medium`.
   */
  base?: RenditionKey;

  /** Which renditions to include in `srcset`. Default: all keys on the image. */
  variants?: RenditionKey[];

  /**
   * Above-the-fold flag. When true, loads eagerly and hints high priority so
   * the browser fetches this image before less important ones (LCP win).
   */
  priority?: boolean;

  className?: string;
};

export function WagtailPicture({
  image,
  alt,
  sizes = "100vw",
  base = "medium",
  variants,
  priority = false,
  className,
}: Props) {
  if (!image) return null;

  const keys = variants ?? (Object.keys(image.renditions) as RenditionKey[]);
  const baseRendition = image.renditions[base] ?? image.renditions.medium ?? Object.values(image.renditions)[0];

  const srcSet = keys
    .map((k) => {
      const r = image.renditions[k];
      return r ? `${r.url} ${r.width}w` : null;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <img
      src={baseRendition.url}
      srcSet={srcSet || undefined}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...({ fetchPriority: priority ? "high" : "auto" } as Record<string, string>)}
      className={cn("h-auto max-w-full", className)}
    />
  );
}
