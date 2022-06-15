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
    <div className="flex flex-col gap-y-6 justify-center items-center">
      <h1>View Feeds</h1>
      {items.map((i) => {
        if (i.feedTitle !== title) {
          flag = 0;
          title = i.feedTitle;
        }
        if (flag > 0)
          return (
            <div
              key={i.id}
              className="max-w-sm flex flex-col gap-y-2 justify-center items-center border-b-2 border-sky-600 pb-4"
            >
              <h3>
                <a target="_blank" rel="noreferrer" href={`${i.url}`}>
                  {i.title}
                </a>
              </h3>
              {(accessToken || instapaperUser) && (
                <Form
                  className="flex justify-center items-center gap-x-2 py-2"
                  method="post"
                >
                  <input type="hidden" name="title" value={i.title} />
                  <input type="hidden" name="url" value={i.url} />

                  {accessToken && (
                    <button
                      type="submit"
                      className="btn-sky-600"
                      name="_action"
                      value="pocket"
                    >
                      Add to Pocket
                    </button>
                  )}
                  {instapaperUser && (
                    <button
                      type="submit"
                      className="btn-emerald-600"
                      name="_action"
                      value="instapaper"
                    >
                      Add to Instapaper
                    </button>
                  )}
                </Form>
              )}
              <div
                className="px-3 lg:px-5 max-w-full w-full flex flex-col gap-3 article-content"
                dangerouslySetInnerHTML={{ __html: i.description }}
              />
            </div>
          );
        else {
          flag++;
          return (
            <div
              key={i.id}
              className="max-w-sm flex flex-col gap-y-2 justify-center items-center border-b-2 border-sky-600 pb-4"
            >
              <h2 className="mb-4">{i.feedTitle}</h2>
              <h3>
                <a target="_blank" rel="noreferrer" href={`${i.url}`}>
                  {i.title}
                </a>
              </h3>
              {(accessToken || instapaperUser) && (
                <Form
                  className="flex justify-center items-center gap-x-2 py-2"
                  method="post"
                >
                  <input type="hidden" name="title" value={i.title} />
                  <input type="hidden" name="url" value={i.url} />

                  {accessToken && (
                    <button
                      type="submit"
                      className="btn-sky-600"
                      name="_action"
                      value="pocket"
                    >
                      Add to Pocket
                    </button>
                  )}

                  {instapaperUser && (
                    <button
                      type="submit"
                      className="btn-emerald-600"
                      name="_action"
                      value="instapaper"
                    >
                      Add to Instapaper
                    </button>
                  )}
                </Form>
              )}
              <div
                className="px-3 lg:px-5 max-w-full w-full flex flex-col gap-3 article-content"
                dangerouslySetInnerHTML={{ __html: i.description }}
              />
            </div>
          );
        } //ending if;
      })}
    </div>
  );
}
