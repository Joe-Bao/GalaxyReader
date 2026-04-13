"use client";

interface FileUploadProps {
  disabled?: boolean;
  onFile: (file: File) => void;
}

export function FileUpload({ disabled, onFile }: FileUploadProps) {
  return (
    <label className="pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-violet-500/15 px-4 py-2 text-sm font-medium text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition hover:border-cyan-300/60 hover:from-cyan-500/30 hover:to-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50">
      <span aria-hidden>📄</span>
      Upload PDF
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
