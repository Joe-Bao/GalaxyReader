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
}

export interface ChatResponse {
  answer: string;
}
