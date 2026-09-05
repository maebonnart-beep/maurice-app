import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_BUCKET, avatarUrl } from "@/lib/marketplace/constants";

/** Upload de la photo de profil de l'utilisateur connecté. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis." }, { status: 400 });
  }

  const extension = file.name.split(".").pop() || "jpg";
  const storagePath = `${user.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: storagePath })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatarUrl: avatarUrl(storagePath) });
}
