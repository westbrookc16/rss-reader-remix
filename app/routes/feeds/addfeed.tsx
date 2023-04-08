import invariant from "tiny-invariant";
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { prisma } from "~/db.server";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { auth, requirePaidUserId } from "~/utils/auth.server";
import type { Category } from "@prisma/client";
type LoaderData = { cats: Category[] };
export const loader: LoaderFunction = async ({ request }) => {
  const user = await requirePaidUserId(request);

  const cats = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ name: "asc" }],
  });
  return json<LoaderData>({ cats });
};
type ActionData = { msg: string };
export const action: ActionFunction = async ({ request }) => {
  const Parser = require("rss-parser");
  const parser = new Parser();

  const user = await auth.isAuthenticated(request.clone(), {
    failureRedirect: "/login",
  });
  const data = await request.formData();
  const url = data.get("url");
  const category = data.get("category");
  invariant(url && typeof url === "string", "url must be a string");
  invariant(
    category && typeof category === "string",
    "category must be a string"
  );
  let rssFeed;
  try {
    rssFeed = await parser.parseURL(url);
  } catch (e) {
    console.log(e);
    return json<ActionData>({
      msg: "There was an error parsing the feed. Make sure the url is correct.",
    });
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
    data: { feedId: feed.id, userId: user.id, categoryId: parseInt(category) },
  });
  return json({ success: true }, 200);
};
export default function AddFeed() {
  const transition = useTransition();
  const { msg } = useActionData<ActionData>() || { msg: "" };
  const { cats } = useLoaderData<LoaderData>();
  return (
    <div className="flex flex-col gap-y-4 justify-center items-center">
      <h1>Add Feed</h1>
      <Form
        className="flex flex-col gap-y-4 justify-center items-center"
        method="post"
      >
        <div className="flex flex-col gap-y-2 justify-center items-center">
          <label htmlFor="url">URL</label>
          <input type="text" id="url" name="url" />
        </div>

        <div className="flex flex-col gap-y-2 justify-center items-center">
          <label htmlFor="category">Category</label>
          <select id="category" name="category">
            {cats.map((c) => {
              return (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              );
            })}
          </select>
        </div>
        <button className="btn-sky-600" type="submit">
          add Feed
        </button>
      </Form>
      {transition.state === "idle" && <div role="alert">{msg}</div>}

      <div role="alert" className="sr-only">
        Add Feed Loaded
      </div>
    </div>
  );
}
