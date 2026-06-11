export function toCollectionDirName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

export function toModeFileName(modeName: string): string {
  return modeName
    .replace(/\s+mode$/i, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function toTokenReference(variableName: string): string {
  return `{${variableName.replace(/\//g, ".")}}`;
}

export function mapFigmaTypeToDtcg(
  resolvedType: VariableResolvedDataType
): string {
  switch (resolvedType) {
    case "COLOR":
      return "color";
    case "FLOAT":
      return "number";
    case "STRING":
      return "string";
    case "BOOLEAN":
      return "number";
    default:
      return "string";
  }
}

export function rgbToHex(color: RGBA): string {
  const toHex = (channel: number) =>
    Math.round(channel * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
}

export function colorToDtcg(color: RGBA): Record<string, unknown> {
  return {
    colorSpace: "srgb",
    components: [color.r, color.g, color.b],
    alpha: color.a ?? 1,
    hex: rgbToHex(color),
  };
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

export function isRgba(value: VariableValue): value is RGBA {
  return (
    typeof value === "object" &&
    value !== null &&
    "r" in value &&
    "g" in value &&
    "b" in value
  );
}
