import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { addToInstapaper } from "~/utils/instapaper.server";
import { prisma } from "~/db.server";
import { auth } from "~/utils/auth.server";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useTransition } from "@remix-run/react";

import ViewFeeds from "~/components/ViewFeeds";
import type { DisplayItem } from "~/types/DisplayItem";
import invariant from "tiny-invariant";
import { addToPocket } from "~/utils/pocket.server";
type LoaderData = {
  items: DisplayItem[];
  accessToken: string | null;
  instapaperUser: string | null;
};
type ActionData = { msg: string };
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
  invariant(dbUser, "User not found.");
  const { accessToken, instapaperUser } = dbUser;
  const items = await prisma.$queryRaw<
    DisplayItem[]
  >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${user.id} order by f."title",i."createdAt" desc`;
  //get feeds into readItems
  /*for (const f of items) {
    await prisma.readItem.create({
      data: {
        user: { connect: { id: user.id } },
        item: { connect: { id: f.id } },
      },
    });
  }*/
  return json<LoaderData>({ items, accessToken, instapaperUser });
};
export const action: ActionFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request.clone(), {
    failureRedirect: "/login",
  });
  const data = await request.formData();
  const _action = data.get("_action");
  const url = data.get("url");
  const title = data.get("title");
  invariant(title && typeof title === "string", "title must be a string");
  invariant(url && typeof url === "string", "url must be a string");
  const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
  invariant(dbUser, "User not found.");

  if (_action === "pocket") {
    invariant(dbUser.accessToken, "Access Token NOt Found.");
    const { accessToken } = dbUser;
    addToPocket(accessToken, title, url);
    return json<ActionData>({ msg: "Your story was added successfully." });
  } else if (_action === "instapaper") {
    const { instapaperUser, instapaperPassword } = dbUser;
    invariant(
      instapaperUser && typeof instapaperUser === "string",
      "instapaper user must be found."
    );
    invariant(
      typeof instapaperPassword === "string",
      "password must be a string"
    );
    addToInstapaper(instapaperUser, instapaperPassword, url, title);
    return json<ActionData>({ msg: "Your story was added successfully." });
  }
};
export default function View() {
  const { items, accessToken, instapaperUser } = useLoaderData<LoaderData>();
  //const uniqueFeeds = [...new Set(items.map((item) => item.feedTitle))];
  const transition = useTransition();
  const { msg } = useActionData<ActionData>() || { msg: "" };
  return (
    <div>
      <ViewFeeds
        items={items}
        accessToken={accessToken}
        instapaperUser={instapaperUser}
      />

      {transition.state === "idle" && <div role="alert">{msg}</div>}

      <div role="alert" className="sr-only">
        View All Items Loaded
      </div>
    </div>
  );
}
