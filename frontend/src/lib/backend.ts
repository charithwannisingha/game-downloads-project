const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export async function backendFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  if (!BACKEND_URL) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Backend error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function backendUrl(path: string) {
  return `${BACKEND_URL}${path}`;
}

