import Link from "next/link";

import { TerminalCard } from "@/components/home/TerminalCard";

type Props = {
  availabilityLabel?: string;
  heading?: string;
  intro?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  code?: string;
};

export function Hero({ availabilityLabel, heading, intro, ctaLabel, ctaUrl, code }: Props) {
  if (!heading && !intro && !code) return null;

  return (
    <section className="container grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-24">
      <div className="space-y-6">
        {availabilityLabel && (
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            {availabilityLabel}
          </p>
        )}
        {heading && (
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {heading}
          </h1>
        )}
        {intro && <p className="max-w-xl text-lg text-muted-foreground">{intro}</p>}
        {ctaUrl && ctaLabel && (
          <Link
            href={ctaUrl}
            className="inline-flex items-center rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            {ctaLabel}
          </Link>
        )}
      </div>

      <TerminalCard content={code} className="md:justify-self-end md:min-w-[420px]" />
    </section>
  );
}
