export interface ProxyResponse {
  status: number;
  body: unknown;
}

export async function forward(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: unknown },
): Promise<ProxyResponse> {
  const res = await fetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

export async function pingHealth(url: string): Promise<"up" | "down"> {
  try {
    const res = await fetch(`${url}/health`, { method: "GET" });
    return res.ok ? "up" : "down";
  } catch {
    return "down";
  }
}
