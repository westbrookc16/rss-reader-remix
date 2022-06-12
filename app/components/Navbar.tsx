import { Link } from "@remix-run/react";
import { Form } from "@remix-run/react";
import type { Auth0Profile } from "remix-auth-auth0";
import type { CatWithUnreadCount } from "~/types/CatWithUnreadCount";
export default function Navbar({
  user,
  cats,
}: {
  user: Auth0Profile | null;
  cats: CatWithUnreadCount[] | null;
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

          <Link to="/feeds/manage">Manage Categories</Link>
          <Link to="/pocket">Connect to Pocket</Link>
          <Link to="/instapaper">Enter Instapaper Credentials</Link>
          {cats?.map((f) => {
            return (
              <Link key={f.id} to={`/cats/view/${f.id}/unread`}>
                {f.name}({f.unreadCount})
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
