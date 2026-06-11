import { strToU8, zipSync } from "fflate";
import type { PluginMessage, UIMessage } from "../shared/messages";
import type { CollectionSummary, ExportFileEntry, SelectionSummary } from "../shared/types";

type ActiveTab = "document-variables" | "export-variables";

const collectionSelect = document.getElementById(
  "collection-select"
) as HTMLSelectElement;
const modeField = document.getElementById("mode-field") as HTMLDivElement;
const modeSelect = document.getElementById("mode-select") as HTMLSelectElement;
const selectionStatus = document.getElementById(
  "selection-status"
) as HTMLDivElement;
const feedback = document.getElementById("feedback") as HTMLParagraphElement;
const exportFeedback = document.getElementById(
  "export-feedback"
) as HTMLParagraphElement;
const runButton = document.getElementById("run-button") as HTMLButtonElement;
const tabs = [...document.querySelectorAll<HTMLButtonElement>(".tab")];
const panels = {
  "document-variables": document.getElementById(
    "panel-document-variables"
  ) as HTMLElement,
  "export-variables": document.getElementById(
    "panel-export-variables"
  ) as HTMLElement,
};

let collections: CollectionSummary[] = [];
let selection: SelectionSummary = {
  valid: false,
  message: "Select a component, component set, or instance on the canvas",
};
let activeTab: ActiveTab = "export-variables";
let isRunning = false;

function postMessage(message: UIMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function setFeedback(
  element: HTMLElement,
  text: string,
  type: "default" | "error" | "success" = "default"
): void {
  element.textContent = text;
  element.className = `feedback${type === "default" ? "" : ` ${type}`}`;
}

function updateSelectionUI(): void {
  selectionStatus.className = `status ${selection.valid ? "valid" : "invalid"}`;
  selectionStatus.innerHTML = selection.valid
    ? `<strong>${selection.componentName ?? selection.message}</strong>`
    : `<strong>${selection.message}</strong>`;

  updateRunButton();
}

function getSelectedCollection(): CollectionSummary | undefined {
  return collections.find((collection) => collection.id === collectionSelect.value);
}

function populateModeSelect(collection: CollectionSummary | undefined): void {
  modeSelect.innerHTML = "";

  if (!collection) {
    modeField.hidden = true;
    modeSelect.disabled = true;
    modeSelect.innerHTML = `<option value="">Select a collection first</option>`;
    return;
  }

  const hasMultipleModes = collection.modes.length > 1;
  modeField.hidden = !hasMultipleModes;

  for (const mode of collection.modes) {
    const option = document.createElement("option");
    option.value = mode.modeId;
    option.textContent = mode.name;
    modeSelect.appendChild(option);
  }

  modeSelect.value = collection.defaultModeId;
  modeSelect.disabled = !hasMultipleModes;
}

function populateCollectionSelect(): void {
  collectionSelect.innerHTML = "";

  if (collections.length === 0) {
    collectionSelect.innerHTML =
      `<option value="">No local variable collections found</option>`;
    collectionSelect.disabled = true;
    populateModeSelect(undefined);
    updateRunButton();
    return;
  }

  collectionSelect.disabled = false;

  for (const collection of collections) {
    const option = document.createElement("option");
    option.value = collection.id;
    option.textContent = `${collection.name} (${collection.variableCount})`;
    collectionSelect.appendChild(option);
  }

  populateModeSelect(collections[0]);
  updateRunButton();
}

function updateRunButton(): void {
  if (isRunning) {
    runButton.disabled = true;
    return;
  }

  if (activeTab === "export-variables") {
    runButton.textContent = "Export variables";
    runButton.disabled = collections.length === 0;
    return;
  }

  runButton.textContent = "Generate instances";
  const hasCollection = collections.length > 0 && collectionSelect.value !== "";
  runButton.disabled = !(selection.valid && hasCollection);
}

function setActiveTab(tabId: ActiveTab): void {
  activeTab = tabId;

  for (const tab of tabs) {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  }

  for (const [id, panel] of Object.entries(panels)) {
    const isActive = id === tabId;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  }

  updateRunButton();
}

function downloadZip(files: ExportFileEntry[]): void {
  const archive: Record<string, Uint8Array> = {};

  for (const file of files) {
    archive[file.path] = strToU8(file.content);
  }

  const zipped = zipSync(archive);
  const blob = new Blob([zipped], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "figma.zip";
  link.click();
  URL.revokeObjectURL(url);
}

function runDocumentVariables(): void {
  const collection = getSelectedCollection();
  if (!collection || !selection.valid) {
    return;
  }

  isRunning = true;
  updateRunButton();
  setFeedback(feedback, "Creating instances...");

  postMessage({
    type: "run-document-variables",
    config: {
      collectionId: collection.id,
      modeId: modeSelect.value || collection.defaultModeId,
    },
  });
}

function runExportVariables(): void {
  if (collections.length === 0) {
    return;
  }

  isRunning = true;
  updateRunButton();
  setFeedback(exportFeedback, "Exporting variables...");

  postMessage({ type: "export-variables" });
}

collectionSelect.addEventListener("change", () => {
  populateModeSelect(getSelectedCollection());
  setFeedback(feedback, "");
  updateRunButton();
});

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    const tabId = tab.dataset.tab as ActiveTab | undefined;
    if (!tabId) {
      return;
    }
    setActiveTab(tabId);
  });
}

runButton.addEventListener("click", () => {
  if (activeTab === "export-variables") {
    runExportVariables();
    return;
  }

  runDocumentVariables();
});

window.onmessage = (event: MessageEvent) => {
  const message = event.data.pluginMessage as PluginMessage | undefined;
  if (!message) {
    return;
  }

  switch (message.type) {
    case "collections":
      collections = message.collections;
      populateCollectionSelect();
      break;

    case "selection":
      selection = message.selection;
      updateSelectionUI();
      break;

    case "document-variables-success":
      isRunning = false;
      setFeedback(
        feedback,
        `Created ${message.result.instanceCount} instances in "${message.result.frameName}".`,
        "success"
      );
      updateRunButton();
      break;

    case "export-variables-success":
      isRunning = false;
      downloadZip(message.result.files);
      setFeedback(
        exportFeedback,
        `Exported ${message.result.fileCount} files from ${message.result.collectionCount} collections.`,
        "success"
      );
      updateRunButton();
      break;

    case "error":
      isRunning = false;
      if (activeTab === "export-variables") {
        setFeedback(exportFeedback, message.message, "error");
      } else {
        setFeedback(feedback, message.message, "error");
      }
      updateRunButton();
      break;
  }
};

const layerMappingInfo = document.getElementById(
  "layer-mapping-info"
) as HTMLButtonElement;
const layerMappingTooltip = document.getElementById(
  "layer-mapping-tooltip"
) as HTMLDivElement;

function setLayerMappingTooltipOpen(open: boolean): void {
  layerMappingTooltip.hidden = !open;
  layerMappingInfo.setAttribute("aria-expanded", String(open));
}

layerMappingInfo.addEventListener("click", (event) => {
  event.stopPropagation();
  setLayerMappingTooltipOpen(layerMappingTooltip.hidden);
});

document.addEventListener("click", () => {
  setLayerMappingTooltipOpen(false);
});

layerMappingTooltip.addEventListener("click", (event) => {
  event.stopPropagation();
});

postMessage({ type: "init" });
