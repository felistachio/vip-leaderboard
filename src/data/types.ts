import type { YyyyMm } from "@/utils/time";

export type User = {
	readonly id: string;
	readonly name: string;
	readonly avatarUrl: string;
	readonly color: string;
};

type ActivityCount = readonly [report: number, warning: number, ban: number];
export type UserActivities = {
	/** Month indices, sorted. Guaranteed not empty. */
	readonly activeMonths: readonly number[];
	/** Aligned with `activeMonths` */
	readonly counts: readonly ActivityCount[];
};

export type StoredData = {
	readonly monthRange: readonly [first: YyyyMm, last: YyyyMm];
	readonly users: readonly (User & UserActivities)[];
};

export interface Data extends StoredData {
	readonly monthCount: number;
	readonly monthIndices: Readonly<Record<YyyyMm, number>>;
	readonly months: readonly YyyyMm[];
}
