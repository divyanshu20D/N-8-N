type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isNodeArray = (value: unknown) => {
  if (!Array.isArray(value)) return false;
  return value.every((node) => {
    if (!isObject(node)) return false;
    return (
      typeof node.id === "string" &&
      typeof node.type === "string" &&
      isObject(node.position) &&
      typeof node.position.x === "number" &&
      typeof node.position.y === "number"
    );
  });
};

const isConnectionArray = (value: unknown) => {
  if (!Array.isArray(value)) return false;
  return value.every((connection) => {
    if (!isObject(connection)) return false;
    return (
      typeof connection.id === "string" &&
      typeof connection.source === "string" &&
      typeof connection.target === "string"
    );
  });
};

export const validateCreateWorkflowBody = (body: unknown): ValidationResult => {
  if (!isObject(body)) {
    return { valid: false, message: "Body must be an object" };
  }

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 1) {
      return { valid: false, message: "name must be a non-empty string" };
    }
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    return { valid: false, message: "description must be a string" };
  }

  if (body.nodes !== undefined && !isNodeArray(body.nodes)) {
    return { valid: false, message: "nodes must be a valid node array" };
  }

  if (body.connections !== undefined && !isConnectionArray(body.connections)) {
    return {
      valid: false,
      message: "connections must be a valid connection array",
    };
  }

  if (body.active !== undefined && typeof body.active !== "boolean") {
    return { valid: false, message: "active must be a boolean" };
  }

  return { valid: true };
};

export const validateUpdateWorkflowBody = (body: unknown): ValidationResult => {
  return validateCreateWorkflowBody(body);
};
