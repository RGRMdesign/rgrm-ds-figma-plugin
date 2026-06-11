export interface ResolvedVariable {
  value: VariableValue;
  resolvedType: VariableResolvedDataType;
}

export function resolveVariableForConsumer(
  variable: Variable,
  consumer: SceneNode
): ResolvedVariable {
  return variable.resolveForConsumer(consumer);
}

export function isVariableAlias(
  value: VariableValue
): value is VariableAlias {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "VARIABLE_ALIAS"
  );
}

export interface AliasReference {
  variableName: string;
  collectionName: string;
}

export async function getAliasReference(
  variable: Variable,
  modeId: string
): Promise<AliasReference | null> {
  const rawValue = variable.valuesByMode[modeId];
  if (!isVariableAlias(rawValue)) {
    return null;
  }

  const target = await figma.variables.getVariableByIdAsync(rawValue.id);
  if (!target) {
    return null;
  }

  const collection = await figma.variables.getVariableCollectionByIdAsync(
    target.variableCollectionId
  );

  return {
    variableName: target.name,
    collectionName: collection?.name ?? "",
  };
}

export function formatVariableValue(
  value: VariableValue,
  resolvedType: VariableResolvedDataType
): string {
  if (value === undefined || value === null || isVariableAlias(value)) {
    return "";
  }

  switch (resolvedType) {
    case "STRING":
      return String(value);
    case "FLOAT":
      return String(value);
    case "BOOLEAN":
      return value ? "true" : "false";
    case "COLOR": {
      const color = value as RGBA;
      const toHex = (channel: number) =>
        Math.round(channel * 255)
          .toString(16)
          .padStart(2, "0");
      const alpha =
        color.a !== undefined && color.a < 1
          ? Math.round(color.a * 100) / 100
          : null;
      const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
      return alpha !== null ? `${hex} (${alpha})` : hex;
    }
    default:
      return String(value);
  }
}
