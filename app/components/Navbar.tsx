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
    <>
      <header className="header container">
        {/*  <a className="logo" href=""></a> */}

        <nav id="menu" className="menu">
          <button
            className="menu_button menu_button--open js-open"
            aria-label="Open menu"
            aria-expanded="false"
            type="button"
          >
            &#9776;
          </button>
          <div className="menu_list">
            <button
              className="menu_button menu_button--close js-close"
              aria-label="Close menu"
              aria-expanded="true"
              type="button"
            >
              &times;
            </button>
            <ul className="menu_list_inner">
              <li className="menu_item">
                <a aria-current="page" href="">
                  Home
                </a>
              </li>
              <li className="menu_item">
                <a href="">Item 1</a>
              </li>
              <li className="menu_item">
                <a href="">Item 2</a>
              </li>
              <li className="menu_item">
                <a href="">Item 3</a>
              </li>
              <li className="menu_item">
                <a href="">Contact</a>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      <div className="w-full flex bg-sky-600 drop-shadow-md px-4 py-3 justify-center items-center text-white gap-x-3">
        <Link to="/">Home</Link>
        {!user ? (
          <>
            <Link to="/login">Log In</Link>
          </>
        ) : (
          <>
            <Link to="/pocket">Connect to Pocket</Link>
            <Link to="/instapaper">Instapaper Credentials</Link>
            <Form method="post" action="/logout">
              <button type="submit">Log Out</button>
            </Form>
          </>
        )}
      </div>
      <div className="w-full flex drop-shadow-md px-4 py-3 justify-center items-center gap-x-3">
        {user && (
          <>
            <Link to="/feeds/view">View Unread Items</Link>
            <Link to="/feeds/viewall">View All Items</Link>
            <Link to="/feeds/addfeed">Add Feed</Link>
            <Link to="/feeds/manage">Manage Categories</Link>
          </>
        )}
      </div>
      <div className="w-full flex bg-sky-600 drop-shadow-md px-4 py-3 justify-center items-center text-white gap-x-3">
        {user && (
          <>
            {cats?.map((f) => {
              return (
                <Link key={f.id} to={`/cats/view/${f.id}/unread`}>
                  {f.name}({f.unreadCount})
                </Link>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
