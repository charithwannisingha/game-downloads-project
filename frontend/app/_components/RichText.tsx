"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

export function RichText({ html }: { html: string }) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(html), [html]);
  return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}

