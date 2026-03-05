type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const validateCreateCredentialBody = (body: unknown): ValidationResult => {
  if (!isObject(body)) {
    return { valid: false, message: "Body must be an object" };
  }

  if (typeof body.name !== "string" || body.name.trim().length < 1) {
    return { valid: false, message: "name must be a non-empty string" };
  }

  if (typeof body.provider !== "string" || body.provider.trim().length < 1) {
    return { valid: false, message: "provider must be a non-empty string" };
  }

  if (!isObject(body.data)) {
    return { valid: false, message: "data must be an object" };
  }

  return { valid: true };
};

export const validateUpdateCredentialBody = (body: unknown): ValidationResult => {
  if (!isObject(body)) {
    return { valid: false, message: "Body must be an object" };
  }

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 1) {
      return { valid: false, message: "name must be a non-empty string" };
    }
  }

  if (body.provider !== undefined) {
    if (typeof body.provider !== "string" || body.provider.trim().length < 1) {
      return { valid: false, message: "provider must be a non-empty string" };
    }
  }

  if (body.data !== undefined && !isObject(body.data)) {
    return { valid: false, message: "data must be an object" };
  }

  return { valid: true };
};
