"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/lib/useAuth";
import { backendUrl } from "@/src/lib/backend";
import { toAbsoluteUrl } from "@/src/lib/image";

type PublicUser = {
  id: number;
  username: string;
  avatar: string | null;
  role: "user" | "admin";
  followers: number;
};

export function ProfileScreen({ userId, allowEdit }: { userId: number; allowEdit: boolean }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch(backendUrl(`/api/users/${userId}`), { credentials: "include" });
      const json = await res.json();
      if (!cancelled) setProfile(json.user ?? null);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    async function loadFollowState() {
      if (!user || allowEdit) return;
      const res = await fetch(backendUrl(`/api/users/is-following/${userId}`), { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (!cancelled) setFollowing(Boolean(json.following));
    }
    loadFollowState().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, userId, allowEdit]);

  async function toggleFollow() {
    if (!user) return;
    if (following) {
      await fetch(backendUrl(`/api/users/${userId}/follow`), { method: "DELETE", credentials: "include" });
      setFollowing(false);
    } else {
      await fetch(backendUrl(`/api/users/${userId}/follow`), { method: "POST", credentials: "include" });
      setFollowing(true);
    }
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    const form = new FormData();
    form.append("avatar", file);
    await fetch(backendUrl(`/api/users/avatar`), {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const refreshed = await fetch(backendUrl(`/api/users/me`), { credentials: "include" });
    const json = await refreshed.json();
    setProfile(json.user ?? profile);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      {loading ? (
        <div className="text-sm text-[color:var(--muted)]">Loading profile...</div>
      ) : profile ? (
        <div className="glass neon-border rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <img
                  src={toAbsoluteUrl(profile.avatar) ?? undefined}
                  alt="avatar"
                  className="h-20 w-20 rounded-2xl border border-[color:var(--border)] object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl border border-[color:var(--border)] bg-[rgba(34,211,238,0.10)]" />
              )}
              <div>
                <div className="text-xl font-black tracking-tight">{profile.username}</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">
                  {profile.role.toUpperCase()} • {profile.followers} followers
                </div>
              </div>
            </div>

            {!allowEdit ? (
              <button
                type="button"
                onClick={toggleFollow}
                disabled={!user}
                className="neon-border glass rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-70"
              >
                {following ? "Unfollow" : "Follow"}
              </button>
            ) : null}
          </div>

          {allowEdit ? (
            <div className="mt-5">
              <label className="text-sm text-[color:var(--muted)]">Upload avatar</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f).catch(() => {});
                  }}
                  className="block w-full text-sm"
                />
                <div className="text-xs text-[color:var(--muted)]">Max 3MB</div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-[color:var(--muted)]">User not found</div>
      )}
    </div>
  );
}

