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

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});
type LoaderData = { user: Auth0Profile | null };
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request);
  return json<LoaderData>({ user });
};
export default function App() {
  const { user } = useLoaderData<LoaderData>() || false;
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Navbar user={user} />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
