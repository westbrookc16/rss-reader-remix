import invariant from "tiny-invariant";
import { Form, useActionData, useTransition } from "@remix-run/react";
import { prisma } from "~/db.server";
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { auth } from "~/utils/auth.server";
export const action: ActionFunction = async ({ request }) => {
  const Parser = require("rss-parser");
  const parser = new Parser();

  const user = await auth.isAuthenticated(request.clone(), {
    failureRedirect: "/login",
  });
  const data = await request.formData();
  const url = data.get("url");
  invariant(url && typeof url === "string", "url must be a string");
  let rssFeed;
  try {
    rssFeed = await parser.parseURL(url);
  } catch (e) {
    console.log(e);
    return json({ error: "There was an error." }, 400);
  }
  const title = rssFeed.title;
  const description = rssFeed.description;
  const feed = await prisma.feed.upsert({
    where: { url },
    create: { url, description, title },
    update: { title, description },
  });

  invariant(feed, "There must be a feed to subscribe to.");
  await prisma.subscribe.create({
    data: { feedId: feed.id, userId: user.id },
  });
  return json({ success: true }, 200);
};
export default function AddFeed() {
  const transition = useTransition();
  const { success } = useActionData() || false;
  return (
    <div>
      <h1>Add Feed</h1>
      <Form method="post">
        <label htmlFor="url">URL</label>
        <input type="text" id="url" name="url" />
        <button type="submit">add Feed</button>
      </Form>
      {success && transition.state === "idle" && (
        <div role="alert">Your feed was added successfully.</div>
      )}
    </div>
  );
}
