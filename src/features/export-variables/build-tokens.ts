import { toCollectionDirName, mapFigmaTypeToDtcg } from "./format";
import { type AliasTarget, resolveTokenValue } from "./resolve-value";

type TokenTree = Record<string, unknown>;

interface DtcgToken {
  $type: string;
  $value: unknown;
  $extensions?: Record<string, unknown>;
}

function buildTokenExtensions(
  variable: Variable,
  aliasTarget?: AliasTarget
): Record<string, unknown> {
  const extensions: Record<string, unknown> = {
    "com.figma.variableId": variable.id,
  };

  if (variable.scopes.length > 0) {
    extensions["com.figma.scopes"] = [...variable.scopes];
  }

  if (variable.resolvedType === "STRING") {
    extensions["com.figma.type"] = "string";
  }

  if (variable.resolvedType === "BOOLEAN") {
    extensions["com.figma.type"] = "boolean";
  }

  if (aliasTarget) {
    extensions["com.figma.aliasData"] = {
      targetVariableId: aliasTarget.variableId,
      targetVariableName: aliasTarget.variableName,
      targetVariableSetId: aliasTarget.collectionId,
      targetVariableSetName: aliasTarget.collectionDirName,
    };
  }

  return extensions;
}

function setNestedToken(tree: TokenTree, segments: string[], token: DtcgToken): void {
  let current = tree;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (
      !current[segment] ||
      typeof current[segment] !== "object" ||
      "$value" in (current[segment] as Record<string, unknown>)
    ) {
      current[segment] = {};
    }
    current = current[segment] as TokenTree;
  }

  current[segments[segments.length - 1]] = token;
}

export async function buildCollectionModeTokens(
  collection: VariableCollection,
  modeId: string,
  modeName: string,
  variables: Variable[],
  collectionsById: Map<string, VariableCollection>
): Promise<TokenTree> {
  const collectionDirNames = new Map(
    [...collectionsById.values()].map((item) => [item.id, toCollectionDirName(item.name)])
  );

  const context = {
    variablesById: new Map(variables.map((variable) => [variable.id, variable])),
    collectionsById,
    collectionDirNames,
  };

  const tree: TokenTree = {};
  const scopedVariables = variables
    .filter((variable) => variable.variableCollectionId === collection.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const variable of scopedVariables) {
    const { value, aliasTarget } = await resolveTokenValue(
      variable,
      collection,
      modeId,
      modeName,
      context
    );

    const token: DtcgToken = {
      $type: mapFigmaTypeToDtcg(variable.resolvedType),
      $value: value,
      $extensions: buildTokenExtensions(variable, aliasTarget),
    };

    const segments = variable.name
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      continue;
    }

    setNestedToken(tree, segments, token);
  }

  tree.$extensions = {
    "com.figma.modeName": modeName,
  };

  return tree;
}
