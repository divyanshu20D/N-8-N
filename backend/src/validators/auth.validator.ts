type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const validateRegisterBody = (body: unknown): ValidationResult => {
  if (!isObject(body)) {
    return { valid: false, message: "Body must be an object" };
  }

  const name = body.name;
  const email = body.email;
  const password = body.password;

  if (typeof name !== "string" || name.trim().length < 2) {
    return { valid: false, message: "name must be at least 2 characters" };
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return { valid: false, message: "email must be a valid email address" };
  }
  if (typeof password !== "string" || password.length < 6) {
    return { valid: false, message: "password must be at least 6 characters" };
  }

  return { valid: true };
};

export const validateLoginBody = (body: unknown): ValidationResult => {
  if (!isObject(body)) {
    return { valid: false, message: "Body must be an object" };
  }

  const email = body.email;
  const password = body.password;

  if (typeof email !== "string" || !email.includes("@")) {
    return { valid: false, message: "email must be a valid email address" };
  }
  if (typeof password !== "string" || password.length < 1) {
    return { valid: false, message: "password is required" };
  }

  return { valid: true };
};
