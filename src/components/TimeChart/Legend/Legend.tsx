import classNames from "classnames/bind";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { TimeSeries } from "../ChartWrapper";
import { useChart } from "../chartContext";
import styles from "../TimeChart.module.css";
import type { LegendProps } from "./types";
import { useInteraction } from "./useInteraction";
import { type EntriesGap, useVirtualization } from "./useVirtualization";

const cx = classNames.bind(styles);

export function Legend<S extends TimeSeries>({
	Entry,
	vertical,
	entriesGap,
	className,
}: LegendProps<S> & { entriesGap?: Partial<EntriesGap> }) {
	const direction = vertical ? "vertical" : "horizontal";
	const { renderReady, seriesData, colors } = useChart<S>();

	const { onKeyDown, entry } = useInteraction(direction);
	const { legendStyle, legendRef, onScroll, entryRef, onEntryFocus } =
		useVirtualization(direction, entriesGap);

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
				seriesData.map((series, i) => {
					const { ref, onFocus, ...eventHandlers } = entry(series.id);
					return (
						<Entry
							key={series.id}
							series={series}
							seriesIndex={i}
							seriesColor={colors[i % colors.length]!}
							ref={(e) => {
								entryRef(e);
								ref(e);
							}}
							onFocus={() => {
								onFocus();
								onEntryFocus(i);
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
