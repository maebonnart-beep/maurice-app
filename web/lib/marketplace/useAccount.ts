"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "./types";
import { mapListingRow } from "./mapRow";

export type AccountRole = "normal" | "community" | "admin";

export type AccountState = {
  loading: boolean;
  loggedIn: boolean;
  email: string | null;
  isPremium: boolean;
  role: AccountRole;
  listings: Listing[];
};

const IDLE_STATE: AccountState = {
  loading: true,
  loggedIn: false,
  email: null,
  isPremium: false,
  role: "normal",
  listings: [],
};

/** Statut de compte (Supabase) affiché dans « Mon compte » : abonnement, rôle,
 *  annonces. N'est appelé que depuis cet écran — l'app reste utilisable sans
 *  jamais toucher Supabase tant qu'on ne le visite pas. */
export function useAccount(): AccountState {
  const [state, setState] = useState<AccountState>(IDLE_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setState({ ...IDLE_STATE, loading: false });
        return;
      }

      const [{ data: profile }, listingsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("subscription_status, is_admin, is_community_member")
          .eq("id", user.id)
          .single(),
        fetch("/api/listings"),
      ]);

      if (cancelled) return;

      const listingsRows = listingsRes.ok ? ((await listingsRes.json()) as Record<string, unknown>[]) : [];

      setState({
        loading: false,
        loggedIn: true,
        email: user.email ?? null,
        isPremium: profile?.subscription_status === "active",
        role: profile?.is_admin ? "admin" : profile?.is_community_member ? "community" : "normal",
        listings: listingsRows.map(mapListingRow),
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
