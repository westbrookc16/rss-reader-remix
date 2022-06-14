import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { auth, getSession } from "~/utils/auth.server";

type LoaderData = {
  error: { message: string } | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  await auth.isAuthenticated(request, { successRedirect: "/" });
  const session = await getSession(request.headers.get("Cookie"));
  const error = session.get(auth.sessionErrorKey) as LoaderData["error"];
  return json<LoaderData>({ error });
};

export default function Screen() {
  const { error } = useLoaderData<LoaderData>();

  return (
    <Form
      className="flex flex-col max-w-xs gap-y-6 items-center text-center"
      method="post"
      action="/auth0"
    >
      {error ? <div>{error.message}</div> : null}
      Click the button below to log in with google or an email and password.
      <button className="btn-sky-600">Sign In with Auth0</button>
    </Form>
  );
}
