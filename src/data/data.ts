import { memoize } from "es-toolkit";
import { monthsInRange } from "@/utils/time";
import type { Data, StoredData } from "./types";

export const loadData = memoize(async (): Promise<Data> => {
	const response = await fetch("./data.json");
	const storedData: StoredData = await response.json();

	const months = monthsInRange(...storedData.monthRange);
	const monthCount = months.length;
	const monthIndices = Object.fromEntries(months.map((m, i) => [m, i]));
	return { ...storedData, months, monthCount, monthIndices };
});
