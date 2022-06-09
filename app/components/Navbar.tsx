import type { Feed } from "@prisma/client";
import { Link } from "@remix-run/react";
import { Form } from "@remix-run/react";
import type { Auth0Profile } from "remix-auth-auth0";
export default function Navbar({
  user,
  feeds,
}: {
  user: Auth0Profile | null;
  feeds: Feed[] | null;
}) {
  return (
    <div>
      {user && (
        <div>
          <Form method="post" action="/logout">
            <button type="submit">Log Out</button>
          </Form>
          <Link to="/feeds/view">View Unread Items</Link>
          <Link to="/feeds/viewall">View All Items</Link>
          <Link to="/feeds/addfeed">add Feed</Link>
          {feeds?.map((f) => {
            return (
              <Link key={f.id} to={`/feeds/view/${f.id}`}>
                {f.title}
              </Link>
            );
          })}
        </div>
      )}
      {!user && (
        <div>
          <Link to="/login">Log In</Link>
        </div>
      )}
    </div>
  );
}
