/**
 * A fake terminal window that renders arbitrary code/output as a monospace
 * block. Used in the hero to give the marketing copy a technical feel.
 */

import { cn } from "@/lib/utils";

type Props = {
  content?: string;
  title?: string;
  className?: string;
};

export function TerminalCard({ content, title = "$ open run.build", className }: Props) {
  if (!content) return null;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 bg-neutral-50 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
      </div>
      <div className="px-5 py-4 font-mono text-sm leading-relaxed text-neutral-700">
        <p className="mb-2 font-medium text-neutral-800">{title}</p>
        <pre className="whitespace-pre-wrap break-words text-neutral-600">{content}</pre>
      </div>
    </div>
  );
}
