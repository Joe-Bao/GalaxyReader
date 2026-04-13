export interface GraphNode {
  id: string;
  name: string;
  group: string;
  summary: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface UploadResponse {
  nodes: GraphNode[];
  links: GraphLink[];
  doc_id: string;
}

export interface ChatRequest {
  doc_id: string | null;
  question: string;
  node_name?: string;
  node_summary?: string;
  /** When set, overrides server ``GEMINI_MODEL`` for this request. */
  gemini_model?: string;
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

export interface GeminiModelsResponse {
  models: GeminiModelInfo[];
}

export interface ChatResponse {
  answer: string;
}

export interface DocumentTextResponse {
  text: string;
}

export interface SummarizeRequest {
  doc_id: string;
  node_name?: string;
  node_summary?: string;
  keywords?: string[];
  gemini_model?: string;
}

export interface SummarizeResponse {
  summary: string;
}
