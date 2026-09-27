declare module "virtual:db" {
	import type { ActivityStats } from "@/db/activity";
	import type { User, UserStats } from "@/db/user";

	export const FIRST_DATE: Date;
	export const LAST_DATE: Date;
	export const ZACK: NonNullable<User>;

	export const DEFAULT_ACTIVITY_STATS: ActivityStats[];
	export const DEFAULT_USER_STATS: UserStats[];
}
