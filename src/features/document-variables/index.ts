import type { DocumentVariablesConfig, DocumentVariablesResult } from "../../shared/types";
import { fillInstanceLayers } from "./fill-layers";
import { createTemplateInstance, resolveTemplate } from "./template";

const INSTANCE_SPACING = 16;

export async function runDocumentVariables(
  config: DocumentVariablesConfig
): Promise<DocumentVariablesResult> {
  const selection = figma.currentPage.selection;
  const template = await resolveTemplate(selection);

  if (!template) {
    throw new Error(
      "Select a component, component set with a type variant, or instance as the template."
    );
  }

  const collection = await figma.variables.getVariableCollectionByIdAsync(
    config.collectionId
  );

  if (!collection) {
    throw new Error("Variable collection not found.");
  }

  const mode = collection.modes.find((item) => item.modeId === config.modeId);
  if (!mode) {
    throw new Error("Selected mode not found in the collection.");
  }

  const variables = (
    await Promise.all(
      collection.variableIds.map((id) => figma.variables.getVariableByIdAsync(id))
    )
  ).filter((variable): variable is Variable => variable !== null);

  if (variables.length === 0) {
    throw new Error("The selected collection contains no variables.");
  }

  variables.sort((a, b) => a.name.localeCompare(b.name));

  const frame = figma.createFrame();
  frame.name = `${collection.name} — Document Variables`;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = INSTANCE_SPACING;
  frame.paddingTop = 0;
  frame.paddingRight = 0;
  frame.paddingBottom = 0;
  frame.paddingLeft = 0;
  frame.fills = [];

  const { anchor } = template;
  const parent = anchor.parent;
  if (parent && "appendChild" in parent) {
    parent.appendChild(frame);
    frame.x = anchor.x + anchor.width + 80;
    frame.y = anchor.y;
  } else {
    figma.currentPage.appendChild(frame);
    frame.x = anchor.x;
    frame.y = anchor.y + anchor.height + 80;
  }

  frame.setExplicitVariableModeForCollection(collection, config.modeId);

  const instances: InstanceNode[] = [];

  for (const variable of variables) {
    const instance = createTemplateInstance(template, variable);
    instance.name = variable.name;
    frame.appendChild(instance);

    await fillInstanceLayers(
      instance,
      variable,
      collection,
      config.modeId,
      collection.name
    );

    instances.push(instance);
  }

  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame, ...instances]);

  return {
    instanceCount: instances.length,
    frameName: frame.name,
  };
}
