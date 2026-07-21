import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { Business } from "@/lib/types";

const DATA_PATH = path.join(process.cwd(), "data", "businesses.json");

export async function GET() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return NextResponse.json(JSON.parse(raw));
}

export async function PATCH(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Edition disponible uniquement en local (npm run dev)." },
      { status: 403 }
    );
  }

  const { id, patch } = (await request.json()) as {
    id: string;
    patch: Partial<Business>;
  };

  if (!id || !patch) {
    return NextResponse.json({ error: "id et patch requis." }, { status: 400 });
  }

  const raw = await fs.readFile(DATA_PATH, "utf8");
  const businesses = JSON.parse(raw) as Business[];
  const index = businesses.findIndex((b) => b.id === id);

  if (index === -1) {
    return NextResponse.json({ error: `Fiche "${id}" introuvable.` }, { status: 404 });
  }

  const merged: Record<string, unknown> = { ...businesses[index], ...patch };
  for (const key of Object.keys(merged)) {
    if (merged[key] === "" || merged[key] === undefined) {
      delete merged[key];
    }
  }
  businesses[index] = merged as Business;

  await fs.writeFile(DATA_PATH, JSON.stringify(businesses, null, 2) + "\n", "utf8");

  return NextResponse.json({ ok: true, business: businesses[index] });
}
