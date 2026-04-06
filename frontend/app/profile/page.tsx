"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/useAuth";
import { ProfileScreen } from "@/app/_components/ProfileScreen";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="mx-auto w-full max-w-md px-4 py-10 text-sm text-[color:var(--muted)]">Loading...</div>;
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <div className="glass neon-border rounded-3xl p-6">
          <h1 className="text-lg font-black tracking-tight">Login required</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Sign in to view your profile and download.</p>
          <button type="button" onClick={() => router.push("/login")} className="neon-border glass mt-4 rounded-2xl px-4 py-3 font-semibold">
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return <ProfileScreen userId={user.id} allowEdit={true} />;
}

