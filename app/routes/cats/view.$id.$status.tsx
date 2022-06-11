import ViewFeeds from "~/components/ViewFeeds";
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import type { DisplayItem } from "~/types/DisplayItem";
import { auth } from "~/utils/auth.server";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
type LoaderData = { items: DisplayItem[] };
export const loader: LoaderFunction = async ({ params, request }) => {
  const { id, status } = params;
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  invariant(id, "ID must be set.");
  invariant(status && typeof status === "string", "Status must be set.");
  let items: DisplayItem[] = [];
  if (status === "unread") {
    if (parseInt(id) > 0)
      items = await prisma.$queryRaw<
        DisplayItem[]
      >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${
        user.id
      } left outer join "ReadItem" r on r."itemId"=i."id" and r."userId"=s."userId" where r."itemId" is null and s."categoryId"=${parseInt(
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
      >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${
        user.id
      } where s."categoryId"=${parseInt(
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
  return json<LoaderData>({ items });
};
export default function ViewFeed() {
  const { items } = useLoaderData<LoaderData>();
  return <ViewFeeds items={items} />;
}
