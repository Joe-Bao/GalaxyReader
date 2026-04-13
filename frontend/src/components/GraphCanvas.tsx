"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ForceGraphMethods } from "react-force-graph-3d";
import type { GraphData, GraphNode } from "@/lib/types";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black text-sm text-cyan-200/80">
      Starting 3D engine…
    </div>
  ),
});

const GROUP_COLORS: Record<string, string> = {
  company: "#38bdf8",
  finance: "#a78bfa",
  product: "#f472b6",
  risk: "#fb7185",
  region: "#34d399",
  tech: "#22d3ee",
  default: "#94a3b8",
};

function colorForGroup(group: string): string {
  return GROUP_COLORS[group] ?? GROUP_COLORS.default;
}

export interface GraphCanvasProps {
  graphData: GraphData;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick?: () => void;
}

export function GraphCanvas({
  graphData,
  onNodeClick,
  onBackgroundClick,
}: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dims, setDims] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const w = Math.max(0, Math.floor(el.clientWidth));
      const h = Math.max(0, Math.floor(el.clientHeight));
      setDims((prev) =>
        prev.width === w && prev.height === h ? prev : { width: w, height: h }
      );
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(measure);
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    measure();

    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const data = useMemo(
    () => ({
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.links.map((l) => ({ ...l })),
    }),
    [graphData]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      fgRef.current?.zoomToFit?.(400, 80);
    }, 500);
    return () => window.clearTimeout(t);
  }, [data]);

  const nodeThreeObject = useCallback((node: object) => {
    const n = node as GraphNode;
    const color = colorForGroup(n.group ?? "default");
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(6, 24, 24),
      new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color),
        emissiveIntensity: 1.35,
        metalness: 0.35,
        roughness: 0.25,
      })
    );
    group.add(core);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(10, 20, 20),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      })
    );
    group.add(halo);
    return group;
  }, []);

  const handleNodeClick = useCallback(
    (node: object) => {
      onNodeClick(node as GraphNode);
    },
    [onNodeClick]
  );

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 min-h-0 min-w-0 overflow-hidden"
    >
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        backgroundColor="#000000"
        width={dims.width}
        height={dims.height}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeLabel={(n: object) => (n as GraphNode).name}
        linkLabel="label"
        nodeThreeObject={nodeThreeObject}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.2}
        linkDirectionalParticleSpeed={0.006}
        linkWidth={0.6}
        linkColor={() => "rgba(148, 163, 184, 0.45)"}
        linkOpacity={0.85}
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => onBackgroundClick?.()}
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.35}
        showNavInfo={false}
      />
    </div>
  );
}
