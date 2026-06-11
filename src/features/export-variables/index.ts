import type { ExportVariablesResult } from "../../shared/types";
import { buildCollectionModeTokens } from "./build-tokens";
import { toCollectionDirName, toModeFileName } from "./format";

export async function runExportVariables(): Promise<ExportVariablesResult> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  if (collections.length === 0) {
    throw new Error("No local variable collections found.");
  }

  const allVariables = await figma.variables.getLocalVariablesAsync();
  const collectionsById = new Map(collections.map((collection) => [collection.id, collection]));
  const files: ExportVariablesResult["files"] = [];

  for (const collection of [...collections].sort((a, b) => a.name.localeCompare(b.name))) {
    const dirName = toCollectionDirName(collection.name);
    const hasMultipleModes = collection.modes.length > 1;

    for (const mode of collection.modes) {
      const tokens = await buildCollectionModeTokens(
        collection,
        mode.modeId,
        mode.name,
        allVariables,
        collectionsById
      );

      const fileName = hasMultipleModes
        ? `${toModeFileName(mode.name)}.tokens.json`
        : "tokens.json";

      files.push({
        path: `${dirName}/${fileName}`,
        content: `${JSON.stringify(tokens, null, 2)}\n`,
      });
    }
  }

  return {
    fileCount: files.length,
    collectionCount: collections.length,
    files,
  };
}
