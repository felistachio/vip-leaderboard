import { and, count, eq, gte, inArray, lte, max, min } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { groupBy } from "es-toolkit";
import type { DataRow } from "@/components/DataBarTable";
import type { TimeSeries } from "@/components/TimeChart";
import type { Maybe } from "@/utils/types";
import { fromEntries, pick, values } from "../utils/object";
import type { YyyyMm } from "../utils/time";
import { type ActivityType, activityTypes } from "./activity";
import { activity, user } from "./schema";

const userFields = pick(user, ["id", "name", "avatarUrl", "color"]);

export type User = typeof user.$inferSelect;
export function getUser(
	db: BaseSQLiteDatabase<"sync", any>,
	userId: string,
): Maybe<User> {
	return db.select(userFields).from(user).where(eq(user.id, userId)).get();
}

interface UserActivity {
	lastActiveMonth: YyyyMm;
	firstActiveMonth: YyyyMm;
}
export const userSortBy =
	<U extends UserActivity>(getValue: (user: U) => number) =>
	(a: U, b: U) =>
		getValue(b) - getValue(a) ||
		b.lastActiveMonth.localeCompare(a.lastActiveMonth) ||
		b.firstActiveMonth.localeCompare(a.firstActiveMonth);

export interface UserStatsParams {
	since?: YyyyMm;
	until?: YyyyMm;
}
export interface UserStats
	extends User,
		UserActivity,
		DataRow<ActivityType | "total"> {}
export function getUserStats(
	db: BaseSQLiteDatabase<"sync", any>,
	{ since, until }: UserStatsParams,
): UserStats[] {
	const rows = db
		.select({
			...userFields,
			count: count(activity.month),
			type: activity.type,
			firstMonth: min(activity.month),
			lastMonth: max(activity.month),
		})
		.from(activity)
		.innerJoin(user, eq(user.id, activity.userId))
		.where(
			and(
				since ? gte(activity.month, since) : undefined,
				until ? lte(activity.month, until) : undefined,
			),
		)
		.groupBy(user.id, activity.type)
		.all();

	return Object.entries(groupBy(rows, (r) => r.id)).map(([id, rows]) => {
		const { name, color, avatarUrl } = rows[0]!;

		const activitiesCount = fromEntries(
			activityTypes.map((type) => [
				type,
				rows.find((r) => r.type === type)?.count ?? 0,
			]),
		);
		const total = values(activitiesCount).reduce((sum, v) => sum + v, 0);
		const data = { ...activitiesCount, total };

		const firstActiveMonth = rows
			.map((r) => r.firstMonth!)
			.reduce((min, d) => (d < min ? d : min));
		const lastActiveMonth = rows
			.map((r) => r.lastMonth!)
			.reduce((max, d) => (d > max ? d : max));

		return {
			id,
			name,
			color,
			avatarUrl,
			data,
			lastActiveMonth,
			firstActiveMonth,
		};
	});
}

export interface UserMonthlyCountParams extends UserStatsParams {
	types?: ActivityType[];
}
export interface UserMonthlyCount extends User, TimeSeries {
	total: number;
}
export function getUserMonthlyCount(
	db: BaseSQLiteDatabase<"sync", any>,
	{ since, until, types }: UserMonthlyCountParams,
): UserMonthlyCount[] {
	const rows = db
		.select({
			...userFields,
			month: activity.month,
			count: count().as("count"),
			firstMonth: min(activity.month),
			lastMonth: max(activity.month),
		})
		.from(activity)
		.innerJoin(user, eq(user.id, activity.userId))
		.where(
			and(
				since ? gte(activity.month, since) : undefined,
				until ? lte(activity.month, until) : undefined,
				types?.length ? inArray(activity.type, types) : undefined,
			),
		)
		.groupBy(activity.userId, activity.month)
		.all();

	const users = Object.entries(groupBy(rows, (r) => r.id)).map(([id, rows]) => {
		const { name, color, avatarUrl } = rows[0]!;

		const total = rows.reduce((sum, r) => sum + r.count, 0);
		const data = rows.map((r) => ({
			month: r.month as YyyyMm,
			value: r.count,
		}));

		const firstActiveMonth = rows
			.map((r) => r.firstMonth!)
			.reduce((min, m) => (m < min ? m : min));

		const lastActiveMonth = rows
			.map((r) => r.lastMonth!)
			.reduce((max, m) => (m > max ? m : max));

		return {
			id,
			name,
			color,
			avatarUrl,
			total,
			data,
			firstActiveMonth,
			lastActiveMonth,
		};
	});

	// total here doesn't refer to actual total,
	// but sum of the specified types (default all types)
	return users.sort(userSortBy((u) => u.total));
}
