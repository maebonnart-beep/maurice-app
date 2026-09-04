"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  isCommunityMember: boolean;
  subscriptionStatus: "active" | "past_due" | "canceled" | "none";
};

export function AdminUsersClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    return fetch("/api/admin/users")
      .then(async (res) => {
        if (res.ok) {
          setUsers((await res.json()) as UserRow[]);
          setError(null);
        } else {
          const json = await res.json();
          setError(json.error ?? "Erreur de chargement.");
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id: string, field: "isAdmin" | "isCommunityMember", next: boolean) {
    if (field === "isAdmin" && !next && id === currentUserId) return;
    if (field === "isAdmin") {
      const verb = next ? "donner les droits admin à" : "retirer les droits admin de";
      if (!window.confirm(`Confirmer : ${verb} cet utilisateur ?`)) return;
    }
    setBusyId(id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: next }),
    });
    await load();
    setBusyId(null);
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Utilisateurs</h1>
        <Link href="/admin/seconde-main" className="text-sm text-primary underline underline-offset-2">
          Modération annonces
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Chargement…</p>}

      {!loading && users.length === 0 && !error && (
        <p className="text-sm text-gray-500">Aucun utilisateur inscrit pour l&apos;instant.</p>
      )}

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div key={u.id} className="border rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{u.email}</p>
              <p className="text-xs text-gray-500">
                Inscrit le {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                {u.subscriptionStatus === "active" && " · Premium"}
              </p>
            </div>
            <label className="flex items-center gap-1.5 text-sm shrink-0">
              <input
                type="checkbox"
                checked={u.isCommunityMember}
                disabled={busyId === u.id}
                onChange={(e) => toggle(u.id, "isCommunityMember", e.target.checked)}
              />
              Membre communauté
            </label>
            <label className="flex items-center gap-1.5 text-sm shrink-0">
              <input
                type="checkbox"
                checked={u.isAdmin}
                disabled={busyId === u.id || (u.isAdmin && u.id === currentUserId)}
                onChange={(e) => toggle(u.id, "isAdmin", e.target.checked)}
              />
              Admin
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
