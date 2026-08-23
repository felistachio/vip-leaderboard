import {
	type UIEvent,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Maybe } from "@/utils/types";
import { useChart } from "../chartContext";
import type { Direction } from "./types";

export type EntriesGap = { min: number; max: number };

export function useVirtualization(
	direction: Direction,
	{ min: minGap = 0, max: maxGap }: Partial<EntriesGap> = {},
) {
	const chartContext = useChart();
	const { colors, activeSeries, seriesData } = chartContext;
	const maxVisibleCount = colors.length;
	const defaultVisibleIdx = useMemo<[number, number]>(
		() => [0, maxVisibleCount],
		[maxVisibleCount],
	);
	const {
		visibleIdx: [visibleFrom, visibleTo] = defaultVisibleIdx,
		setVisibleIdx,
	} = chartContext;
	const setVisibleFrom = useCallback(
		(from: number) =>
			setVisibleIdx((current = defaultVisibleIdx) => {
				const [currentFrom, currentTo] = current;
				if (from === currentFrom) {
					return current;
				}
				const currentCount = currentTo - currentFrom;
				return [from, from + currentCount];
			}),
		[setVisibleIdx, defaultVisibleIdx],
	);
	const setVisibleCount = useCallback(
		(count: number) =>
			setVisibleIdx((current = defaultVisibleIdx) => {
				const [currentFrom, currentTo] = current;
				const currentCount = currentTo - currentFrom;
				if (count === currentCount) {
					return current;
				}
				return [currentFrom, currentFrom + count];
			}),
		[setVisibleIdx, defaultVisibleIdx],
	);

	const [entrySize, setEntrySize] = useState<Maybe<number>>();
	const maxSize =
		entrySize && maxGap
			? entrySize * maxVisibleCount + maxGap * (maxVisibleCount - 1)
			: undefined;

	const [gap, setGap] = useState(minGap);
	const legendRef = useRef<HTMLOListElement>(null);
	useEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entrySize) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const rect = entries[0]?.contentRect;
			if (!rect) {
				return;
			}
			const containerSize = direction === "vertical" ? rect.height : rect.width;

			const visibleCount = Math.min(
				Math.floor((containerSize + minGap) / (entrySize + minGap)),
				maxVisibleCount,
			);
			const gap =
				visibleCount > 1
					? Math.max(
							(containerSize - entrySize * visibleCount) / (visibleCount - 1),
							minGap,
						)
					: 0;

			setVisibleCount(visibleCount);
			setGap(
				visibleCount === maxVisibleCount && maxGap
					? Math.min(gap, maxGap)
					: gap,
			);
		});

		observer.observe(legend);
		return () => observer.disconnect();
	}, [setVisibleCount, maxVisibleCount, direction, minGap, maxGap, entrySize]);

	const entryIndexMap = useMemo(() => {
		if (!seriesData) {
			return;
		}
		return Object.fromEntries(
			seriesData.map((series, index) => [series.id, index]),
		);
	}, [seriesData]);
	useEffect(() => {
		if (!activeSeries) {
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
	}, [activeSeries, setVisibleIdx, entryIndexMap]);

	const ignoreScroll = useRef(false);
	const prevFromIdx = useRef(0);
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entrySize || !seriesData) {
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
	}, [setVisibleFrom, seriesData, entrySize, direction, gap]);

	return {
		legendRef,
		entryRef(entry: HTMLLIElement | null) {
			if (entry && !entrySize) {
				const rect = entry.getBoundingClientRect();
				const entrySize = direction === "vertical" ? rect.height : rect.width;
				setEntrySize(entrySize);
			}
		},
		legendStyle: {
			gap,
			...(direction === "vertical"
				? { maxHeight: maxSize }
				: { maxWidth: maxSize }),
		},
		onScroll({ currentTarget }: UIEvent) {
			if (ignoreScroll.current || !entrySize) {
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
			if (!legend || !entrySize) {
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
