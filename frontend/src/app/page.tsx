"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Group,
  Panel,
  Separator,
  useGroupRef,
  usePanelRef,
} from "react-resizable-panels";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodePanel } from "@/components/NodePanel";
import { FileUpload } from "@/components/FileUpload";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ChatBox,
  type ChatAutoQuestion,
  type ChatBoxHandle,
} from "@/components/ChatBox";
import { SourcePanel } from "@/components/SourcePanel";
import { SettingsModal } from "@/components/SettingsModal";
import { summarizeRelevant, uploadPdf } from "@/lib/api";
import { normalizeAssistantMarkdown } from "@/lib/formatGeminiOutput";
import {
  DEFAULT_GEMINI_MODEL,
  readStoredGeminiModel,
  writeStoredGeminiModel,
} from "@/lib/model-settings";
import { extractSourceKeywords } from "@/lib/sourceKeywords";
import type { GraphData, GraphNode } from "@/lib/types";

const MOCK_PATH = "/mock-graph.json";

const EQUAL_THIRDS = { raw: 33.34, galaxy: 33.33, chat: 33.33 };
const PANEL_KEYS = ["raw", "galaxy", "chat"] as const;
type PanelKey = (typeof PANEL_KEYS)[number];
type TriLayout = Record<PanelKey, number>;

function PanelActions({
  onExpand,
  onHide,
  expandLabel,
  hideLabel,
}: {
  onExpand: () => void;
  onHide: () => void;
  expandLabel: string;
  hideLabel: string;
}) {
  const base =
    "pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 bg-black/45 text-xs text-white/85 transition hover:bg-white/15";
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1">
      <button
        type="button"
        title={expandLabel}
        aria-label={expandLabel}
        onClick={onExpand}
        className={base}
      >
        ⤢
      </button>
      <button
        type="button"
        title={hideLabel}
        aria-label={hideLabel}
        onClick={onHide}
        className={base}
      >
        ✕
      </button>
    </div>
  );
}

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [chatPrefill, setChatPrefill] = useState<ChatAutoQuestion | null>(null);
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summarizeBusy, setSummarizeBusy] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal"
  );

  const chatRef = useRef<ChatBoxHandle>(null);
  const groupRef = useGroupRef();
  const rawPanelRef = usePanelRef();
  const galaxyPanelRef = usePanelRef();
  const chatPanelRef = usePanelRef();
  /** Panels the user chose to hide (survives stale getPanelState between rapid clicks). */
  const hiddenPanelsRef = useRef<Set<PanelKey>>(new Set());
  /** Mirrors ref for UI (overflow clipping); avoids scrollbars from collapsed column content. */
  const [hiddenUi, setHiddenUi] = useState<Record<PanelKey, boolean>>({
    raw: false,
    galaxy: false,
    chat: false,
  });

  const syncHiddenUiFromRef = useCallback(() => {
    setHiddenUi({
      raw: hiddenPanelsRef.current.has("raw"),
      galaxy: hiddenPanelsRef.current.has("galaxy"),
      chat: hiddenPanelsRef.current.has("chat"),
    });
  }, []);

  useEffect(() => {
    setGeminiModel(readStoredGeminiModel());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () =>
      setOrientation(mq.matches ? "vertical" : "horizontal");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      setChatPrefill({
        id: `${node.id}-${Date.now()}`,
        question: `In the document, what does "${node.name}" refer to? Explain in detail.`,
        node_name: node.name,
        node_summary: node.summary,
      });
    },
    []
  );

  const clearChatPrefill = useCallback(() => setChatPrefill(null), []);

  const handleBackground = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleUpload = async (file: File) => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await uploadPdf(file, geminiModel);
      setGraphData({ nodes: res.nodes, links: res.links });
      setDocId(res.doc_id);
      setSelectedNode(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeToChat = useCallback(async () => {
    if (!docId || !selectedNode) return;
    setSummarizeError(null);
    setSummarizeBusy(true);
    try {
      const kws = extractSourceKeywords(selectedNode);
      const { summary } = await summarizeRelevant({
        doc_id: docId,
        node_name: selectedNode.name,
        node_summary: selectedNode.summary,
        keywords: kws.slice(1),
        gemini_model: geminiModel.trim() || undefined,
      });
      chatRef.current?.appendAiSummary({
        nodeName: selectedNode.name,
        body: normalizeAssistantMarkdown(summary),
      });
    } catch (e) {
      setSummarizeError(
        e instanceof Error ? e.message : "Summarize request failed"
      );
    } finally {
      setSummarizeBusy(false);
    }
  }, [docId, selectedNode, geminiModel]);

  const applyTriLayout = useCallback((layout: TriLayout) => {
    // Synchronous: avoids reading stale getPanelState() when two hides fire in one frame.
    groupRef.current?.setLayout(layout);
  }, [groupRef]);

  const getPanelState = useCallback(() => {
    const toPercent = (
      size:
        | number
        | {
            asPercentage: number;
            inPixels: number;
          }
        | undefined
    ) => (typeof size === "number" ? size : (size?.asPercentage ?? 0));
    const rawSize = toPercent(rawPanelRef.current?.getSize());
    const galaxySize = toPercent(galaxyPanelRef.current?.getSize());
    const chatSize = toPercent(chatPanelRef.current?.getSize());
    const rawCollapsed = rawPanelRef.current?.isCollapsed() ?? rawSize <= 0;
    const galaxyCollapsed =
      galaxyPanelRef.current?.isCollapsed() ?? galaxySize <= 0;
    const chatCollapsed = chatPanelRef.current?.isCollapsed() ?? chatSize <= 0;
    const state: Record<PanelKey, { visible: boolean; size: number }> = {
      raw: {
        visible: !rawCollapsed,
        size: rawSize,
      },
      galaxy: {
        visible: !galaxyCollapsed,
        size: galaxySize,
      },
      chat: {
        visible: !chatCollapsed,
        size: chatSize,
      },
    };
    return state;
  }, [rawPanelRef, galaxyPanelRef, chatPanelRef]);

  const layoutFromWeights = useCallback((weights: Partial<TriLayout>): TriLayout => {
    const positive = PANEL_KEYS.filter((k) => (weights[k] ?? 0) > 0);
    if (positive.length === 0) {
      return { raw: 0, galaxy: 100, chat: 0 };
    }
    const sum = positive.reduce((acc, key) => acc + (weights[key] ?? 0), 0);
    if (sum <= 0) {
      const even = 100 / positive.length;
      const evenLayout: TriLayout = { raw: 0, galaxy: 0, chat: 0 };
      for (const key of positive) evenLayout[key] = even;
      return evenLayout;
    }
    const normalized: TriLayout = { raw: 0, galaxy: 0, chat: 0 };
    for (const key of positive) {
      normalized[key] = ((weights[key] ?? 0) / sum) * 100;
    }
    return normalized;
  }, []);

  const hidePanelSmart = useCallback(
    (target: PanelKey) => {
      try {
        hiddenPanelsRef.current.add(target);
        let visible = PANEL_KEYS.filter((k) => !hiddenPanelsRef.current.has(k));
        // Galaxy is the base layer: never leave zero visible panels.
        if (visible.length === 0) {
          hiddenPanelsRef.current = new Set(["raw", "chat"]);
          visible = ["galaxy"];
        }

        if (visible.length === 1) {
          const only = visible[0];
          applyTriLayout({
            raw: only === "raw" ? 100 : 0,
            galaxy: only === "galaxy" ? 100 : 0,
            chat: only === "chat" ? 100 : 0,
          });
          return;
        }

        const state = getPanelState();
        const weights: Partial<TriLayout> = {};
        for (const key of visible) weights[key] = state[key].size;
        applyTriLayout(layoutFromWeights(weights));
      } finally {
        syncHiddenUiFromRef();
      }
    },
    [applyTriLayout, getPanelState, layoutFromWeights, syncHiddenUiFromRef]
  );

  const expandPanelSmart = useCallback(
    (target: PanelKey) => {
      try {
        hiddenPanelsRef.current.delete(target);
        const state = getPanelState();
        const visible = PANEL_KEYS.filter((k) => !hiddenPanelsRef.current.has(k));
        const nextVisible = visible.includes(target)
          ? visible
          : [...visible, target];
        if (nextVisible.length === 0) {
          applyTriLayout({ raw: 0, galaxy: 100, chat: 0 });
          return;
        }
        if (nextVisible.length === 1) {
          applyTriLayout({
            raw: target === "raw" ? 100 : 0,
            galaxy: target === "galaxy" ? 100 : 0,
            chat: target === "chat" ? 100 : 0,
          });
          return;
        }

        const targetSize = nextVisible.length === 2 ? 68 : 56;
        const others = nextVisible.filter((k) => k !== target);
        const othersCurrentSum = others.reduce(
          (acc, key) => acc + Math.max(state[key].size, 0),
          0
        );
        const remaining = 100 - targetSize;
        const weights: Partial<TriLayout> = { [target]: targetSize };

        if (othersCurrentSum > 0) {
          for (const key of others) {
            weights[key] =
              (Math.max(state[key].size, 0) / othersCurrentSum) * remaining;
          }
        } else {
          const even = remaining / others.length;
          for (const key of others) weights[key] = even;
        }
        applyTriLayout(layoutFromWeights(weights));
      } finally {
        syncHiddenUiFromRef();
      }
    },
    [applyTriLayout, getPanelState, layoutFromWeights, syncHiddenUiFromRef]
  );

  const resetPanels = useCallback(() => {
    hiddenPanelsRef.current.clear();
    rawPanelRef.current?.expand();
    galaxyPanelRef.current?.expand();
    chatPanelRef.current?.expand();
    groupRef.current?.setLayout(EQUAL_THIRDS);
    syncHiddenUiFromRef();
  }, [groupRef, syncHiddenUiFromRef]);

  const sepClass =
    orientation === "horizontal"
      ? "w-2 min-w-0 shrink-0 bg-white/10 hover:bg-cyan-500/25 data-[separator=active]:bg-cyan-500/40"
      : "h-2 min-h-0 shrink-0 bg-white/10 hover:bg-cyan-500/25 data-[separator=active]:bg-cyan-500/40";

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-black text-white">
      {loadError && (
        <div className="pointer-events-auto absolute left-1/2 top-20 z-50 max-w-md -translate-x-1/2 rounded-xl border border-rose-500/40 bg-rose-950/90 px-4 py-2 text-center text-sm text-rose-100">
          {loadError}
        </div>
      )}

      <header className="pointer-events-auto z-20 shrink-0 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 md:px-4">
          <div className="min-w-0">
            <h1 className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-lg font-bold tracking-tight text-transparent md:text-xl">
              GalaxyReader
            </h1>
            <p className="truncate font-mono text-[10px] text-cyan-500/50 md:text-[11px]">
              model: {geminiModel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="Reset all panels to equal thirds"
              onClick={resetPanels}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-sm text-white/80 hover:bg-white/10"
              aria-label="Reset layout"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] text-white/80 hover:bg-white/10 md:text-xs"
            >
              Settings
            </button>
            <FileUpload disabled={loading} onFile={handleUpload} />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {graphData ? (
          <Group
            key={orientation}
            id="galaxy-reader-tri"
            orientation={orientation}
            groupRef={groupRef}
            defaultLayout={EQUAL_THIRDS}
            className="h-full min-h-0 overflow-hidden"
          >
            <Panel
              id="raw"
              panelRef={rawPanelRef}
              collapsible
              collapsedSize="0%"
              defaultSize="33.34%"
              minSize="0%"
              maxSize="100%"
              className={`min-h-0 min-w-0 ${hiddenUi.raw ? "overflow-hidden" : ""}`}
            >
              <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
                <PanelActions
                  onExpand={() => expandPanelSmart("raw")}
                  onHide={() => hidePanelSmart("raw")}
                  expandLabel="Expand Raw in current layout"
                  hideLabel="Hide Raw"
                />
                <SourcePanel
                  docId={docId}
                  focusNode={selectedNode}
                  summarizeBusy={summarizeBusy}
                  summarizeError={summarizeError}
                  onSummarizeToChat={handleSummarizeToChat}
                />
              </div>
            </Panel>
            <Separator className={sepClass} />
            <Panel
              id="galaxy"
              panelRef={galaxyPanelRef}
              collapsible
              collapsedSize="0%"
              defaultSize="33.33%"
              minSize="0%"
              maxSize="100%"
              className={`min-h-0 min-w-0 bg-black ${hiddenUi.galaxy ? "overflow-hidden" : ""}`}
            >
              <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
                <PanelActions
                  onExpand={() => expandPanelSmart("galaxy")}
                  onHide={() => hidePanelSmart("galaxy")}
                  expandLabel="Expand Galaxy in current layout"
                  hideLabel="Hide Galaxy"
                />
                <GraphCanvas
                  graphData={graphData}
                  onNodeClick={handleNodeClick}
                  onBackgroundClick={handleBackground}
                />
                <NodePanel
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                />
              </div>
            </Panel>
            <Separator className={sepClass} />
            <Panel
              id="chat"
              panelRef={chatPanelRef}
              collapsible
              collapsedSize="0%"
              defaultSize="33.33%"
              minSize="0%"
              maxSize="100%"
              className={`min-h-0 min-w-0 ${hiddenUi.chat ? "overflow-hidden" : ""}`}
            >
              <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
                <PanelActions
                  onExpand={() => expandPanelSmart("chat")}
                  onHide={() => hidePanelSmart("chat")}
                  expandLabel="Expand Chat"
                  hideLabel="Hide Chat"
                />
                <ChatBox
                  ref={chatRef}
                  docId={docId}
                  geminiModel={geminiModel}
                  chatPrefill={chatPrefill}
                  onChatPrefillConsumed={clearChatPrefill}
                />
              </div>
            </Panel>
          </Group>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/50">
            Loading graph…
          </div>
        )}
      </div>

      {loading && <LoadingScreen />}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        geminiModel={geminiModel}
        onApply={(id) => {
          writeStoredGeminiModel(id);
          setGeminiModel(id.trim() || DEFAULT_GEMINI_MODEL);
        }}
      />
    </div>
  );
}
