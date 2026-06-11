export type TemplateContext =
  | {
      kind: "component";
      component: ComponentNode;
      anchor: SceneNode;
    }
  | {
      kind: "component-set";
      componentSet: ComponentSetNode;
      typePropertyName: string;
      anchor: SceneNode;
    };

function findTypeVariantProperty(
  componentSet: ComponentSetNode
): string | null {
  for (const [name, definition] of Object.entries(
    componentSet.componentPropertyDefinitions
  )) {
    if (definition.type === "VARIANT" && name.toLowerCase() === "type") {
      return name;
    }
  }

  return null;
}

function resolveComponentSetFromComponent(
  component: ComponentNode
): ComponentSetNode | null {
  const parent = component.parent;
  return parent?.type === "COMPONENT_SET" ? parent : null;
}

export async function resolveTemplate(
  selection: readonly SceneNode[]
): Promise<TemplateContext | null> {
  if (selection.length !== 1) {
    return null;
  }

  const node = selection[0];

  if (node.type === "COMPONENT_SET") {
    const typePropertyName = findTypeVariantProperty(node);
    if (!typePropertyName) {
      return null;
    }

    return {
      kind: "component-set",
      componentSet: node,
      typePropertyName,
      anchor: node,
    };
  }

  if (node.type === "COMPONENT") {
    const componentSet = resolveComponentSetFromComponent(node);
    if (componentSet) {
      const typePropertyName = findTypeVariantProperty(componentSet);
      if (!typePropertyName) {
        return null;
      }

      return {
        kind: "component-set",
        componentSet,
        typePropertyName,
        anchor: node,
      };
    }

    return {
      kind: "component",
      component: node,
      anchor: node,
    };
  }

  if (node.type === "INSTANCE") {
    const mainComponent = await node.getMainComponentAsync();
    if (!mainComponent) {
      return null;
    }

    const componentSet = resolveComponentSetFromComponent(mainComponent);
    if (componentSet) {
      const typePropertyName = findTypeVariantProperty(componentSet);
      if (!typePropertyName) {
        return null;
      }

      return {
        kind: "component-set",
        componentSet,
        typePropertyName,
        anchor: node,
      };
    }

    return {
      kind: "component",
      component: mainComponent,
      anchor: node,
    };
  }

  return null;
}

export async function getTemplateDisplayName(
  node: SceneNode
): Promise<string | null> {
  if (node.type === "COMPONENT_SET") {
    return findTypeVariantProperty(node) ? node.name : null;
  }

  if (node.type === "COMPONENT") {
    const componentSet = resolveComponentSetFromComponent(node);
    if (componentSet) {
      return findTypeVariantProperty(componentSet) ? componentSet.name : null;
    }

    return node.name;
  }

  if (node.type === "INSTANCE") {
    const mainComponent = await node.getMainComponentAsync();
    if (!mainComponent) {
      return null;
    }

    const componentSet = resolveComponentSetFromComponent(mainComponent);
    if (componentSet) {
      return findTypeVariantProperty(componentSet) ? componentSet.name : null;
    }

    return mainComponent.name;
  }

  return null;
}

export function createTemplateInstance(
  template: TemplateContext,
  variable: Variable
): InstanceNode {
  if (template.kind === "component") {
    return template.component.createInstance();
  }

  const instance = template.componentSet.defaultVariant.createInstance();
  instance.setProperties({
    [template.typePropertyName]: variable.resolvedType,
  });

  return instance;
}
