import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { requireUser } from "~/utils/auth.server";
import { createBillingSession } from "~/utils/subscription.server";

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);

  // create a customer portal session
  const url = await createBillingSession(user);

  // redirect to the customer portal
  return redirect(url);
};
