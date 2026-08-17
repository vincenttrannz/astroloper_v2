/**
 * Generic StreamField dispatcher.
 *
 * Wagtail API v2 emits each StreamField entry as `{ type, value, id }`.
 * Each block-type has a component in this file; add new ones by:
 *
 *   1. Defining a `<Foo>Value` type matching the backend block's shape
 *      (or `WagtailImage` for embedded images).
 *   2. Writing the component.
 *   3. Registering it in `blockRegistry`.
 *
 * Any block that renders an image drops in `<WagtailPicture>`; any block that
 * renders rich text drops in `<RichText>`. Both handle nullability, sizing
 * and styling so blocks stay small.
 */

import { RichText } from "@/components/media/RichText";
import { WagtailPicture } from "@/components/media/WagtailPicture";
import type { WagtailImage } from "@/lib/wagtail";

type BlockEntry = { type: string; value: unknown; id?: string };

type BlockComponent = React.FC<{ value: any }>;

const blockRegistry: Record<string, BlockComponent> = {
  rich_text: RichTextBlock,
  image: ImageBlock,
  quote: QuoteBlock,
  hero: HeroBlock,
  columns: ColumnsBlock,
};

export function StreamFieldRenderer({ blocks }: { blocks?: unknown }) {
  if (!Array.isArray(blocks)) return null;
  return (
    <div className="mt-8 space-y-8">
      {(blocks as BlockEntry[]).map((block, idx) => {
        const Component = blockRegistry[block.type] ?? UnknownBlock;
        return <Component key={block.id ?? idx} value={block.value} />;
      })}
    </div>
  );
}

// -------------------------------------------------------------------------
// Block value types -- keep these in sync with backend/models/streamfield/*
// -------------------------------------------------------------------------

type RichTextValue = string;

type ImageBlockValue = {
  image: WagtailImage | null;
  caption?: string;
  alt_text?: string;
};

type QuoteBlockValue = {
  quote?: string;
  attribution?: string;
};

type HeroBlockValue = {
  heading?: string;
  subheading?: string;
  image?: WagtailImage | null;
  cta_label?: string;
  cta_url?: string;
  align?: "left" | "center" | "right";
};

type ColumnsBlockValue = {
  columns?: "2" | "3" | "4";
  items?: BlockEntry[];
};

// -------------------------------------------------------------------------
// Block components
// -------------------------------------------------------------------------

function RichTextBlock({ value }: { value: RichTextValue }) {
  return <RichText html={value} />;
}

function ImageBlock({ value }: { value: ImageBlockValue }) {
  return (
    <figure>
      <WagtailPicture
        image={value.image}
        alt={value.alt_text}
        sizes="(min-width: 1024px) 800px, 100vw"
        base="medium"
        className="rounded-lg"
      />
      {value.caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground">{value.caption}</figcaption>
      )}
    </figure>
  );
}

function QuoteBlock({ value }: { value: QuoteBlockValue }) {
  return (
    <blockquote className="border-l-4 border-primary pl-4 italic">
      <p>{value.quote}</p>
      {value.attribution && (
        <cite className="mt-2 block text-sm not-italic text-muted-foreground">
          — {value.attribution}
        </cite>
      )}
    </blockquote>
  );
}

function HeroBlock({ value }: { value: HeroBlockValue }) {
  const align =
    value.align === "center"
      ? "text-center items-center"
      : value.align === "right"
        ? "text-right items-end"
        : "text-left items-start";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-muted">
      {value.image && (
        <WagtailPicture
          image={value.image}
          sizes="100vw"
          base="large"
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        className={`relative flex flex-col ${align} gap-3 px-8 py-24 ${
          value.image ? "bg-black/40 text-white" : ""
        }`}
      >
        {value.heading && (
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{value.heading}</h2>
        )}
        {value.subheading && <p className="max-w-2xl text-lg opacity-90">{value.subheading}</p>}
        {value.cta_url && value.cta_label && (
          <a
            href={value.cta_url}
            className="mt-4 inline-flex w-fit rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            {value.cta_label}
          </a>
        )}
      </div>
    </section>
  );
}

function ColumnsBlock({ value }: { value: ColumnsBlockValue }) {
  const cols = { "2": "md:grid-cols-2", "3": "md:grid-cols-3", "4": "md:grid-cols-4" }[
    value.columns ?? "2"
  ];
  return (
    <div className={`grid gap-6 ${cols}`}>
      {(value.items ?? []).map((item, idx) => {
        const Component = blockRegistry[item.type] ?? UnknownBlock;
        return <Component key={item.id ?? idx} value={item.value} />;
      })}
    </div>
  );
}

function UnknownBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
