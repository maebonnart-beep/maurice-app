import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

/** Crée une session Stripe Checkout pour l'abonnement premium (Rs ou EUR, mensuel ou annuel) et renvoie l'URL de redirection. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const plan = body?.plan === "annual" ? "annual" : "monthly";
  const currency = body?.currency === "eur" ? "eur" : "mur";

  const priceId =
    currency === "eur"
      ? plan === "annual"
        ? process.env.STRIPE_PRICE_ID_ANNUAL_EUR!
        : process.env.STRIPE_PRICE_ID_MONTHLY_EUR!
      : plan === "annual"
        ? process.env.STRIPE_PRICE_ID_ANNUAL!
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!;

  if (!priceId || !process.env.STRIPE_SECRET_KEY) {
    console.error("[stripe/checkout] configuration manquante", { plan, currency, hasPrice: !!priceId });
    return NextResponse.json({ error: "Paiement indisponible pour ce tarif." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  try {
    const stripe = getStripe();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .upsert({ id: user.id, stripe_customer_id: customerId });
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/mon-compte?checkout=success`,
      cancel_url: `${origin}/mon-compte/upgrade?checkout=cancel`,
      metadata: { supabase_user_id: user.id },
    });
    if (!session.url) throw new Error("Session Stripe sans URL");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Impossible d'ouvrir le paiement. Réessaie dans un instant." }, { status: 500 });
  }
}
