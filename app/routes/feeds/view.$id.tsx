import ViewFeeds from "~/components/ViewFeeds";
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import type { DisplayItem } from "./view";
import { auth } from "~/utils/auth.server";
import { useLoaderData } from "@remix-run/react";
type LoaderData = { items: DisplayItem[] };
export const loader: LoaderFunction = async ({ params, request }) => {
  const { id } = params;
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const items = await prisma.$queryRaw<
    DisplayItem[]
  >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${
    user.id
  } where s."feedId"=${parseInt(id)} order by f."title",i."createdAt" desc`;
  return json<LoaderData>({ items });
};
export default function ViewFeed() {
  const { items } = useLoaderData<LoaderData>();
  return <ViewFeeds items={items} />;
}
