import type { DataRow } from "@/components/DataBarTable";
import type { TimeSeries } from "@/components/TimeChart";
import type { TimePoint } from "@/components/TimeChart/ChartWrapper";
import { map } from "@/utils/array";
import type { YyyyMm } from "@/utils/time";
import type { Maybe } from "@/utils/types";
import { type ActivityType, activityTypes } from "./activity";
import type { Data, User } from "./types";

export function getUser({ users }: Data, userId: string): Maybe<User> {
	return users.find(({ id }) => id === userId);
}

interface UserActivity {
	firstActiveMonth: YyyyMm;
	lastActiveMonth: YyyyMm;
}

export function userSortBy<U extends UserActivity>(fn: (user: U) => number) {
	return (a: U, b: U) =>
		fn(b) - fn(a) ||
		b.lastActiveMonth.localeCompare(a.lastActiveMonth) ||
		b.firstActiveMonth.localeCompare(a.firstActiveMonth);
}

export interface UserStatsParams {
	readonly since?: YyyyMm;
	readonly until?: YyyyMm;
}

export interface UserStats
	extends User,
		UserActivity,
		DataRow<ActivityType | "total"> {}

export function getUserStats(
	{ months, monthCount, monthIndices, users }: Data,
	{ since, until }: UserStatsParams,
): UserStats[] {
	const sinceIdx = since ? (monthIndices[since] ?? 0) : 0;
	const untilIdx = until
		? (monthIndices[until] ?? monthCount - 1)
		: monthCount - 1;

	const userStats: UserStats[] = [];
	for (const { activeMonths, counts, ...userInfo } of users) {
		if (
			activeMonths[0]! > untilIdx ||
			activeMonths[activeMonths.length - 1]! < sinceIdx
		) {
			continue;
		}
		const data = { report: 0, warning: 0, ban: 0, total: 0 };
		counts.forEach(([r, w, b], k) => {
			const i = activeMonths[k]!;
			if (sinceIdx <= i && i <= untilIdx) {
				data.report += r;
				data.warning += w;
				data.ban += b;
				data.total += r + w + b;
			}
		});
		if (data.total) {
			const firstActiveMonth = months[activeMonths[0]!]!;
			const lastActiveMonth = months[activeMonths[activeMonths.length - 1]!]!;
			userStats.push({ ...userInfo, firstActiveMonth, lastActiveMonth, data });
		}
	}
	return userStats;
}

export interface UserMonthlyCountParams extends UserStatsParams {
	readonly types?: readonly ActivityType[];
}

export interface UserMonthlyCount extends User, TimeSeries {
	readonly total: number;
}

export function getUserMonthlyCount(
	{ months, monthCount, monthIndices, users }: Data,
	{ since, until, types = activityTypes }: UserMonthlyCountParams,
): UserMonthlyCount[] {
	const sinceIdx = since ? (monthIndices[since] ?? 0) : 0;
	const untilIdx = until
		? (monthIndices[until] ?? monthCount - 1)
		: monthCount - 1;
	const weights = map(activityTypes, (t) => (types.includes(t) ? 1 : 0));

	const userMonthlyCounts: (UserMonthlyCount & UserActivity)[] = [];
	for (const { activeMonths, counts, ...userInfo } of users) {
		if (
			activeMonths[0]! > untilIdx ||
			activeMonths[activeMonths.length - 1]! < sinceIdx
		) {
			continue;
		}

		let total = 0;
		const data: TimePoint[] = [];
		for (let k = 0; k < counts.length; k++) {
			const i = activeMonths[k]!;
			if (i < sinceIdx || i > untilIdx) {
				continue;
			}
			const count = counts[k]!;
			const value =
				count[0] * weights[0] + count[1] * weights[1] + count[2] * weights[2];
			if (value) {
				total += value;
				data.push({ month: months[i]!, value });
			}
		}

		if (total) {
			const firstActiveMonth = months[activeMonths[0]!]!;
			const lastActiveMonth = months[activeMonths[activeMonths.length - 1]!]!;
			userMonthlyCounts.push({
				...userInfo,
				firstActiveMonth,
				lastActiveMonth,
				total,
				data,
			});
		}
	}
	return userMonthlyCounts.sort(userSortBy((u) => u.total));
}
