"use client";

import { useEffect, useMemo, useState } from "react";
import { backendUrl } from "@/src/lib/backend";
import { useAuth } from "@/src/lib/useAuth";
import { backendFetch } from "@/src/lib/backend";

type CommentItem = {
  id: number;
  userId: number;
  gameId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  username: string;
  likeCount: number;
};

function buildTree(comments: CommentItem[]) {
  const byId = new Map<number, CommentItem & { children: CommentItem[] }>();
  for (const c of comments) byId.set(c.id, { ...c, children: [] });
  const roots: (CommentItem & { children: CommentItem[] })[] = [];
  for (const c of comments) {
    const node = byId.get(c.id)!;
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function CommentsSection({ gameId }: { gameId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newContent, setNewContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(backendUrl(`/api/comments/${gameId}`), { credentials: "include" });
    const json = await res.json();
    setComments(json.comments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const tree = useMemo(() => buildTree(comments), [comments]);

  async function addComment(parentId: number | null) {
    if (!user) return;
    const content = (parentId ? replyContent : newContent).trim();
    if (!content) return;
    setSubmitting(true);
    try {
      await fetch(backendUrl(`/api/comments`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, content, parentId }),
      });
      setNewContent("");
      setReplyContent("");
      setReplyingTo(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function like(commentId: number) {
    if (!user) return;
    await backendFetch(`/api/comments/${commentId}/like`, { method: "POST" });
    await load();
  }

  async function del(commentId: number) {
    if (!user || user.role !== "admin") return;
    await fetch(backendUrl(`/api/comments/${commentId}`), { method: "DELETE", credentials: "include" });
    await load();
  }

  function CommentNode({ node, depth }: { node: any; depth: number }) {
    return (
      <div className="mt-3">
        <div
          className={`rounded-2xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.35)] p-3 ${
            depth > 0 ? "ml-3" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{node.username}</div>
              <div className="mt-1 text-sm text-[color:var(--muted)] whitespace-pre-wrap">{node.content}</div>
            </div>
            <div className="shrink-0 text-xs text-[color:var(--muted)]">{new Date(node.createdAt).toLocaleDateString()}</div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => like(node.id)}
              className="rounded-xl border border-[color:var(--border)] px-2 py-1 hover:brightness-110"
            >
              Like ({node.likeCount})
            </button>
            <button
              type="button"
              onClick={() => setReplyingTo(node.id)}
              className="rounded-xl border border-[color:var(--border)] px-2 py-1 hover:brightness-110"
            >
              Reply
            </button>
            {user?.role === "admin" ? (
              <button
                type="button"
                onClick={() => del(node.id)}
                className="rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] px-2 py-1 hover:brightness-110"
              >
                Delete
              </button>
            ) : null}
          </div>

          {replyingTo === node.id ? (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full min-h-20 rounded-xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.25)] px-3 py-2 text-sm outline-none"
                placeholder="Write a reply..."
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addComment(node.id)}
                  disabled={submitting}
                  className="neon-border glass rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-70"
                >
                  {submitting ? "Posting..." : "Post Reply"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                  className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {node.children?.length ? (
          <div className="mt-2 pl-2 border-l border-[color:var(--border)]">
            {node.children.map((ch: any) => (
              <CommentNode key={ch.id} node={ch} depth={depth + 1} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass neon-border rounded-2xl p-4">
        <h3 className="font-bold">Comments</h3>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Be respectful. Keep it helpful.</p>

        <div className="mt-4">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full min-h-24 rounded-xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.25)] px-3 py-2 text-sm outline-none"
            placeholder="Write a comment..."
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => addComment(null)}
              disabled={submitting}
              className="neon-border glass rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
            <span className="text-xs text-[color:var(--muted)]">
              {user ? "Signed in" : "Login required to comment"}
            </span>
          </div>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">Loading comments...</div>
        ) : tree.length ? (
          <div>
            {tree.map((n: any) => (
              <CommentNode key={n.id} node={n} depth={0} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">No comments yet.</div>
        )}
      </div>
    </div>
  );
}

