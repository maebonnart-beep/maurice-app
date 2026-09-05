"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.refresh();
      }}
      className="text-[12.5px] font-semibold text-muted underline underline-offset-2"
    >
      Se déconnecter
    </button>
  );
}
