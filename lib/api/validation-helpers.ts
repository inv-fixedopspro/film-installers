import { NextRequest } from "next/server";
import { ZodSchema, ZodError } from "zod";

export interface ValidationResult<T> {
  data: T;
  error: null;
}

export interface ValidationError {
  data: null;
  error: string;
  errors: Record<string, string>;
}

export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T> | ValidationError> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        data: null,
        error: result.error.errors[0]?.message || "Validation failed",
        errors: formatZodErrors(result.error),
      };
    }

    return { data: result.data, error: null };
  } catch {
    return {
      data: null,
      error: "Invalid JSON body",
      errors: { _form: "Invalid JSON body" },
    };
  }
}

export function validateData<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> | ValidationError {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      data: null,
      error: result.error.errors[0]?.message || "Validation failed",
      errors: formatZodErrors(result.error),
    };
  }

  return { data: result.data, error: null };
}

export function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.errors) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

export function isValidationError<T>(
  result: ValidationResult<T> | ValidationError
): result is ValidationError {
  return result.error !== null;
}

export function extractFirstError(errors: Record<string, string>): string {
  const keys = Object.keys(errors);
  if (keys.length === 0) return "Validation failed";
  return errors[keys[0]];
}
