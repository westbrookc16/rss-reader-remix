import type { DisplayItem } from "~/types/DisplayItem";
import type { ActionFunction } from "@remix-run/node";
import { addToPocket } from "~/utils/pocket.server";
import type { LoaderFunction } from "@remix-run/node";
import { prisma } from "~/db.server";
import { auth } from "~/utils/auth.server";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useTransition } from "@remix-run/react";
import React from "react";
import ViewFeeds from "~/components/ViewFeeds";
import invariant from "tiny-invariant";
type ActionData = { msg: string };
type LoaderData = { items: DisplayItem[]; accessToken: string | null };
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
  invariant(dbUser, "User not found.");
  const { accessToken } = dbUser;
  const items = await prisma.$queryRaw<
    DisplayItem[]
  >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${user.id} left outer join "ReadItem" r on r."itemId"=i.id and r."userId"=${user.id} where r."itemId" is null order by f."title",i."createdAt" desc`;
  //get feeds into readItems
  for (const f of items) {
    await prisma.readItem.create({
      data: {
        user: { connect: { id: user.id } },
        item: { connect: { id: f.id } },
      },
    });
  }
  return json<LoaderData>({ items, accessToken });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request.clone(), {
    failureRedirect: "/login",
  });
  const data = await request.formData();
  const _action = data.get("_action");
  if (_action === "pocket") {
    const url = data.get("url");
    const title = data.get("title");
    invariant(title && typeof title === "string", "title must be a string");
    invariant(url && typeof url === "string", "url must be a string");
    const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
    invariant(dbUser, "User not found.");
    invariant(dbUser.accessToken, "Access Token NOt Found.");
    const { accessToken } = dbUser;
    addToPocket(accessToken, title, url);
    return json<ActionData>({ msg: "Your story was added successfully." });
  }
};
export default function View() {
  const { items, accessToken } = useLoaderData<LoaderData>();
  //const uniqueFeeds = [...new Set(items.map((item) => item.feedTitle))];
  const transition = useTransition();
  const { msg } = useActionData<ActionData>() || { msg: "" };
  return (
    <div>
      <ViewFeeds items={items} accessToken={accessToken} />
      {transition.state === "idle" && <div role="alert">{msg}</div>}
    </div>
  );
}
