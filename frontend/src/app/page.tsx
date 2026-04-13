"use client";

import { useCallback, useEffect, useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodePanel } from "@/components/NodePanel";
import { FileUpload } from "@/components/FileUpload";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ChatBox,
  type ChatAutoQuestion,
} from "@/components/ChatBox";
import { uploadPdf } from "@/lib/api";
import type { GraphData, GraphNode } from "@/lib/types";

const MOCK_PATH = "/mock-graph.json";

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState<ChatAutoQuestion | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(MOCK_PATH);
        if (!res.ok) throw new Error("Could not load demo graph");
        const data = (await res.json()) as GraphData;
        if (!cancelled) setGraphData(data);
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setChatOpen(true);
    setAutoQuestion({
      id: `${node.id}-${Date.now()}`,
      question: `In the document, what does "${node.name}" refer to? Explain in detail.`,
      node_name: node.name,
      node_summary: node.summary,
    });
  }, []);

  const clearAutoQuestion = useCallback(() => setAutoQuestion(null), []);

  const handleBackground = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleUpload = async (file: File) => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await uploadPdf(file);
      setGraphData({ nodes: res.nodes, links: res.links });
      setDocId(res.doc_id);
      setSelectedNode(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {loadError && (
        <div className="pointer-events-auto absolute left-1/2 top-24 z-50 max-w-md -translate-x-1/2 rounded-xl border border-rose-500/40 bg-rose-950/90 px-4 py-2 text-center text-sm text-rose-100">
          {loadError}
        </div>
      )}

      {graphData && (
        <GraphCanvas
          graphData={graphData}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackground}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-6">
        <header className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-xl font-bold tracking-tight text-transparent md:text-2xl">
              GalaxyReader
            </h1>
            <p className="text-[11px] text-white/45 md:text-xs">
              Infinite 3D RAG · knowledge galaxy
            </p>
          </div>
          <FileUpload disabled={loading} onFile={handleUpload} />
        </header>

        <NodePanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />

        <footer className="text-center text-[10px] text-white/40 md:text-xs">
          Drag to rotate · scroll to zoom · click a node for details and chat
        </footer>
      </div>

      {loading && <LoadingScreen />}

      <ChatBox
        open={chatOpen}
        onToggle={() => setChatOpen((o) => !o)}
        docId={docId}
        autoQuestion={autoQuestion}
        onAutoQuestionConsumed={clearAutoQuestion}
      />
    </div>
  );
}
