export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export class ValidationApiError extends ApiError {
  constructor(fields: Record<string, string>) {
    super(
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      400,
      fields,
    );
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
