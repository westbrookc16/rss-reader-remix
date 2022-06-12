import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { auth } from "~/utils/auth.server";
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
  invariant(dbUser, "User not found.");
  const { requestToken } = dbUser;

  const config = {
    consumer_key: process.env.POCKET_CONSUMER_KEY,
    code: requestToken,
  };

  const body = await fetch("https://getpocket.com/v3/oauth/authorize", {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "x-accept": "application/json",
    },
    method: "post",
    body: JSON.stringify(config),
  });
  const data = await body.json();
  const { access_token } = data;
  await prisma.user.update({
    data: { accessToken: access_token },
    where: { id: user.id },
  });
  return json({});
};
export default function PocketCallback() {
  return (
    <div>
      <h1>Congratulations</h1>
      You have connected your account to pocket. Now you can save stories to
      your pocket account.
    </div>
  );
}
