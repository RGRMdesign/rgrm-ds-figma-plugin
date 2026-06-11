import { runDocumentVariables } from "./features/document-variables";
import { runExportVariables } from "./features/export-variables";
import { getTemplateDisplayName } from "./features/document-variables/template";
import type { PluginMessage, UIMessage } from "./shared/messages";
import type { CollectionSummary, SelectionSummary } from "./shared/types";

figma.showUI(__html__, { width: 360, height: 520, themeColors: true });

function postToUI(message: PluginMessage): void {
  figma.ui.postMessage(message);
}

async function getCollections(): Promise<CollectionSummary[]> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  return collections
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      variableCount: collection.variableIds.length,
      modes: collection.modes.map((mode) => ({
        modeId: mode.modeId,
        name: mode.name,
      })),
      defaultModeId: collection.defaultModeId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getSelectionSummary(): Promise<SelectionSummary> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    return {
      valid: false,
      message: "Select a component, component set, or instance on the canvas",
    };
  }

  if (selection.length > 1) {
    return {
      valid: false,
      message: "Select exactly one component or instance.",
    };
  }

  const node = selection[0];
  const templateName = await getTemplateDisplayName(node);

  if (templateName) {
    return {
      valid: true,
      componentName: templateName,
      message: templateName,
    };
  }

  if (node.type === "COMPONENT_SET") {
    return {
      valid: false,
      message: "Component set must have a type variant (STRING, COLOR, BOOLEAN, FLOAT).",
    };
  }

  return {
    valid: false,
    message: "Select a component, component set, or instance.",
  };
}

async function sendInitData(): Promise<void> {
  postToUI({
    type: "collections",
    collections: await getCollections(),
  });
  postToUI({
    type: "selection",
    selection: await getSelectionSummary(),
  });
}

async function postSelectionUpdate(): Promise<void> {
  postToUI({
    type: "selection",
    selection: await getSelectionSummary(),
  });
}

figma.on("selectionchange", () => {
  void postSelectionUpdate();
});

figma.ui.onmessage = async (message: UIMessage) => {
  try {
    switch (message.type) {
      case "init":
        await sendInitData();
        break;

      case "resize":
        figma.ui.resize(message.width, message.height);
        break;

      case "run-document-variables": {
        const result = await runDocumentVariables(message.config);
        postToUI({
          type: "document-variables-success",
          result,
        });
        break;
      }

      case "export-variables": {
        const result = await runExportVariables();
        postToUI({
          type: "export-variables-success",
          result,
        });
        break;
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    postToUI({ type: "error", message: errorMessage });
  }
};

void sendInitData();
