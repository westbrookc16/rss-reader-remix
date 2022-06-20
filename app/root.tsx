import { json } from "@remix-run/node";
import { auth } from "~/utils/auth.server";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import type { Auth0Profile } from "remix-auth-auth0";
import Navbar from "./components/Navbar";

import { prisma } from "./db.server";
import type { CatWithUnreadCount } from "./types/CatWithUnreadCount";
import styles from "./styles/app.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}
export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Accessible-RSS.com",
  viewport:
    "width=device-width,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=0",
});
type LoaderData = {
  user: Auth0Profile | null;
  cats: CatWithUnreadCount[] | null;
};
export const loader: LoaderFunction = async ({ request }) => {
  let cats: CatWithUnreadCount[] = [];
  const user = await auth.isAuthenticated(request);
  if (user) {
    cats = await prisma.$queryRaw<
      CatWithUnreadCount[]
    >`select case when c.id is null then -1 else c.id end as id, case when c.name is null then 'Uncategorized' else c.name end as name, coalesce(sum(unreadCount),0) as "unreadCount" from "Category" c left outer join (select c.id, count(distinct i.id) as unreadCount from "Category" c inner join "Subscribe" s on s."categoryId"=c.id  and s."userId"=${user.id} and s."userId"=c."userId" left outer join "Item" i on i."feedId"=s."feedId" left outer join "ReadItem" r on r."itemId"=i.id and r."userId"=s."userId" where r."itemId" is null group by c.id)as counts on counts.id=c.id  where c."userId"=${user.id} group by case when c.id is null then -1 else c.id end, case when c.name is null then 'Uncategorized' else c.name end order by case when c.name is null then 'Uncategorized' else c.name end asc`;
  }
  return json<LoaderData>({ user, cats });
};
export default function App() {
  const { user, cats } = useLoaderData<LoaderData>() || false;
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col items-center">
        <Navbar user={user} cats={cats} />
        <main className=" px-5 xl:px-6 py-6 xl:py-12 max-w-5xl flex flex-col justify-center">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
