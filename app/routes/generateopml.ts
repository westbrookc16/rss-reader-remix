import type { LoaderFunction } from "@remix-run/node";
import { prisma } from "~/db.server";

import { auth } from "~/utils/auth.server";
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const opml = require("opml-generator");
  var header = {
    title: "opml file",
    dateCreated: new Date(),
    ownerName: user.displayName,
  };
  var outlines: any[] = [];
  const feeds = await prisma.feed.findMany({
    where: { Subscribe: { some: { userId: user.id } } },
    //include: { Subscribe: { where: { userId: user.id } } },
  });
  for (const f of feeds) {
    outlines.push({
      text: f.description,
      title: f.title,
      type: "rss",
      xmlUrl: f.url,
      htmlUrl: f.url,
    });
  }
  const xml = opml(header, outlines); // => XML

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "content-disposition": "attachment;filename=opml.opml",
    },
  });
};
