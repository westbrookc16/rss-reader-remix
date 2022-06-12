import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { prisma } from "~/db.server";
import { auth } from "~/utils/auth.server";
export const action: ActionFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const body = await fetch("https://getpocket.com/v3/oauth/request", {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Accept": "application/json",
    },
    body: JSON.stringify({
      consumer_key: process.env.POCKET_CONSUMER_KEY,
      redirect_uri: `${process.env.BASE_URL}pocket/callback`,
    }),
  });
  const data = await body.json();
  await prisma.user.update({
    data: { requestToken: data.code },
    where: { id: user.id },
  });

  const redirectUri = `${process.env.BASE_URL}pocket/callback`;
  const url = `https://getpocket.com/auth/authorize?request_token=${data.code}&redirect_uri=${redirectUri}`;
  return redirect(url);
};
export default function PocketIndex() {
  return (
    <div>
      <h1>Connect Pocket</h1>
      Pocket is a way to save articles for later reading.
      <Form method="post">
        <button type="submit">
          Click here to connect accessible-rss.com to pocket.
        </button>
      </Form>
    </div>
  );
}
