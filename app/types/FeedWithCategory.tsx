import type { Feed } from "@prisma/client";
export type FeedWithCategory = Feed & { categoryId: number | null };
