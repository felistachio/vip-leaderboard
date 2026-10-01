declare module "virtual:data" {
	import type { User } from "@/data/types";
	import type { UserStatsParams } from "@/data/user";
	import type { YyyyMm } from "@/utils/time";

	export const FIRST_MONTH: YyyyMm;
	export const LAST_MONTH: YyyyMm;
	export const ALL_MONTHS: readonly YyyyMm[];
	export const TWO_YEARS_AGO: YyyyMm;
	export const DEFAULT_TIME_RANGE: Required<UserStatsParams>;
	export const ZACK: User;
}
