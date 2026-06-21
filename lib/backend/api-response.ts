import { isApiError } from "./errors";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function jsonError(error: unknown, status = 400) {
  const apiError = isApiError(error) ? error : null;

  return Response.json(
    {
      success: false,
      error: {
        code: apiError?.code ?? "unexpected_error",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected API error.",
      },
    },
    { status: apiError?.status ?? status },
  );
}
