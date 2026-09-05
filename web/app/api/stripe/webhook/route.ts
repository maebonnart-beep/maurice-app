import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId && session.subscription) {
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: "active",
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status =
        subscription.status === "active" || subscription.status === "trialing"
          ? "active"
          : subscription.status === "past_due"
            ? "past_due"
            : "canceled";
      const periodEnd = subscription.items.data[0]?.current_period_end;
      await supabase
        .from("profiles")
        .update({
          subscription_status: status,
          premium_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        })
        .eq("stripe_customer_id", subscription.customer as string);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("profiles")
        .update({ subscription_status: "none" })
        .eq("stripe_customer_id", subscription.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
