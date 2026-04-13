"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeAssistantMarkdown } from "@/lib/formatGeminiOutput";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className = "" }: ChatMarkdownProps) {
  const text = normalizeAssistantMarkdown(content);

  return (
    <div className={`text-[13px] leading-relaxed text-slate-100 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 text-slate-100/95">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-4 text-slate-100/95">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-4 text-slate-100/95">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-slate-100/95">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-cyan-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-cyan-300 underline decoration-cyan-500/50 hover:text-cyan-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="mb-2 mt-3 text-base font-semibold text-white first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3 text-[15px] font-semibold text-cyan-50 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 text-sm font-semibold text-cyan-100/90">
              {children}
            </h3>
          ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[12px] text-slate-200">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className || "");
            return (
              <code
                className={
                  isBlock
                    ? `block font-mono text-[12px] text-slate-200 ${className ?? ""}`
                    : "rounded bg-white/10 px-1 py-0.5 font-mono text-[12px] text-cyan-100"
                }
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-cyan-500/50 pl-3 text-slate-300/95 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-white/10" />,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-[12px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/20 bg-white/5">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-white/10 px-2 py-1 font-semibold text-cyan-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-white/10 px-2 py-1 text-slate-200">
              {children}
            </td>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
