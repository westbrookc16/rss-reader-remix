import { prisma } from "~/db.server";
const cron = require("node-cron");
cron.schedule("*/30 * * * *", async () => {
  const feeds = await prisma.feed.findMany();
  //parse each feed item and insert into db
  for (const feed of feeds) {
    try {
      const Parser = require("rss-parser");
      const parser = new Parser();
      const rss = await parser.parseURL(feed.url);
      for (const i of rss.items) {
        const existingFeed = await prisma.item.findMany({
          where: { url: i.link },
        });
        if (existingFeed.length === 0) {
          await prisma.item.create({
            data: {
              description: i.content,
              url: i.link,
              title: i.title,
              feed: { connect: { id: feed.id } },
            },
          });
        }
        //console.log(JSON.stringify(i, null, 2));
      }
    } catch (e) {
      console.log(e);
    }
  }
  console.log("success");
  return { success: true };
});
