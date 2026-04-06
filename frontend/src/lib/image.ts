export function toAbsoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  if (!base) return url;
  return `${base}${url}`;
}

