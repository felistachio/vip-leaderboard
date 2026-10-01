import classNames from "classnames/bind";
import { useCallback, useMemo, useState } from "react";
import { Flipper } from "react-flip-toolkit";
import { Resizer } from "@/components/Resizer";
import { SearchBar } from "@/components/SearchBar";
import { TimeChart, useChart } from "@/components/TimeChart";
import type { UserMonthlyCount } from "@/data/user";
import { useChartControls } from "./ChartControls";
import styles from "./ChartPage.module.css";
import { LegendEntry } from "./LegendEntry";

const cx = classNames.bind(styles);

export function Legend() {
	const { seriesData, renderReady, setActiveSeries, setEnableHover } =
		useChart<UserMonthlyCount>();
	const [{ pins }, setOptions] = useChartControls();

	const [legendWidth, setLegendWidth] = useState(164);
	const resizeWidth = useCallback((delta: number) => {
		setLegendWidth((current) => Math.max(Math.min(current + delta, 305), 121));
	}, []);

	const searchSuggestions = useMemo(() => {
		if (!seriesData) {
			return [];
		}
		return Object.values(
			Object.fromEntries(
				seriesData
					.flatMap((user) => [user.id, user.name])
					.map((value) => [value.toLowerCase(), value]),
			),
		).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	}, [seriesData]);
	const suggestionToIdMap = useMemo(() => {
		if (!seriesData) {
			return;
		}
		return Object.fromEntries(
			seriesData.flatMap((user) => [
				[user.id, user.id],
				[user.name, user.id],
			]),
		);
	}, [seriesData]);

	const flipKey = useMemo(() => seriesData?.map((s) => s.id), [seriesData]);
	return (
		<>
			<fieldset
				style={{ ["--legend-width" as string]: `${legendWidth}px` }}
				className={cx("side-panel")}
			>
				<legend>rankings</legend>
				{renderReady && (
					<SearchBar
						placeholder="Search user.."
						onChange={(name) => {
							const userId = suggestionToIdMap?.[name];
							if (!userId) {
								return;
							}
							setOptions({
								pins: (() => {
									if (!pins.length || pins.includes(userId)) {
										return pins;
									}
									return pins.concat(userId);
								})(),
							});
							setEnableHover(false);
							setActiveSeries(userId);
							setTimeout(() => setEnableHover(true), 0);
						}}
						suggestions={searchSuggestions}
						className={cx("search-bar")}
					/>
				)}
				<Flipper flipKey={flipKey} className={cx("legend-container")}>
					<TimeChart.Legend
						vertical
						Entry={LegendEntry}
						entriesGap={{ min: 20, max: 60 }}
						className={cx("legend")}
					/>
				</Flipper>
			</fieldset>
			<Resizer left onChange={resizeWidth} className={cx("legend-resizer")} />
		</>
	);
}
