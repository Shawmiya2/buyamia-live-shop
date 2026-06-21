export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
