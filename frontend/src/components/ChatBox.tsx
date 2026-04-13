"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendChat } from "@/lib/api";

export interface ChatAutoQuestion {
  id: string;
  question: string;
  node_name?: string;
  node_summary?: string;
}

interface ChatBoxProps {
  open: boolean;
  onToggle: () => void;
  docId: string | null;
  autoQuestion: ChatAutoQuestion | null;
  onAutoQuestionConsumed: () => void;
}

type Msg = { role: "user" | "assistant"; content: string };

export function ChatBox({
  open,
  onToggle,
  docId,
  autoQuestion,
  onAutoQuestionConsumed,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processedAutoIds = useRef(new Set<string>());

  const runQuestion = useCallback(
    async (question: string, node_name?: string, node_summary?: string) => {
      setError(null);
      setMessages((m) => [...m, { role: "user", content: question }]);
      setLoading(true);
      try {
        const { answer } = await sendChat({
          doc_id: docId,
          question,
          node_name,
          node_summary,
        });
        setMessages((m) => [...m, { role: "assistant", content: answer }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "请求失败";
        setError(msg);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `（错误）${msg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [docId]
  );

  useEffect(() => {
    if (!open || !autoQuestion) return;
    if (processedAutoIds.current.has(autoQuestion.id)) return;
    processedAutoIds.current.add(autoQuestion.id);
    void (async () => {
      try {
        await runQuestion(
          autoQuestion.question,
          autoQuestion.node_name,
          autoQuestion.node_summary
        );
      } finally {
        onAutoQuestionConsumed();
      }
    })();
  }, [open, autoQuestion, runQuestion, onAutoQuestionConsumed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    void runQuestion(q);
  };

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="pointer-events-auto fixed bottom-6 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/40 bg-black/60 text-lg text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur-md transition hover:bg-cyan-500/20 md:bottom-auto md:top-20"
        aria-expanded={open}
        aria-label={open ? "收起对话" : "打开对话"}
      >
        💬
      </button>

      {open && (
        <div className="pointer-events-auto fixed inset-y-0 right-0 z-30 flex w-[min(100vw,380px)] flex-col border-l border-white/10 bg-black/50 backdrop-blur-xl md:top-0">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold tracking-wide text-cyan-100">
              星系对话
            </h3>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              收起
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.length === 0 && (
              <p className="text-white/50">
                点击图谱节点可自动发起解读；也可在此直接提问。
                {!docId && (
                  <span className="mt-2 block text-amber-200/80">
                    当前为演示数据，上传 PDF 后回答将基于文档内容。
                  </span>
                )}
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={`max-w-[95%] rounded-2xl px-3 py-2 leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-cyan-500/20 text-cyan-50"
                    : "mr-auto border border-white/10 bg-white/5 text-slate-100"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <p className="text-xs text-cyan-300/80">思考中…</p>
            )}
            {error && (
              <p className="text-xs text-rose-300/90">{error}</p>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 p-3"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入问题…"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-50 disabled:opacity-40"
              >
                发送
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
