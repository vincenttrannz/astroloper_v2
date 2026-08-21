"use client";

/**
 * TerminalForm - a themed contact form that looks like a terminal.
 *
 * Two modes:
 *   - "form": labelled inputs (name, email, subject, message) + send button.
 *   - "chat": a scrolling log with a single prompt at the bottom that talks
 *     to the AI agent proxy (`/api/v2/agent/`).
 *
 * The user can switch modes by typing commands anywhere: `chat` or `help`
 * enter chat mode, `exit`/`back` leaves it, `clear` empties history.
 *
 * Not built on Xterm.js on purpose - we get full accessibility, proper
 * form autofill, screen-reader support, and zero deps by using real
 * <input>/<textarea> elements styled like a shell.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { chatWithAgent, submitContactForm, type ChatMessage } from "@/lib/contact";
import { cn } from "@/lib/utils";

type FormFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const EMPTY_FORM: FormFields = { name: "", email: "", subject: "", message: "" };

const HELP_LINES = [
  "supported commands:",
  "  help       - show this list",
  "  chat       - talk to the agent instead of filling the form",
  "  clear      - clear the chat history",
  "  exit / back - return to the contact form",
];

const COMMAND_ALIASES: Record<string, "help" | "chat" | "clear" | "exit"> = {
  help: "help",
  chat: "chat",
  clear: "clear",
  exit: "exit",
  back: "exit",
  quit: "exit",
};

function isCommand(raw: string): keyof typeof COMMAND_ALIASES | null {
  const key = raw.trim().toLowerCase();
  if (key in COMMAND_ALIASES) return key as keyof typeof COMMAND_ALIASES;
  return null;
}

type Props = {
  filename?: string;
  greeting?: string;
};

export function TerminalForm({ filename = "contact.sh", greeting }: Props) {
  const [mode, setMode] = useState<"form" | "chat">("form");
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  const chromeTitle = useMemo(() => filename, [filename]);

  const appendHistory = useCallback((entry: ChatMessage) => {
    setHistory((h) => [...h, entry]);
  }, []);

  const enterChat = useCallback(() => {
    setMode("chat");
    setHistory((prev) => {
      if (prev.length > 0) return prev;
      const opener: ChatMessage[] = [
        {
          role: "system",
          content:
            "entering agent chat. type 'exit' or 'back' to return to the form, 'clear' to reset.",
        },
      ];
      if (greeting) {
        const stripped = greeting.replace(/<[^>]+>/g, "").trim();
        if (stripped) opener.push({ role: "agent", content: stripped });
      }
      return opener;
    });
  }, [greeting]);

  const exitChat = useCallback(() => {
    setMode("form");
  }, []);

  const runCommand = useCallback(
    (cmd: keyof typeof COMMAND_ALIASES): boolean => {
      const resolved = COMMAND_ALIASES[cmd];
      if (resolved === "help") {
        if (mode !== "chat") enterChat();
        HELP_LINES.forEach((line) =>
          setHistory((h) => [...h, { role: "system", content: line }]),
        );
        return true;
      }
      if (resolved === "chat") {
        enterChat();
        return true;
      }
      if (resolved === "clear") {
        setHistory([]);
        return true;
      }
      if (resolved === "exit") {
        exitChat();
        return true;
      }
      return false;
    },
    [enterChat, exitChat, mode],
  );

  useEffect(() => {
    if (mode !== "chat") return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    chatInputRef.current?.focus();
  }, [history, mode]);

  const handleFieldChange = (name: keyof FormFields, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleFieldKeyDown = (
    name: keyof FormFields,
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Enter") return;
    if (name === "message" && !event.metaKey && !event.ctrlKey) return;
    const value = event.currentTarget.value.trim();
    const command = isCommand(value);
    if (command) {
      event.preventDefault();
      runCommand(command);
      setForm((f) => ({ ...f, [name]: "" }));
      return;
    }
    if (name === "message" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handoffToAgent = useCallback(
    async (submitted: FormFields) => {
      const composed = [
        `Hi, I'm ${submitted.name} (${submitted.email}).`,
        submitted.subject ? `Subject: "${submitted.subject}".` : "",
        submitted.message,
      ]
        .filter(Boolean)
        .join(" ");

      // Show the visitor exactly what the agent is responding to.
      const initialHistory: ChatMessage[] = [
        {
          role: "system",
          content:
            "message saved. the agent is drafting a reply - keep chatting or type 'exit' to leave.",
        },
        { role: "user", content: composed },
      ];
      setHistory(initialHistory);
      setMode("chat");
      setChatBusy(true);

      const res = await chatWithAgent({
        message: composed,
        history: initialHistory.filter((m) => m.role !== "system"),
      });
      setChatBusy(false);
      if (res.ok) {
        if (res.session_id) setSessionId(res.session_id);
        appendHistory({ role: "agent", content: res.reply });
      } else {
        appendHistory({
          role: "system",
          content: `the agent couldn't be reached: ${res.detail}. your message is saved and i'll follow up manually.`,
        });
      }
    },
    [appendHistory],
  );

  const handleSubmit = async () => {
    const localErrors: Partial<Record<keyof FormFields, string>> = {};
    if (!form.name.trim()) localErrors.name = "please tell me your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      localErrors.email = "that doesn't look like a valid email address.";
    }
    if (!form.message.trim()) localErrors.message = "please include a message.";
    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      setStatus({
        kind: "error",
        message: "fix the highlighted fields and try again.",
      });
      return;
    }

    const submitted: FormFields = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };

    setSubmitting(true);
    setStatus({ kind: "idle" });
    try {
      const res = await submitContactForm(submitted);
      if (res.ok) {
        setForm(EMPTY_FORM);
        setStatus({ kind: "idle" });
        void handoffToAgent(submitted);
      } else {
        if (res.errors) setErrors(res.errors as typeof errors);
        setStatus({
          kind: "error",
          message: res.detail ?? "something went wrong. please try again.",
        });
      }
    } catch {
      setStatus({
        kind: "error",
        message: "network error. please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const raw = chatInput.trim();
    if (!raw || chatBusy) return;

    const command = isCommand(raw);
    if (command) {
      appendHistory({ role: "user", content: raw });
      setChatInput("");
      runCommand(command);
      return;
    }

    appendHistory({ role: "user", content: raw });
    setChatInput("");
    setChatBusy(true);

    const nextHistory: ChatMessage[] = [...history, { role: "user", content: raw }];
    const res = await chatWithAgent({
      message: raw,
      history: nextHistory,
      session_id: sessionId,
    });
    setChatBusy(false);
    if (res.ok) {
      if (res.session_id) setSessionId(res.session_id);
      appendHistory({ role: "agent", content: res.reply });
    } else {
      appendHistory({ role: "system", content: `error: ${res.detail}` });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-white text-neutral-700 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 bg-neutral-50 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-2 font-mono text-xs text-neutral-500">{chromeTitle}</span>
      </div>

      {mode === "form" ? (
        <form
          className="space-y-4 px-5 py-6 font-mono text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <TerminalField
            label="name"
            name="name"
            autoComplete="name"
            value={form.name}
            error={errors.name}
            onChange={(v) => handleFieldChange("name", v)}
            onKeyDown={(e) => handleFieldKeyDown("name", e)}
          />
          <TerminalField
            label="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            error={errors.email}
            onChange={(v) => handleFieldChange("email", v)}
            onKeyDown={(e) => handleFieldKeyDown("email", e)}
          />
          <TerminalField
            label="subject"
            name="subject"
            value={form.subject}
            error={errors.subject}
            onChange={(v) => handleFieldChange("subject", v)}
            onKeyDown={(e) => handleFieldKeyDown("subject", e)}
          />
          <TerminalTextarea
            label="message"
            name="message"
            value={form.message}
            error={errors.message}
            onChange={(v) => handleFieldChange("message", v)}
            onKeyDown={(e) => handleFieldKeyDown("message", e)}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-sm text-emerald-700 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-emerald-600">$</span>
              {submitting ? "sending..." : "send_message"}
            </button>
            {/* <p className="text-xs text-neutral-500">
              tip: type <span className="text-emerald-600">help</span> for supported commands.
            </p> */}
          </div>

          {status.kind !== "idle" && (
            <p
              role="status"
              className={cn(
                "font-mono text-xs",
                status.kind === "success" ? "text-emerald-600" : "text-red-600",
              )}
            >
              {status.kind === "success" ? "> " : "! "}
              {status.message}
            </p>
          )}
        </form>
      ) : (
        <div className="flex h-[520px] flex-col font-mono text-sm">
          <div
            ref={logRef}
            className="flex-1 space-y-1.5 overflow-y-auto px-5 py-6 text-sm leading-relaxed"
          >
            {history.length === 0 ? (
              <p className="text-neutral-500">
                <span className="text-emerald-600">$</span> chat with the agent. type
                your message below.
              </p>
            ) : (
              history.map((entry, i) => <ChatLine key={i} entry={entry} />)
            )}
            {chatBusy && (
              <p className="text-neutral-500">
                <span className="text-emerald-600">...</span> the agent is thinking
              </p>
            )}
          </div>

          <form
            onSubmit={handleChatSubmit}
            className="flex items-center gap-2 border-t border-border/60 bg-neutral-50 px-5 py-3"
          >
            <span className="text-emerald-600">$</span>
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatBusy}
              autoComplete="off"
              spellCheck={false}
              placeholder="ask the agent anything - or type 'exit' to go back"
              className="flex-1 bg-transparent text-neutral-800 caret-emerald-600 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60"
            />
          </form>
        </div>
      )}
    </div>
  );
}

function ChatLine({ entry }: { entry: ChatMessage }) {
  if (entry.role === "user") {
    return (
      <p className="text-neutral-800">
        <span className="text-emerald-600">&gt;</span> {entry.content}
      </p>
    );
  }
  if (entry.role === "agent") {
    return (
      <p className="text-neutral-700">
        <span className="text-sky-600">agent:</span> {entry.content}
      </p>
    );
  }
  return <p className="text-neutral-500">{entry.content}</p>;
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  error?: string;
  autoComplete?: string;
  type?: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

function TerminalField({
  label,
  name,
  value,
  error,
  autoComplete,
  type = "text",
  onChange,
  onKeyDown,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-24 shrink-0 text-neutral-500">
        <span className="text-emerald-600">&gt;</span> {label}:
      </span>
      <input
        type={type}
        name={name}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-invalid={Boolean(error)}
        className={cn(
          "flex-1 rounded-sm border border-border/60 bg-neutral-50 px-3 py-2 text-neutral-800 caret-emerald-600 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none",
          error && "border-red-400",
        )}
      />
      {error && <span className="text-xs text-red-600 sm:ml-3">{error}</span>}
    </label>
  );
}

type TextareaProps = {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

function TerminalTextarea({
  label,
  name,
  value,
  error,
  onChange,
  onKeyDown,
}: TextareaProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-neutral-500">
        <span className="text-emerald-600">&gt;</span> {label}:
      </span>
      <textarea
        name={name}
        value={value}
        rows={6}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-invalid={Boolean(error)}
        placeholder="tell me about your project, timeline, or question..."
        className={cn(
          "w-full resize-y rounded-sm border border-border/60 bg-neutral-50 px-3 py-2 text-neutral-800 caret-emerald-600 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none",
          error && "border-red-400",
        )}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
