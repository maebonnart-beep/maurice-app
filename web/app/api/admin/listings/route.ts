import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { LISTING_TTL_DAYS } from "@/lib/marketplace/constants";

// Les policies RLS de `listings` n'autorisent que le public (approved) et le
// propriétaire — la modération admin doit donc passer par la clé service-role,
// une fois requireAdmin() a confirmé profiles.is_admin sur la session cookie.

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const status = new URL(request.url).searchParams.get("status") ?? "pending";

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .order("created_at", { ascending: true });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id, decision, rejectionReason } = (await request.json()) as {
    id: number;
    decision: "approved" | "rejected";
    rejectionReason?: string;
  };

  if (!id || !decision) {
    return NextResponse.json({ error: "id et decision requis." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const patch =
    decision === "approved"
      ? {
          status: "approved" as const,
          approved_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + LISTING_TTL_DAYS * 24 * 60 * 60 * 1000
          ).toISOString(),
          rejection_reason: null,
        }
      : {
          status: "rejected" as const,
          rejection_reason: rejectionReason ?? null,
        };

  const { data, error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listing: data });
}
