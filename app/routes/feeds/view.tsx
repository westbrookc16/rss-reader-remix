import type { DisplayItem } from "~/types/DisplayItem";
import type { LoaderFunction } from "@remix-run/node";
import { prisma } from "~/db.server";
import { auth } from "~/utils/auth.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import ViewFeeds from "~/components/ViewFeeds";

type LoaderData = { items: DisplayItem[] };
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
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
  return json<LoaderData>({ items });
};
export default function View() {
  const { items } = useLoaderData<LoaderData>();
  //const uniqueFeeds = [...new Set(items.map((item) => item.feedTitle))];
  return <ViewFeeds items={items} />;
}
