export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

export function jsonError(error: unknown, status = 400) {
  return Response.json(
    {
      error: error instanceof Error ? error.message : "Unexpected API error.",
    },
    { status },
  );
}
