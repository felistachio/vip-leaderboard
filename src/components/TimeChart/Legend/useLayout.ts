import { useEffect, useRef, useState } from "react";
import type { Maybe } from "@/utils/types";
import { useChart } from "../chartContext";
import type { Direction, EntriesGap } from "./types";

export function useLayout(
	direction: Direction,
	{ min: minGap = 0, max: maxGap }: Partial<EntriesGap> = {},
) {
	const {
		colors: { length: maxVisibleCount },
	} = useChart();
	const [visibleCount, setVisibleCount] = useState(maxVisibleCount);

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
			setVisibleCount(visibleCount);

			const gap =
				visibleCount > 1
					? Math.max(
							(containerSize - entrySize * visibleCount) / (visibleCount - 1),
							minGap,
						)
					: 0;

			setGap(
				visibleCount === maxVisibleCount && maxGap
					? Math.min(gap, maxGap)
					: gap,
			);
		});

		observer.observe(legend);
		return () => observer.disconnect();
	}, [maxVisibleCount, direction, minGap, maxGap, entrySize]);

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
		gap,
		entrySize,
		visibleCount,
	};
}
