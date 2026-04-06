"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/useAuth";
import { ProfileScreen } from "@/app/_components/ProfileScreen";

export default function ProfileByIdPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const id = Number(params?.id);
  const allowEdit = !loading && user ? user.id === id : false;

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <div className="glass neon-border rounded-3xl p-6">Invalid profile.</div>
      </main>
    );
  }

  if (!allowEdit && !loading && !user) {
    // You can still view public profile; follow button requires login.
  }

  return <ProfileScreen userId={id} allowEdit={allowEdit} />;
}

