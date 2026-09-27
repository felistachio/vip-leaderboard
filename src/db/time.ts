import { asc, desc } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { activity } from "./schema";

export const getFirstDate = (db: BaseSQLiteDatabase<"sync", any>): Date =>
	db
		.select({ date: activity.date })
		.from(activity)
		.orderBy(asc(activity.date))
		.limit(1)
		.get()!.date;

export const getLastDate = (db: BaseSQLiteDatabase<"sync", any>): Date =>
	db
		.select({ date: activity.date })
		.from(activity)
		.orderBy(desc(activity.date))
		.limit(1)
		.get()!.date;
