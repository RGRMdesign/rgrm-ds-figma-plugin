export type PluginOption = "document-variables" | "export-variables";

export interface CollectionSummary {
  id: string;
  name: string;
  variableCount: number;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
}

export interface SelectionSummary {
  valid: boolean;
  componentName?: string;
  message: string;
}

export interface DocumentVariablesConfig {
  collectionId: string;
  modeId: string;
}

export interface DocumentVariablesResult {
  instanceCount: number;
  frameName: string;
}

export interface ExportFileEntry {
  path: string;
  content: string;
}

export interface ExportVariablesResult {
  fileCount: number;
  collectionCount: number;
  files: ExportFileEntry[];
}
