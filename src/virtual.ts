declare module "virtual:db" {
	import type { ActivityStats } from "@/db/activity";
	import type { User, UserStats, UserStatsParams } from "@/db/user";
	import type { YyyyMm } from "@/utils/time";

	export const FIRST_MONTH: YyyyMm;
	export const LAST_MONTH: YyyyMm;
	export const ALL_MONTHS: readonly YyyyMm[];
	export const TWO_YEARS_AGO: YyyyMm;
	export const DEFAULT_TIME_RANGE: Required<UserStatsParams>;

	export const DEFAULT_ACTIVITY_STATS: readonly ActivityStats[];
	export const DEFAULT_USER_STATS: readonly UserStats[];
	export const ZACK: Readonly<User>;
}
