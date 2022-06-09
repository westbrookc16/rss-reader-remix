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
import type { Feed } from "@prisma/client";
import { prisma } from "./db.server";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});
type LoaderData = { user: Auth0Profile | null; feeds: Feed[] | null };
export const loader: LoaderFunction = async ({ request }) => {
  let feeds: Feed[] = [];
  const user = await auth.isAuthenticated(request);
  if (user) {
    feeds = await prisma.$queryRaw<
      Feed[]
    >`select f.* from "Feed" f inner join "Subscribe" s on s."feedId"=f."id" and s."userId"=${user.id}`;
  }
  return json<LoaderData>({ user, feeds });
};
export default function App() {
  const { user, feeds } = useLoaderData<LoaderData>() || false;
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Navbar user={user} feeds={feeds} />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
