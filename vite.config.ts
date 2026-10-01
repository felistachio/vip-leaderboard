import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import type { Data } from "./src/data/types";
import { monthsInRange, yyyyMmOffset } from "./src/utils/time";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		dataBundler(),
	],
	resolve: {
		alias: { "@": res("src") },
	},
	base: "/vip-leaderboard/",
});

// so that the page can render before db is loaded
function dataBundler(): Plugin {
	return {
		name: "db-bundler",
		resolveId(id) {
			if (id === "virtual:data") {
				return `\0virtual:data`;
			}
		},
		load(id) {
			if (id !== `\0virtual:data`) {
				return;
			}

			const data: Data = JSON.parse(
				readFileSync(res("public/data.json"), "utf-8"),
			);

			const [firstMonth, lastMonth] = data.monthRange;
			const allMonths = monthsInRange(firstMonth, lastMonth);
			const twoYearsAgo = yyyyMmOffset(lastMonth, { years: -2, months: 1 });
			const defaultTimeRange = { since: twoYearsAgo, until: lastMonth };
			const zack = data.users.find(({ id }) => id === "zackwb");

			return `
					export const FIRST_MONTH = ${JSON.stringify(firstMonth)}
					export const LAST_MONTH = ${JSON.stringify(lastMonth)}
					export const ALL_MONTHS = ${JSON.stringify(allMonths)}
					export const TWO_YEARS_AGO = ${JSON.stringify(twoYearsAgo)}
					export const DEFAULT_TIME_RANGE = ${JSON.stringify(defaultTimeRange)}
					export const ZACK = ${JSON.stringify(zack)}
				`;
		},
	};
}

function res(relativePath: string) {
	return resolve(import.meta.dirname, relativePath);
}
