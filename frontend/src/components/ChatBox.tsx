"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { sendChat } from "@/lib/api";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { getCachedAnswer, setCachedAnswer } from "@/lib/chatCache";

export interface ChatAutoQuestion {
  id: string;
  question: string;
  node_name?: string;
  node_summary?: string;
}

export type ChatBoxHandle = {
  appendAiSummary: (opts: { nodeName?: string; body: string }) => void;
};

interface ChatBoxProps {
  docId: string | null;
  geminiModel: string;
  chatPrefill: ChatAutoQuestion | null;
  onChatPrefillConsumed: () => void;
}

type Msg = { role: "user" | "assistant"; content: string };

const CACHE_NOTE =
  "*Retrieved from local cache (no API call).*\n\n";

export const ChatBox = forwardRef<ChatBoxHandle, ChatBoxProps>(
  function ChatBoxInner(
    { docId, geminiModel, chatPrefill, onChatPrefillConsumed },
    ref
  ) {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const processedPrefillIds = useRef(new Set<string>());
    const listEndRef = useRef<HTMLDivElement | null>(null);
    const lastPrefilledQuestionRef = useRef("");
    const nodeContextRef = useRef<{ name?: string; summary?: string } | null>(
      null
    );

    useImperativeHandle(
      ref,
      () => ({
        appendAiSummary: ({ nodeName, body }) => {
          const label = nodeName?.trim() || "focus";
          setMessages((m) => [
            ...m,
            {
              role: "user",
              content: `_Requested AI summary for **${label}**._`,
            },
            { role: "assistant", content: body },
          ]);
        },
      }),
      []
    );

    useEffect(() => {
      if (!chatPrefill) return;
      if (processedPrefillIds.current.has(chatPrefill.id)) return;
      processedPrefillIds.current.add(chatPrefill.id);
      setInput(chatPrefill.question);
      lastPrefilledQuestionRef.current = chatPrefill.question;
      nodeContextRef.current = {
        name: chatPrefill.node_name,
        summary: chatPrefill.node_summary,
      };
      onChatPrefillConsumed();
    }, [chatPrefill, onChatPrefillConsumed]);

    const resolveNodeContext = useCallback((trimmedQuestion: string) => {
      const last = lastPrefilledQuestionRef.current.trim();
      const ctx = nodeContextRef.current;
      if (!ctx?.name || !last || trimmedQuestion !== last) {
        return { node_name: undefined, node_summary: undefined, nodeHint: "" };
      }
      const hint = `${ctx.name}|${(ctx.summary || "").slice(0, 120)}`;
      return {
        node_name: ctx.name,
        node_summary: ctx.summary,
        nodeHint: hint,
      };
    }, []);

    const runQuestion = useCallback(
      async (question: string) => {
        const trimmed = question.trim();
        if (!trimmed) return;

        const { node_name, node_summary, nodeHint } =
          resolveNodeContext(trimmed);

        setError(null);
        setMessages((m) => [...m, { role: "user", content: trimmed }]);

        const cached = getCachedAnswer(
          docId,
          geminiModel,
          trimmed,
          nodeHint || undefined
        );
        if (cached) {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `${CACHE_NOTE}${cached}` },
          ]);
          return;
        }

        setLoading(true);
        try {
          const { answer } = await sendChat({
            doc_id: docId,
            question: trimmed,
            node_name,
            node_summary,
            gemini_model: geminiModel.trim() || undefined,
          });
          setMessages((m) => [...m, { role: "assistant", content: answer }]);
          if (!answer.startsWith("(Error)")) {
            setCachedAnswer(
              docId,
              geminiModel,
              trimmed,
              answer,
              nodeHint || undefined
            );
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Request failed";
          setError(msg);
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `(Error) ${msg}` },
          ]);
        } finally {
          setLoading(false);
        }
      },
      [docId, geminiModel, resolveNodeContext]
    );

    useEffect(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const q = input.trim();
      if (!q || loading) return;
      setInput("");
      void runQuestion(q);
    };

    const clearHistory = () => {
      setMessages([]);
      setError(null);
    };

    return (
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-l border-white/10 bg-zinc-950/98 shadow-[inset_1px_0_0_rgba(255,255,255,0.04)]">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-white/10 py-2 pl-3 pr-[4.75rem]">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-cyan-100">
            Galaxy chat
          </h3>
          <button
            type="button"
            onClick={clearHistory}
            disabled={messages.length === 0 && !error}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/90 disabled:opacity-30"
          >
            Clear
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-sm">
          {messages.length === 0 && (
            <p className="text-white/50">
              Ask about the document, or use{" "}
              <strong className="text-white/70">AI summarize</strong> in the Raw
              column. Node clicks prefill a question — press{" "}
              <strong className="text-white/70">Send</strong> to answer (cached
              when repeated).
              {!docId && (
                <span className="mt-2 block text-amber-200/80">
                  Upload a PDF so answers use your document.
                </span>
              )}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`max-w-[98%] rounded-2xl px-3 py-2 leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-cyan-500/20 text-cyan-50"
                  : "mr-auto border border-white/10 bg-white/5 text-slate-100"
              }`}
            >
              {m.role === "assistant" && !m.content.startsWith("(Error)") ? (
                <ChatMarkdown content={m.content} />
              ) : (
                <span className="whitespace-pre-wrap break-words">{m.content}</span>
              )}
            </div>
          ))}
          {loading && (
            <p className="text-xs text-cyan-300/80">Thinking…</p>
          )}
          {error && <p className="text-xs text-rose-300/90">{error}</p>}
          <div ref={listEndRef} />
        </div>
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-white/10 p-3"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-50 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    );
  }
);

ChatBox.displayName = "ChatBox";
