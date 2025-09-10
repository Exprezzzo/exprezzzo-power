import { Router } from "express";
import Stripe from "stripe";
import { db } from "../../config/firebase";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export const stripeRoutes = Router();

stripeRoutes.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId, userId, email } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId || "price_xxx", quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
      customer_email: email,
      metadata: { userId: userId || "anonymous" }
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: "Stripe error" });
  }
});

// Stripe webhook listener (optional)
stripeRoutes.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).json({ error: "Missing signature" });
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.metadata?.userId) {
        await db.collection("users").doc(session.metadata.userId).set({
          isPro: true,
          stripeCustomerId: session.customer,
          subscriptionId: session.subscription,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: "Webhook error" });
  }
});
export default stripeRoutes;
