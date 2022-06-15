// @ts-nocheck
import { Link } from "@remix-run/react";
import { Form } from "@remix-run/react";
import type { Auth0Profile } from "remix-auth-auth0";
import type { CatWithUnreadCount } from "~/types/CatWithUnreadCount";

import { useRef, useEffect } from "react";

export default function Navbar({
  user,
  cats,
}: {
  user: Auth0Profile | null;
  cats: CatWithUnreadCount[] | null;
}) {
  const menu = useRef(null);
  const jsOpen = useRef(null);
  const jsClose = useRef(null);

  function toggleNav(status: string) {
    document.documentElement.classList.toggle("has-open-menu");

    if (status == "open") {
      menu.current.addEventListener("transitionend", () => {
        jsClose.current.focus();
      });
    }
    if (status == "close") {
      jsOpen.current.focus();
    }
  }

  /* ----------
   * Open & close menu on buttons click
   */
  const menuClick = (event) => {
    if (event.target == jsOpen.current) {
      toggleNav("open");
    } else if (
      event.target == jsClose.current ||
      !event.target.closest(".menu_list")
    ) {
      toggleNav("close");
    }
  };

  /* ----------
   * Close menu if focus is out of it
   */
  const menuBlur = (event) => {
    //console.log("CHECKING EVENT", event);
    // Check if the target link is an indirect child of .menu_list
    const targetIsIn = event.relatedTarget?.closest(".menu_list");

    if (
      document.documentElement.classList.contains("has-open-menu") &&
      !targetIsIn
    ) {
      document.documentElement.classList.remove("has-open-menu");
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      const escapeKey = 27;

      if (
        event.keyCode === escapeKey &&
        document.documentElement.classList.contains("has-open-menu")
      ) {
        document.documentElement.classList.remove("has-open-menu");
      }
    });
  });

  return (
    <>
      <header className="header w-full bg-sky-600 shadow-md text-white">
        {/*  <a className="logo" href=""></a> */}

        <nav
          ref={menu}
          id="menu"
          className="menu "
          onClick={menuClick}
          onBlur={menuBlur}
        >
          <button
            ref={jsOpen}
            className="menu_button menu_button--open js-open mx-4 "
            aria-label="Open menu"
            aria-expanded="false"
            type="button"
          >
            &#9776;
          </button>
          <div className="menu_list bg-sky-600">
            <button
              ref={jsClose}
              className="menu_button menu_button--close js-close"
              aria-label="Close menu"
              aria-expanded="true"
              type="button"
            >
              &times;
            </button>
            <div className="menu_list_inner">
              <div className="menu_item">
                <Link to="/">Home</Link>
              </div>
              {!user ? (
                <div className="menu_item">
                  <Link to="/login">Log In</Link>
                </div>
              ) : (
                <>
                  <div className="menu_item">
                    <Link to="/pocket">Connect to Pocket</Link>
                  </div>

                  <div className="menu_item">
                    <Link to="/instapaper">Instapaper Credentials</Link>
                  </div>

                  <Form className="menu_item" method="post" action="/logout">
                    <button type="submit">Log Out</button>
                  </Form>
                </>
              )}
              <div className="menu_item">
                <a href="https://www.paypal.com/donate/?hosted_button_id=HE7TW355VHB5L">
                  Donate with Paypal
                </a>
              </div>
            </div>

            <div className="menu_list_inner bg-white text-black">
              {user && (
                <>
                  <div className="menu_item">
                    <Link to="/feeds/view">View Unread Items</Link>
                  </div>

                  <div className="menu_item">
                    <Link to="/feeds/viewall">View All Items</Link>
                  </div>

                  <div className="menu_item">
                    <Link to="/feeds/addfeed">Add Feed</Link>
                  </div>

                  <div className="menu_item">
                    <Link to="/feeds/manage">Manage Categories</Link>
                  </div>
                </>
              )}
            </div>
            <div className="menu_list_inner">
              {user && (
                <>
                  {cats?.map((f) => {
                    return (
                      <div key={f.id} className="menu_item">
                        <Link to={`/cats/view/${f.id}/unread`}>
                          {f.name}({f.unreadCount})
                        </Link>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
      {/* <div className="w-full flex bg-sky-600 drop-shadow-md px-4 py-3 justify-center items-center text-white gap-x-3">
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
      </div> */}
    </>
  );
}
