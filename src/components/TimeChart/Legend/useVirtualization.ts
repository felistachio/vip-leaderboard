import {
	type UIEvent,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import { useChart } from "../chartContext";
import type { Direction } from "./types";
import type { useLayout } from "./useLayout";

export function useVirtualization(
	direction: Direction,
	{ legendRef, entrySize, gap, visibleCount }: ReturnType<typeof useLayout>,
) {
	const {
		visibleIdx: [visibleFrom, visibleTo] = [0, visibleCount],
		setVisibleIdx,
		activeSeries,
		seriesData,
		hasPins,
	} = useChart();
	const setVisibleFrom = useCallback(
		(from: number) =>
			setVisibleIdx((current = [0, visibleCount]) => {
				const [currentFrom, currentTo] = current;
				if (from === currentFrom) {
					return current;
				}
				const currentCount = currentTo - currentFrom;
				return [from, from + currentCount];
			}),
		[setVisibleIdx, visibleCount],
	);
	useEffect(() => {
		if (!seriesData || hasPins) {
			return;
		}
		setVisibleIdx((current = [0, visibleCount]) => {
			const [currentFrom, currentTo] = current;
			if (currentFrom === 0 && currentTo === visibleCount) {
				return current;
			}
			return [currentFrom, currentFrom + visibleCount];
		});
	}, [visibleCount, seriesData, setVisibleIdx, hasPins]);

	const entryIndexMap = useMemo(() => {
		if (!seriesData) {
			return;
		}
		return Object.fromEntries(
			seriesData.map((series, index) => [series.id, index]),
		);
	}, [seriesData]);
	useEffect(() => {
		if (!activeSeries || hasPins) {
			return;
		}
		const activeIndex = entryIndexMap?.[activeSeries];
		if (activeIndex === undefined) {
			return;
		}
		setVisibleIdx((current) => {
			if (!current) {
				return current;
			}
			const [currentFrom, currentTo] = current;
			if (currentFrom <= activeIndex && activeIndex < currentTo) {
				return current;
			}
			return [activeIndex, activeIndex + currentTo - currentFrom];
		});
	}, [activeSeries, setVisibleIdx, entryIndexMap, hasPins]);

	const ignoreScroll = useRef(false);
	const prevFromIdx = useRef(0);
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entrySize || !seriesData || hasPins) {
			return;
		}

		// ignore scrolls triggered by re-rendering the legend
		ignoreScroll.current = true;
		legend.scrollTo(
			calculateScroll(prevFromIdx.current, { entrySize, direction, gap }),
		);
		// If out of bound, the browser will clamp it.
		// So read back the value for the actual rank
		const index = calculateIdx(legend, { entrySize, direction, gap });
		setVisibleFrom(index);
		prevFromIdx.current = index;

		const timeoutId = setTimeout(() => (ignoreScroll.current = false), 100);
		return () => clearTimeout(timeoutId);
	}, [
		legendRef,
		setVisibleFrom,
		seriesData,
		entrySize,
		direction,
		gap,
		hasPins,
	]);

	return {
		onScroll({ currentTarget }: UIEvent) {
			if (ignoreScroll.current || !entrySize || hasPins) {
				return;
			}
			const index = calculateIdx(currentTarget, {
				entrySize,
				direction,
				gap,
			});
			prevFromIdx.current = index;
			setVisibleFrom(index);
		},
		onEntryFocus(i: number) {
			const legend = legendRef.current;
			if (!legend || !entrySize || hasPins) {
				return;
			}
			const scrollArgs = { entrySize, direction, gap };
			if (i >= visibleTo) {
				legend.scrollTo(calculateScroll(i, scrollArgs));
			} else if (i < visibleFrom) {
				const visibleCount = visibleTo - visibleFrom;
				legend.scrollTo(
					calculateScroll(Math.max(0, i - visibleCount + 1), scrollArgs),
				);
			}
		},
	};
}

type ScrollArgs = {
	entrySize: number;
	direction: Direction;
	gap: number;
};

function calculateIdx(
	{ scrollTop, scrollLeft }: { scrollTop: number; scrollLeft: number },
	{ entrySize, direction, gap }: ScrollArgs,
) {
	const scroll = direction === "vertical" ? scrollTop : scrollLeft;
	return Math.floor((scroll + gap) / (entrySize + gap));
}

function calculateScroll(
	index: number,
	{ entrySize, direction, gap }: ScrollArgs,
) {
	const pos = index * (entrySize + gap);
	return direction === "vertical" ? { top: pos } : { left: pos };
}
