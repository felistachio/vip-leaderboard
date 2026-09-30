import type { DataRow } from "@/components/DataBarTable";
import type { TimeSeries } from "@/components/TimeChart";
import { entries } from "@/utils/object";
import type { YyyyMm } from "@/utils/time";
import type { Data } from "./types";

export const activityTypes = ["report", "warning", "ban"] as const;
export type ActivityType = (typeof activityTypes)[number];

export const activityLabels = {
	report: "Reports",
	warning: "Warnings",
	ban: "Bans",
	total: "Total",
} as const satisfies Record<ActivityType | "total", string>;
export const activityIcons = {
	report: "✅",
	warning: "⚠️",
	ban: "🔨",
} as const satisfies Record<ActivityType, string>;
export const activityColors = {
	report: "#5cc639",
	warning: "#ffbf00",
	ban: "#ff6673",
	total: "#6e9cf7",
} as const satisfies Record<ActivityType | "total", string>;

type ActivityParams = {
	readonly since?: YyyyMm;
	readonly until?: YyyyMm;
	readonly user?: string;
};

export interface ActivityStats extends DataRow<"count"> {
	readonly type: ActivityType | "total";
}

export function getActivityStats(
	{ monthCount, monthIndices, users }: Data,
	{ since, until, user }: ActivityParams,
): ActivityStats[] {
	const sinceIdx = since ? (monthIndices[since] ?? 0) : 0;
	const untilIdx = until
		? (monthIndices[until] ?? monthCount - 1)
		: monthCount - 1;

	const typeCounts = { report: 0, warning: 0, ban: 0, total: 0 };
	const filteredUsers = user ? users.filter((u) => u.id === user) : users;
	for (const { activeMonths, counts } of filteredUsers) {
		if (
			activeMonths[0]! > untilIdx ||
			activeMonths[activeMonths.length - 1]! < sinceIdx
		) {
			continue;
		}
		counts.forEach(([r, w, b], k) => {
			const i = activeMonths[k]!;
			if (sinceIdx <= i && i <= untilIdx) {
				typeCounts.report += r;
				typeCounts.warning += w;
				typeCounts.ban += b;
				typeCounts.total += r + w + b;
			}
		});
	}

	return entries(typeCounts).map(([type, count]) => ({
		type,
		data: { count },
	}));
}

export interface ActivityMonthlyCount extends TimeSeries {
	readonly type: ActivityType;
	readonly count: number;
}

export function getActivityMonthlyCount(
	data: Data,
	{ since, until, user }: ActivityParams,
): ActivityMonthlyCount[] {
	// will be used for per-user chart
	return "TODO" as any;
}
