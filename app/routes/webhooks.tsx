import type { ActionFunction } from "@remix-run/node";
import { handleWebhook } from "~/utils/subscription.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    return await handleWebhook(request);
  } catch (e) {
    console.log(e);
    return e;
  }
};
