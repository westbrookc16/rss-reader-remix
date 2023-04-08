import type { User } from "@prisma/client";

import { prisma } from "~/db.server";

import Stripe from "stripe";
import invariant from "tiny-invariant";
invariant(process.env.STRIPE_SECRET_KEY, "stripe key must be defined.");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});

export async function createBillingSession(user: User): Promise<string> {
  invariant(user.stripeCustomerId, "Stripe customer id not found.");
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: process.env.BASE_URL,
  });
  return session.url;
}

export async function createCheckoutSession(
  user: User,
  price: string
): Promise<string> {
  invariant(user.stripeCustomerId, "Stripe Customer ID not found.");
  invariant(process.env.BASE_URL, "base url must be set.");
  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    success_url: process.env.BASE_URL,
    cancel_url: "http://localhost:3000/pay",
    line_items: [
      {
        price,
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      userId: user.id,
    },
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        userId: user.id,
      },
    },
  });
  invariant(session.url, "Error creating checkout session");
  return session.url;
}

export async function activeSubscription(user: User) {
  if (!user.stripeCustomerId) return false;
  if (!user.stripeSubscriptionId) return false;
  if (
    user.stripeSubscriptionStatus != "active" &&
    user.stripeSubscriptionStatus != "trialing"
  )
    return false;

  return true;
}

export async function handleWebhook(request: any) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  let event;
  const payload = await request.text();
  invariant(secret, "Stripe webhook secret not defined.");
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    console.log(err);
    //return new Response(err.message, {
    //      status: 400,
    //});
  }
  invariant(event, "Error creating webhook event");
  if (
    event.type == "checkout.session.completed" ||
    event.type == "checkout.session.async_payment_succeeded"
  ) {
    const session: any = event.data.object;
    if (session.payment_status == "paid") {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );
      await handleSubscriptionCreated(session.customer, subscription);
    }
  }

  if (
    event.type == "customer.subscription.updated" ||
    event.type == "customer.subscription.deleted"
  ) {
    const subscription: any = event.data.object;
    await updateSubscriptionStatus(
      subscription.metadata.userId,
      subscription.status
    );
  }

  return {};
}

export async function subscriptionActive(user: User) {
  if (!user.stripeSubscriptionId) return false;
  if (user.stripeSubscriptionStatus == "canceled") return false;

  return true;
}

export async function handleSubscriptionCreated(
  stripeCustomerId: User["stripeCustomerId"],
  subscription: any
) {
  await prisma.user.update({
    where: { id: subscription.metadata.userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    },
  });
}

export async function updateSubscriptionStatus(id: User["id"], status: string) {
  await prisma.user.update({
    where: { id },
    data: {
      stripeSubscriptionStatus: status,
    },
  });
}
