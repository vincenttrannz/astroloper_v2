import { ContactDetails } from "@/components/contact/ContactDetails";
import { TerminalForm } from "@/components/contact/TerminalForm";
import { RichText } from "@/components/media/RichText";
import { getSiteChrome } from "@/lib/site-chrome";
import type { WagtailPage } from "@/lib/wagtail";

type ContactPageData = WagtailPage<{
  body_intro?: string;
  contact_email?: string;
  contact_intro?: string;
  terminal_filename?: string;
  agent_greeting?: string;
}>;

export async function ContactPage({ page }: { page: WagtailPage }) {
  const data = page as ContactPageData;
  // Site chrome is fetched again here, but Next's request-scoped cache
  // dedupes the underlying fetch with the root layout's call.
  const chrome = await getSiteChrome();

  return (
    <div className="container py-16">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
        <RichText
          html={data.body_intro}
          className="[&>p]:text-lg [&>p]:text-muted-foreground"
        />
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <TerminalForm
          filename={data.terminal_filename || "contact.sh"}
          greeting={data.agent_greeting}
        />
        <ContactDetails
          email={data.contact_email}
          intro={data.contact_intro}
          chrome={chrome}
        />
      </div>
    </div>
  );
}
