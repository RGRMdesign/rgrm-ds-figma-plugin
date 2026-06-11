import type {
  CollectionSummary,
  DocumentVariablesConfig,
  DocumentVariablesResult,
  ExportVariablesResult,
  SelectionSummary,
} from "./types";

export type UIMessage =
  | { type: "init" }
  | { type: "run-document-variables"; config: DocumentVariablesConfig }
  | { type: "export-variables" }
  | { type: "resize"; width: number; height: number };

export type PluginMessage =
  | { type: "collections"; collections: CollectionSummary[] }
  | { type: "selection"; selection: SelectionSummary }
  | { type: "document-variables-success"; result: DocumentVariablesResult }
  | { type: "export-variables-success"; result: ExportVariablesResult }
  | { type: "error"; message: string };
