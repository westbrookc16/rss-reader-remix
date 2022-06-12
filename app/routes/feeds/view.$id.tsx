import ViewFeeds from "~/components/ViewFeeds";
import { prisma } from "~/db.server";
import { addToPocket } from "~/utils/pocket.server";
import { json } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import type { DisplayItem } from "~/types/DisplayItem";
import { auth } from "~/utils/auth.server";
import { useActionData, useLoaderData, useTransition } from "@remix-run/react";
import invariant from "tiny-invariant";
type ActionData = { msg: string };

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
type LoaderData = { items: DisplayItem[]; accessToken: string | null };
export const loader: LoaderFunction = async ({ params, request }) => {
  const { id } = params;
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  invariant(id, "ID must be set.");
  const dbUser = await prisma.user.findFirst({ where: { id: user.id } });
  invariant(dbUser, "User not found.");
  const { accessToken } = dbUser;
  const items = await prisma.$queryRaw<
    DisplayItem[]
  >`select f."title" as "feedTitle", i.* from "Item" i inner join "Feed" f on f.id=i."feedId" inner join "Subscribe" s on s."feedId"=i."feedId" and s."userId"=${
    user.id
  } where s."feedId"=${parseInt(id)} order by f."title",i."createdAt" desc`;
  return json<LoaderData>({ items, accessToken });
};
export default function ViewFeed() {
  const { items, accessToken } = useLoaderData<LoaderData>();
  const transition = useTransition();
  const { msg } = useActionData<ActionData>() || { msg: "" };
  return (
    <div>
      <ViewFeeds items={items} accessToken={accessToken} />
      {transition.state === "idle" && <div role="alert">{msg}</div>}
    </div>
  );
}
