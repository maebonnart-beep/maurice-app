import { NextResponse } from "next/server";
import { sendSuggestionEmail } from "@/lib/suggestions/sendSuggestion";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reçoit une suggestion (commentaire, adresse, contact) depuis le site et la
 *  transmet à l'admin par e-mail — voir sendSuggestion.ts pour le pourquoi. */
export async function POST(request: Request) {
  try {
    const { subject, body, replyTo } = (await request.json()) as {
      subject?: string;
      body?: string;
      replyTo?: string;
    };

    if (typeof subject !== "string" || !subject.trim() || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const html = body
      .split("\n")
      .map((line) => `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`)
      .join("");

    const result = await sendSuggestionEmail({
      subject: subject.trim().slice(0, 200),
      html,
      replyTo: typeof replyTo === "string" && EMAIL_RE.test(replyTo) ? replyTo : undefined,
    });

    if (!result.ok) return NextResponse.json({ ok: false }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
