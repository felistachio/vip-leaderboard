import { copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { getActivityStats } from "./src/data/activity";
import { Data } from "./src/data/types";
import { getUser, getUserStats } from "./src/data/user";
import { monthsInRange, yyyyMmOffset } from "./src/utils/time";

const SQL_WASM = {
	origin: res("node_modules/sql.js/dist/sql-wasm.wasm"),
	output: "sql-wasm-browser.wasm",
};

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		sqlWasmBundler(),
		dbBundler(),
	],
	resolve: {
		alias: {
			"@": res("src"),
			[`/${SQL_WASM.output}`]: SQL_WASM.origin,
		},
	},
	base: "/vip-leaderboard/",
});

// so that the page can render before db is loaded
function dbBundler(): Plugin {
	return {
		name: "db-bundler",
		resolveId(id) {
			if (id === "virtual:db") {
				return `\0virtual:db`;
			}
		},
		load(id) {
			if (id !== `\0virtual:db`) {
				return;
			}

			const data: Data = JSON.parse(
				readFileSync(res("public/data.json"), "utf-8"),
			);

			const [firstMonth, lastMonth] = data.monthRange;
			const allMonths = monthsInRange(firstMonth, lastMonth);
			const twoYearsAgo = yyyyMmOffset(lastMonth, { years: -2, months: 1 });
			const defaultTimeRange = { since: twoYearsAgo, until: lastMonth };
			const zack = getUser(data, "zackwb");

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

function sqlWasmBundler(): Plugin {
	return {
		name: "sqlWasm",
		apply: "build",
		closeBundle() {
			copyFileSync(SQL_WASM.origin, res(`dist/${SQL_WASM.output}`));
		},
	};
}

function res(relativePath: string) {
	return resolve(import.meta.dirname, relativePath);
}
