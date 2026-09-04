"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full h-[46px] px-4 rounded-xl border border-border bg-surface text-ink text-[15px] shadow-sm focus:outline-none focus:border-primary";

/** Connexion par code reçu par e-mail (aucun mot de passe, pas de
 *  fournisseur SMS à opérer). Le code est saisi dans le même navigateur que
 *  celui qui l'a demandé — contrairement au lien magique, ça évite les échecs
 *  quand l'e-mail est ouvert dans une autre app/navigateur que l'utilisateur. */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      setErrorMessage(error.message);
      setStatus("sent");
    } else {
      router.refresh();
    }
  }

  if (status === "sent" || status === "verifying") {
    return (
      <form onSubmit={handleVerifyCode} className="max-w-[420px] mx-auto flex flex-col gap-4">
        <div className="text-center mb-1">
          <p className="font-serif text-lg font-semibold leading-tight">Vérifiez vos e-mails</p>
          <p className="text-[13px] text-muted leading-snug">
            Entrez le code de connexion envoyé à {email}.
          </p>
        </div>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code reçu par e-mail"
          className={`${inputClass} text-center tracking-[0.3em]`}
        />
        <button
          type="submit"
          disabled={status === "verifying" || code.trim().length < 4}
          className="w-full h-[48px] rounded-xl font-semibold text-[15px] bg-primary text-white active:scale-[.98] transition-transform disabled:opacity-40"
        >
          {status === "verifying" ? "Vérification…" : "Se connecter"}
        </button>
        {errorMessage && <p className="text-[12px] text-red-600 text-center">{errorMessage}</p>}
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setCode("");
            setErrorMessage(null);
          }}
          className="text-[12px] font-semibold text-muted underline underline-offset-2"
        >
          Changer d&apos;adresse e-mail
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="max-w-[420px] mx-auto flex flex-col gap-4">
      <div className="text-center mb-1">
        <p className="font-serif text-lg font-semibold leading-tight">Mon compte</p>
        <p className="text-[13px] text-muted leading-snug">
          Connectez-vous par e-mail pour déposer et gérer vos annonces.
        </p>
      </div>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@exemple.com"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full h-[48px] rounded-xl font-semibold text-[15px] bg-primary text-white active:scale-[.98] transition-transform disabled:opacity-40"
      >
        {status === "sending" ? "Envoi…" : "Recevoir le code de connexion"}
      </button>
      {status === "error" && (
        <p className="text-[12px] text-red-600 text-center">
          {errorMessage ?? "Une erreur est survenue, réessayez."}
        </p>
      )}
    </form>
  );
}
