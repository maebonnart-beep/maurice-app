import Stripe from "stripe";

// Instanciation paresseuse : éviter de construire le client au chargement du
// module (échoue le build/collecte des routes tant que STRIPE_SECRET_KEY
// n'est pas configuré côté Vercel).
let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
