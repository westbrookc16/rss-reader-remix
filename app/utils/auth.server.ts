import Stripe from "stripe";
import { activeSubscription } from "./subscription.server";
import { redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import { createCookieSessionStorage } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import type { Auth0Profile } from "remix-auth-auth0";
import { Auth0Strategy } from "remix-auth-auth0";

import {
  AUTH0_CALLBACK_URL,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_DOMAIN,
  SECRETS,
} from "~/constants/index.server";
import type { User } from "@prisma/client";
import invariant from "tiny-invariant";
invariant(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY must be defined");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_remix_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [SECRETS],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    domain: process.env.DOMAIN,
  },
});
const ensureStripeCustomer = async (user: User) => {
  // Check to see if there's a stripe customer ID on the user
  if (user.stripeCustomerId) {
    return;
  }

  const customerParams = {
    email: user.email,
    metadata: {
      userId: user.id,
    },
  };

  
  const customer = await stripe.customers.create(customerParams);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customer.id,
    },
  });
};

export const auth = new Authenticator<Auth0Profile>(sessionStorage);

const auth0Strategy = new Auth0Strategy(
  {
    callbackURL: AUTH0_CALLBACK_URL,
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    domain: AUTH0_DOMAIN,
  },
  async ({ profile }) => {
    //
    // Use the returned information to process or write to the DB.
    //
    const user = await prisma.user.upsert({
      create: { email: profile.emails[0].value, id: profile.id },
      where: { id: profile.id },
      update: { email: profile.emails[0].value },
    });
    //add stripe customer ID
    await ensureStripeCustomer(user);
    //add "uncategorized" category if none exists
    const cat = await prisma.category.findMany({
      where: { AND: [{ name: "Uncategorized" }, { userId: profile.id }] },
    });
    if (cat.length === 0) {
      await prisma.category.create({
        data: { name: "Uncategorized", user: { connect: { id: profile.id } } },
      });
    }
    return profile;
  }
);

auth.use(auth0Strategy);

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<string> {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  if (!user.id) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return user.id;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (user) return user;

  throw redirect("/login");
}
async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  invariant(user, "User must be defined.");
  return user;
}
export async function requirePaidUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<User> {
  const user = await requireUser(request);
  if (!user) {
    throw redirect("/login");
  }
  if (!(await activeSubscription(user))) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/pay?${searchParams}`);
  }
  return user;
}

export const { getSession, commitSession, destroySession } = sessionStorage;
