import {
  formatVariableValue,
  getAliasReference,
  resolveVariableForConsumer,
} from "./resolve-value";

export interface FillContext {
  variable: Variable;
  collectionName: string;
  resolvedValue: VariableValue;
  resolvedType: VariableResolvedDataType;
  aliasReference: string;
  aliasCollectionName: string;
}

type LayerKey =
  | "name"
  | "value"
  | "alias"
  | "reference"
  | "alias-collection"
  | "reference-collection"
  | "type"
  | "description"
  | "collection";

const LAYER_KEYS: LayerKey[] = [
  "name",
  "value",
  "alias",
  "reference",
  "alias-collection",
  "reference-collection",
  "type",
  "description",
  "collection",
];

function getLayerKey(nodeName: string): LayerKey | null {
  const normalized = nodeName.trim().toLowerCase();

  if (LAYER_KEYS.includes(normalized as LayerKey)) {
    return normalized as LayerKey;
  }

  return null;
}

function getTextForLayer(key: LayerKey, ctx: FillContext): string {
  switch (key) {
    case "name":
      return ctx.variable.name;
    case "value":
      return formatVariableValue(ctx.resolvedValue, ctx.resolvedType);
    case "alias":
    case "reference":
      return ctx.aliasReference;
    case "alias-collection":
    case "reference-collection":
      return ctx.aliasCollectionName;
    case "type":
      return ctx.resolvedType;
    case "description":
      return ctx.variable.description ?? "";
    case "collection":
      return ctx.collectionName;
  }
}

function collectNodes(node: SceneNode): SceneNode[] {
  const nodes: SceneNode[] = [node];

  if ("children" in node) {
    for (const child of node.children) {
      nodes.push(...collectNodes(child));
    }
  }

  return nodes;
}

async function loadFontsForTextNode(node: TextNode): Promise<void> {
  if (node.fontName !== figma.mixed) {
    await figma.loadFontAsync(node.fontName as FontName);
    return;
  }

  const length = node.characters.length;
  if (length === 0) {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    return;
  }

  const fonts = node.getRangeAllFontNames(0, length);
  await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
}

function isRgba(value: VariableValue): value is RGBA {
  return (
    typeof value === "object" &&
    value !== null &&
    "r" in value &&
    "g" in value &&
    "b" in value
  );
}

function applyColorToNode(node: SceneNode, color: RGBA): void {
  if (!("fills" in node) || node.fills === figma.mixed) {
    return;
  }

  const fills = Array.isArray(node.fills) ? [...node.fills] : [];
  const solidIndex = fills.findIndex((fill) => fill.type === "SOLID");

  const solidFill: SolidPaint = {
    type: "SOLID",
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a ?? 1,
  };

  if (solidIndex >= 0) {
    fills[solidIndex] = solidFill;
  } else {
    fills.unshift(solidFill);
  }

  node.fills = fills;
}

function bindColorVariable(node: SceneNode, variable: Variable): void {
  if (!("fills" in node)) {
    return;
  }

  const basePaint: SolidPaint = {
    type: "SOLID",
    color: { r: 0, g: 0, b: 0 },
  };

  node.fills = [
    figma.variables.setBoundVariableForPaint(basePaint, "color", variable),
  ];
}

export async function fillInstanceLayers(
  instance: InstanceNode,
  variable: Variable,
  collection: VariableCollection,
  modeId: string,
  collectionName: string
): Promise<void> {
  instance.setExplicitVariableModeForCollection(collection, modeId);

  const { value: resolvedValue, resolvedType } = resolveVariableForConsumer(
    variable,
    instance
  );
  const alias = await getAliasReference(variable, modeId);

  const ctx: FillContext = {
    variable,
    collectionName,
    resolvedValue,
    resolvedType,
    aliasReference: alias?.variableName ?? "",
    aliasCollectionName: alias?.collectionName ?? "",
  };

  const nodes = collectNodes(instance);

  for (const node of nodes) {
    const layerKey = getLayerKey(node.name);

    if (node.type === "TEXT" && layerKey) {
      await loadFontsForTextNode(node);
      node.characters = getTextForLayer(layerKey, ctx);
      continue;
    }

    const normalizedName = node.name.trim().toLowerCase();

    if (
      (normalizedName === "color" || normalizedName === "swatch") &&
      resolvedType === "COLOR" &&
      isRgba(resolvedValue)
    ) {
      applyColorToNode(node, resolvedValue);
      continue;
    }

    if (
      (normalizedName === "bind" || normalizedName === "bind-color") &&
      resolvedType === "COLOR"
    ) {
      bindColorVariable(node, variable);
    }
  }
}
