import type { Item } from "@prisma/client";
export type DisplayItem = Item & { feedTitle: string; categoryName?: string };
