import classNames from "classnames/bind";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { TimeSeries } from "../ChartWrapper";
import { useChart } from "../chartContext";
import styles from "../TimeChart.module.css";
import type { LegendProps } from "./types";
import { useInteraction } from "./useInteraction";
import { useLayout } from "./useLayout";
import { useVirtualization } from "./useVirtualization";

const cx = classNames.bind(styles);

export function Legend<S extends TimeSeries>({
	Entry,
	vertical,
	entriesGap,
	className,
}: LegendProps<S>) {
	const direction = vertical ? "vertical" : "horizontal";
	const { renderReady, seriesData } = useChart<S>();

	const { onKeyDown, entry } = useInteraction(direction);
	const layout = useLayout(direction, entriesGap);
	const { legendStyle, legendRef, entryRef } = layout;
	const { onScroll, onEntryFocus } = useVirtualization(direction, layout);

	return (
		<ol
			style={legendStyle}
			ref={legendRef}
			onScroll={onScroll}
			className={cx("legend", direction, className)}
			onKeyDown={onKeyDown}
			tabIndex={-1}
		>
			{renderReady && seriesData ? (
				seriesData.map((series) => {
					const { ref, onFocus, ...eventHandlers } = entry(series.id);
					return (
						<Entry
							key={series.id}
							series={series}
							ref={(e) => {
								entryRef(e);
								ref(e);
							}}
							onFocus={() => {
								onFocus();
								onEntryFocus(series.$index);
							}}
							{...eventHandlers}
						/>
					);
				})
			) : (
				<LoadingSpinner size={36} />
			)}
		</ol>
	);
}
