import { asc, desc } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { YyyyMm } from "@/utils/time";
import { activity } from "./schema";

export const getFirstMonth = (db: BaseSQLiteDatabase<"sync", any>): YyyyMm =>
	db
		.select({ month: activity.month })
		.from(activity)
		.orderBy(asc(activity.month))
		.limit(1)
		.get()!.month;

export const getLastMonth = (db: BaseSQLiteDatabase<"sync", any>): YyyyMm =>
	db
		.select({ month: activity.month })
		.from(activity)
		.orderBy(desc(activity.month))
		.limit(1)
		.get()!.month;
