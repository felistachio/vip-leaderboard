import type { YyyyMm } from "@/utils/time";

export type User = {
	readonly id: string;
	readonly name: string;
	readonly avatarUrl: string;
	readonly color: string;
};

export type UserCounts = {
	/** Month indices, sorted. Guaranteed not empty. */
	readonly activeMonths: readonly number[];
	/** Aligned with `activeMonths` */
	readonly counts: ReadonlyArray<
		readonly [report: number, warning: number, ban: number]
	>;
};

export type StoredData = {
	readonly monthRange: readonly [first: YyyyMm, last: YyyyMm];
	readonly users: readonly (User & UserCounts)[];
};

export interface Data extends StoredData {
	readonly monthCount: number;
	readonly monthIndices: Readonly<Record<YyyyMm, number>>;
	readonly months: readonly YyyyMm[];
}
