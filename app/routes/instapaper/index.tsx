import { Form, useLoaderData } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/db.server";
import invariant from "tiny-invariant";
//type ActionData = { msg: string };
type LoaderData = { email: string };
export const action: ActionFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request.clone(), {
    failureRedirect: "/login",
  });
  const data = await request.formData();
  const instapaperUser = data.get("instapaperUser");
  const instapaperPassword = data.get("instapaperPassword");
  invariant(
    instapaperPassword && typeof instapaperPassword === "string",
    "Password must be a string"
  );
  invariant(
    instapaperUser && typeof instapaperUser === "string",
    "user must be a string"
  );
  await prisma.user.update({
    data: { instapaperPassword, instapaperUser },
    where: { id: user.id },
  });
  return redirect("/");
};
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  return json<LoaderData>({ email: user.emails[0].value });
};
export default function InstapaperFields() {
  const { email } = useLoaderData<LoaderData>();
  return (
    <Form
      className="flex flex-col gap-y-4 justify-center items-center text-center"
      method="post"
    >
      <h1>Instapaper Credentials</h1>
      <div className="flex flex-col justify-center items-center gap-y-2">
        <label htmlFor="instapaperUser">Username/Email</label>
        <input
          type="text"
          name="instapaperUser"
          id="instapaperUser"
          defaultValue={email}
        />
      </div>

      <div className="flex flex-col justify-center items-center gap-y-2">
        <label htmlFor="instapaperPassword">Password (if you have one)</label>
        <input type="text" id="instapaperPassword" name="instapaperPassword" />
      </div>

      <button type="submit" className="btn-sky-600">
        Submit
      </button>
    </Form>
  );
}
