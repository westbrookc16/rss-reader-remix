import ViewFeeds from "~/components/ViewFeeds";
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { DisplayItem } from "~/types/DisplayItem";
import { auth, requirePaidUserId } from "~/utils/auth.server";
import { useActionData, useLoaderData, useTransition } from "@remix-run/react";
import invariant from "tiny-invariant";
import { addToPocket } from "~/utils/pocket.server";

import { addToInstapaper } from "~/utils/instapaper.server";
type LoaderData = {
  items: DisplayItem[];
  accessToken: string | null;
  instapaperUser: string | null;
};
type ActionData = { msg: string };

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
export const loader: LoaderFunction = async ({ params, request }) => {
  const { id, status } = params;
  const user = await requirePaidUserId(request);
  invariant(id, "ID must be set.");
  invariant(status && typeof status === "string", "Status must be set.");
  let items: DisplayItem[] = [];
  //get access token
  const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
  invariant(dbUser, "User not found.");
  const { accessToken, instapaperUser } = dbUser;
  if (status === "unread") {
    if (parseInt(id) > 0)
      items = await prisma.$queryRaw<
        DisplayItem[]
      >`select f."title" as "feedTitle", c.name as "categoryName", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${
        user.id
      } inner join "Category" c on c.id=s."categoryId" left outer join "ReadItem" r on r."itemId"=i."id" and r."userId"=s."userId" where r."itemId" is null and s."categoryId"=${parseInt(
        id
      )} order by f."title",i."createdAt" desc`;
    else
      items = await prisma.$queryRaw<
        DisplayItem[]
      >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${user.id} left outer join "ReadItem" r on r."itemId"=i.id and r."userId"=s."userId" where r."itemId" is null and s."categoryId" is null order by f."title",i."createdAt" desc`;
  } else if (status === "all") {
    if (parseInt(id) > 0)
      items = await prisma.$queryRaw<
        DisplayItem[]
      >`select f."title" as "feedTitle", i.*, c.name as "categoryName" from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${
        user.id
      } inner join "Category" c on c.id=s."categoryId" where s."categoryId"=${parseInt(
        id
      )} order by f."title",i."createdAt" desc`;
    else
      items = await prisma.$queryRaw<
        DisplayItem[]
      >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${user.id} where s."categoryId" is null order by f."title",i."createdAt" desc`;
  }
  if (status === "unread") {
    for (let i of items) {
      await prisma.readItem.create({
        data: {
          user: { connect: { id: user.id } },
          item: { connect: { id: i.id } },
        },
      });
    }
  }
  return json<LoaderData>({ items, accessToken, instapaperUser });
};
export default function ViewFeed() {
  const { items, accessToken, instapaperUser } = useLoaderData<LoaderData>();
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
        {items[0]?.categoryName} loaded
      </div>
    </div>
  );
}
