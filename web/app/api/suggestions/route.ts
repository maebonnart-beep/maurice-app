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
const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_BASE64_LENGTH = 4_000_000; // défense en profondeur : le client compresse déjà bien en-dessous.

/** Reçoit une suggestion (commentaire, adresse, contact) depuis le site et la
 *  transmet à l'admin par e-mail — voir sendSuggestion.ts pour le pourquoi. */
export async function POST(request: Request) {
  try {
    const { subject, body, replyTo, attachments } = (await request.json()) as {
      subject?: string;
      body?: string;
      replyTo?: string;
      attachments?: { filename?: string; contentBase64?: string }[];
    };

    if (typeof subject !== "string" || !subject.trim() || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let resendAttachments: { filename: string; content: string }[] | undefined;
    if (Array.isArray(attachments) && attachments.length > 0) {
      if (attachments.length > MAX_ATTACHMENTS) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      resendAttachments = [];
      for (const a of attachments) {
        if (
          typeof a.filename !== "string" ||
          typeof a.contentBase64 !== "string" ||
          a.contentBase64.length === 0 ||
          a.contentBase64.length > MAX_ATTACHMENT_BASE64_LENGTH
        ) {
          return NextResponse.json({ ok: false }, { status: 400 });
        }
        resendAttachments.push({ filename: a.filename.slice(0, 100), content: a.contentBase64 });
      }
    }

    const html = body
      .split("\n")
      .map((line) => `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`)
      .join("");

    const result = await sendSuggestionEmail({
      subject: subject.trim().slice(0, 200),
      html,
      replyTo: typeof replyTo === "string" && EMAIL_RE.test(replyTo) ? replyTo : undefined,
      attachments: resendAttachments,
    });

    if (!result.ok) return NextResponse.json({ ok: false }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
