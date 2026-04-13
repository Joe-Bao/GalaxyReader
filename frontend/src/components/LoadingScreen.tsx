"use client";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Parsing document and building the knowledge galaxy…",
}: LoadingScreenProps) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="relative h-40 w-40">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30" />
        <div className="absolute inset-2 animate-spin rounded-full border-t-2 border-cyan-400" />
        <div
          className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-500/40 to-violet-600/30 blur-xl"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          ✦
        </div>
      </div>
      <p className="mt-8 max-w-sm text-center text-sm text-cyan-100/90">{message}</p>
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="galaxy-shimmer-bar h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      </div>
    </div>
  );
}
