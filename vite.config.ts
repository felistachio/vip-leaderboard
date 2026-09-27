import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { defineConfig, type Plugin } from "vite";
import { getActivityStats } from "./src/db/activity";
import { getFirstDate, getLastDate } from "./src/db/time";
import { getUser, getUserStats } from "./src/db/user";
import { toYyyyMm, yyyyMmOffset } from "./src/utils/time";

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

			const db = drizzle(new Database(res("public/db.sqlite")));

			const firstDate = getFirstDate(db);
			const lastDate = getLastDate(db);
			const zack = getUser(db, "zackwb");

			const lastMonth = toYyyyMm(lastDate);
			const twoYearsAgo = yyyyMmOffset(lastMonth, { years: -2, months: 1 });
			const defaultTimeRange = { since: twoYearsAgo, until: lastMonth };

			const defaultActivityStats = getActivityStats(db, defaultTimeRange);
			const defaultUserStats = getUserStats(db, defaultTimeRange);

			return `
					export const FIRST_DATE = new Date(${firstDate.getTime()})
					export const LAST_DATE = new Date(${lastDate.getTime()})
					export const ZACK = ${JSON.stringify(zack)}

					export const DEFAULT_ACTIVITY_STATS = ${JSON.stringify(defaultActivityStats)}
					export const DEFAULT_USER_STATS = ${JSON.stringify(defaultUserStats)}
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
