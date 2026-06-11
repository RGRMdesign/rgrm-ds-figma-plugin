import {
  colorToDtcg,
  isRgba,
  isVariableAlias,
  toTokenReference,
} from "./format";

export interface AliasTarget {
  variableId: string;
  variableName: string;
  collectionId: string;
  collectionDirName: string;
}

interface ResolveContext {
  variablesById: Map<string, Variable>;
  collectionsById: Map<string, VariableCollection>;
  collectionDirNames: Map<string, string>;
}

function findMatchingModeId(
  sourceModeName: string,
  targetCollection: VariableCollection
): string {
  const match = targetCollection.modes.find((mode) => mode.name === sourceModeName);
  return match?.modeId ?? targetCollection.defaultModeId;
}

async function resolveLiteralValue(
  variable: Variable,
  modeId: string,
  modeName: string,
  context: ResolveContext,
  visited: Set<string>
): Promise<VariableValue | null> {
  if (visited.has(variable.id)) {
    return null;
  }

  visited.add(variable.id);

  const rawValue = variable.valuesByMode[modeId];
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  if (!isVariableAlias(rawValue)) {
    return rawValue;
  }

  const target = context.variablesById.get(rawValue.id);
  if (!target) {
    const remoteTarget = await figma.variables.getVariableByIdAsync(rawValue.id);
    if (!remoteTarget) {
      return null;
    }

    const remoteCollection = await figma.variables.getVariableCollectionByIdAsync(
      remoteTarget.variableCollectionId
    );
    if (!remoteCollection) {
      return null;
    }

    const remoteModeId = findMatchingModeId(modeName, remoteCollection);
    return resolveLiteralValue(
      remoteTarget,
      remoteModeId,
      modeName,
      context,
      visited
    );
  }

  const targetCollection = context.collectionsById.get(target.variableCollectionId);
  if (!targetCollection) {
    return null;
  }

  const targetModeId = findMatchingModeId(modeName, targetCollection);
  return resolveLiteralValue(target, targetModeId, modeName, context, visited);
}

export async function resolveTokenValue(
  variable: Variable,
  collection: VariableCollection,
  modeId: string,
  modeName: string,
  context: ResolveContext
): Promise<{ value: unknown; aliasTarget?: AliasTarget }> {
  const rawValue = variable.valuesByMode[modeId];
  if (rawValue === undefined || rawValue === null) {
    throw new Error(`Variable "${variable.name}" has no value for the selected mode.`);
  }

  if (isVariableAlias(rawValue)) {
    const target =
      context.variablesById.get(rawValue.id) ??
      (await figma.variables.getVariableByIdAsync(rawValue.id));

    if (!target) {
      throw new Error(`Could not resolve alias for variable "${variable.name}".`);
    }

    const targetCollection =
      context.collectionsById.get(target.variableCollectionId) ??
      (await figma.variables.getVariableCollectionByIdAsync(
        target.variableCollectionId
      ));

    if (!targetCollection) {
      throw new Error(`Could not resolve collection for alias "${variable.name}".`);
    }

    if (target.variableCollectionId === collection.id) {
      return { value: toTokenReference(target.name) };
    }

    const targetModeId = findMatchingModeId(modeName, targetCollection);
    const literal = await resolveLiteralValue(
      target,
      targetModeId,
      modeName,
      context,
      new Set([variable.id])
    );

    if (literal === null) {
      throw new Error(`Could not resolve cross-collection alias for "${variable.name}".`);
    }

    return {
      value: literalToDtcgValue(literal, target.resolvedType),
      aliasTarget: {
        variableId: target.id,
        variableName: target.name,
        collectionId: targetCollection.id,
        collectionDirName:
          context.collectionDirNames.get(targetCollection.id) ??
          targetCollection.name.toLowerCase().replace(/\s+/g, ""),
      },
    };
  }

  return { value: literalToDtcgValue(rawValue, variable.resolvedType) };
}

function literalToDtcgValue(
  value: VariableValue,
  resolvedType: VariableResolvedDataType
): unknown {
  switch (resolvedType) {
    case "COLOR":
      if (isRgba(value)) {
        return colorToDtcg(value);
      }
      throw new Error("Invalid color value.");

    case "BOOLEAN":
      return value ? 1 : 0;

    case "FLOAT":
      if (typeof value === "number") {
        return value;
      }
      throw new Error("Invalid number value.");

    case "STRING":
      if (typeof value === "string") {
        return value;
      }
      throw new Error("Invalid string value.");

    default:
      return String(value);
  }
}
