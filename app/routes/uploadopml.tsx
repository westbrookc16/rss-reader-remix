import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useTransition } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { auth } from "~/utils/auth.server";

type ActionData = { success: boolean; msg: string };
export const action: ActionFunction = async ({ request }) => {
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 500000,
  });
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const file: any = formData.get("opmlUpload");
  invariant(file, "File must not be null.");
  const opml = await file.text();
  //console.log(opml);
  const parser = require("node-opml-parser");
  try {
    parser(opml, async (err: any, items: any) => {
      //console.log(err);
      const user = await auth.isAuthenticated(request, {
        failureRedirect: "/login",
      });
      const cats = await prisma.category.findMany({
        where: { userId: user.id, name: "Uncategorized" },
      });
      const category: number = cats[0].id;
      console.log(items);
      for (const i of items) {
        const { title, feedUrl } = i;
        const feed = await prisma.feed.upsert({
          where: { url: feedUrl },
          create: { url: feedUrl, title },
          update: { title, url: feedUrl },
        });

        invariant(feed, "There must be a feed to subscribe to.");
        const subs = await prisma.subscribe.findMany({
          where: { userId: user.id, feedId: feed.id },
        });
        if (subs.length === 0)
          await prisma.subscribe.create({
            data: {
              feedId: feed.id,
              userId: user.id,
              categoryId: category,
            },
          });
      }
    });
    return json<ActionData>({
      success: true,
      msg: "Your file was imported successfully.",
    });
  } catch (e) {
    return json<ActionData>({
      success: false,
      msg: "There was an error importing your file.",
    });
  }
  // file is a "File" (https://mdn.io/File) polyfilled for node
};
export default function UploadOpml() {
  const transition = useTransition();
  const { msg } = useActionData<ActionData>() || {
    success: undefined,
    msg: "",
  };
  return (
    <div>
      <Form method="post" encType="multipart/form-data">
        <label htmlFor="opmlUpload">Upload OPML</label>
        <input type="file" name="opmlUpload" id="opmlUpload" />
        <button type="submit">Submit</button>
      </Form>
      {transition.state === "idle" && <div role="alert">{msg}</div>}

      <div role="alert" className="sr-only">
        Import OPML Loaded
      </div>
    </div>
  );
}
