import { zip } from "es-toolkit";
import { type ActivityType, activityTypes } from "@/data/activity";
import type {
	StoredData,
	UserActivities,
	User as UserData,
} from "@/data/types";
import { map } from "@/utils/array";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import { readJson, writeJson } from "./file-utils";

export type ActivityData = {
	readonly month: YyyyMm;
	readonly userId: string;
	readonly type: ActivityType;
};

/**
 * Save this entire data set, override existing data if exists.
 */
export async function saveData({ users, activities }: Data): Promise<void> {
	const activityCounts: UserMonthlyCount = new Map();
	activities.forEach(accumulate(activityCounts));

	const userInfo = new Map(users.map((user) => [user.id, user]));
	await writeJson(DATA_PATH, buildStoredData(userInfo, activityCounts));
}

/**
 * Append this data set to existing data.
 * Assume data already exists and is in the correct format.
 */
export async function appendData({ users, activities }: Data): Promise<void> {
	const stored = await readJson<StoredData>(DATA_PATH);
	const storedMonths = monthsInRange(...stored.monthRange);

	const activityCounts: UserMonthlyCount = new Map();
	const userInfo = new Map<string, UserData>();
	for (const { activeMonths, counts, ...user } of stored.users) {
		userInfo.set(user.id, user);
		const byMonth = getUserCount(activityCounts, user.id);
		for (const [i, [report, warning, ban]] of zip(activeMonths, counts)) {
			byMonth.set(storedMonths[i]!, { report, warning, ban });
		}
	}

	for (const user of users) {
		userInfo.set(user.id, user);
	}
	activities.forEach(accumulate(activityCounts));

	await writeJson(DATA_PATH, buildStoredData(userInfo, activityCounts));
}

type Data = {
	readonly users: readonly UserData[];
	readonly activities: readonly ActivityData[];
};

const DATA_PATH = "../public/data.json";

type Count = Record<ActivityType, number>;
type MonthlyCount = Map<YyyyMm, Count>;
type UserMonthlyCount = Map<UserData["id"], MonthlyCount>;

const getUserCount = (
	counts: UserMonthlyCount,
	userId: string,
): MonthlyCount => {
	const existing = counts.get(userId);
	if (existing) {
		return existing;
	}
	const created: MonthlyCount = new Map();
	counts.set(userId, created);
	return created;
};

function accumulate(store: UserMonthlyCount) {
	return ({ userId, month, type }: ActivityData) => {
		const byMonth = getUserCount(store, userId);
		const bucket = byMonth.get(month) ?? { report: 0, warning: 0, ban: 0 };
		bucket[type] += 1;
		byMonth.set(month, bucket);
	};
}

const buildStoredData = (
	userInfo: Map<string, UserData>,
	activityCounts: UserMonthlyCount,
): StoredData => {
	let first: YyyyMm | undefined;
	let last: YyyyMm | undefined;
	for (const byMonth of activityCounts.values()) {
		for (const month of byMonth.keys()) {
			if (first === undefined || month < first) {
				first = month;
			}
			if (last === undefined || month > last) {
				last = month;
			}
		}
	}
	if (first === undefined || last === undefined) {
		throw new Error("Cannot store data: no activities were found.");
	}

	const months = monthsInRange(first, last);
	const monthIndex = new Map(months.map((month, i) => [month, i]));

	const users: (UserData & UserActivities)[] = [];
	for (const [id, user] of userInfo.entries()) {
		const monthlyCounts = activityCounts
			.get(id)
			?.entries()
			.toArray()
			.sort(([a], [b]) => a.localeCompare(b));
		if (!monthlyCounts?.length) {
			// drop users with no activities
			continue;
		}
		const activeMonths = monthlyCounts.map(([month]) => monthIndex.get(month)!);
		const counts = monthlyCounts.map(([, count]) =>
			map(activityTypes, (t) => count[t]),
		);
		users.push({ ...user, activeMonths, counts });
	}

	return { monthRange: [first, last], users };
};
