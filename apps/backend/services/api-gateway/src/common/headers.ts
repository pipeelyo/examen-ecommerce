export function internalHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Internal-Token": process.env.INTERNAL_SERVICE_TOKEN ?? "dev-internal-token",
    ...extra,
  };
}

export function adminHeaders(): Record<string, string> {
  return internalHeaders({ "X-User-Role": "ADMIN" });
}
