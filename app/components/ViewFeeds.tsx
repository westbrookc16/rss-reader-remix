import type { DisplayItem } from "~/types/DisplayItem";
import React from "react";
import { Form } from "@remix-run/react";
export default function ViewFeeds({
  items,
  accessToken,
  instapaperUser,
}: {
  items: DisplayItem[];
  accessToken: string | null;
  instapaperUser: string | null;
}) {
  let flag: number = 0;
  let title: string = "";
  return (
    <div>
      <h1>View Feeds</h1>
      {items.map((i) => {
        if (i.feedTitle !== title) {
          flag = 0;
          title = i.feedTitle;
        }
        if (flag > 0)
          return (
            <React.Fragment key={i.id}>
              <h3>
                <a target="_blank" rel="noreferrer" href={`${i.url}`}>
                  {i.title}
                </a>
              </h3>
              {(accessToken || instapaperUser) && (
                <Form method="post">
                  <input type="hidden" name="title" value={i.title} />
                  <input type="hidden" name="url" value={i.url} />

                  {accessToken && (
                    <button type="submit" name="_action" value="pocket">
                      Add to Pocket
                    </button>
                  )}
                  {instapaperUser && (
                    <button type="submit" name="_action" value="instapaper">
                      Add to Instapaper
                    </button>
                  )}
                </Form>
              )}
              <div dangerouslySetInnerHTML={{ __html: i.description }} />
            </React.Fragment>
          );
        else {
          flag++;
          return (
            <React.Fragment key={i.id}>
              <h2>{i.feedTitle}</h2>
              <h3>
                <a target="_blank" rel="noreferrer" href={`${i.url}`}>
                  {i.title}
                </a>
              </h3>
              {(accessToken || instapaperUser) && (
                <Form method="post">
                  <input type="hidden" name="title" value={i.title} />
                  <input type="hidden" name="url" value={i.url} />

                  {accessToken && (
                    <button type="submit" name="_action" value="pocket">
                      Add to Pocket
                    </button>
                  )}

                  {instapaperUser && (
                    <button type="submit" name="_action" value="instapaper">
                      Add to Instapaper
                    </button>
                  )}
                </Form>
              )}
              <div dangerouslySetInnerHTML={{ __html: i.description }} />
            </React.Fragment>
          );
        } //ending if;
      })}
    </div>
  );
}
