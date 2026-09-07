import { type KeyboardEvent, useEffect, useRef } from "react";
import { useDrag } from "@/hooks/useDrag";
import type { Maybe } from "@/utils/types";
import { useChart } from "../chartContext";
import type { Direction } from "./types";

export function useInteraction(direction: Direction) {
	const { isDragging } = useDrag();
	const { activeSeries, setActiveSeries, pinnedIds } = useChart();

	const lastHoveredSeries = useRef<Maybe<string>>(undefined);
	const entriesRef = useRef<Record<string, HTMLLIElement>>({});

	useEffect(() => {
		if (activeSeries) {
			entriesRef.current[activeSeries]?.focus();
		}
	}, [activeSeries]);

	return {
		onKeyDown(e: KeyboardEvent) {
			if (e.key.startsWith("Arrow")) {
				// prevent native keyboard scrolling
				// because we're manually controlling the scroll to snap to entry
				e.preventDefault();
			}
		},
		entry: (seriesId: string) => ({
			ref(entry: HTMLLIElement | null) {
				if (entry) {
					entriesRef.current[seriesId] = entry;
				}
			},
			onMouseEnter() {
				if (
					!isDragging &&
					(!activeSeries || lastHoveredSeries.current !== seriesId) &&
					(!pinnedIds || pinnedIds.includes(seriesId))
				) {
					lastHoveredSeries.current = seriesId;
					setActiveSeries(seriesId);
				}
			},
			onMouseLeave() {
				setActiveSeries(undefined);
			},
			onFocus() {
				setActiveSeries(seriesId);
			},
			onBlur() {
				setActiveSeries((c) => (c === seriesId ? undefined : c));
			},
			onKeyDown({
				key,
				currentTarget: { nextSibling, previousSibling },
			}: KeyboardEvent) {
				if (
					direction === "vertical" ? key === "ArrowDown" : key === "ArrowRight"
				)
					(nextSibling as HTMLElement)?.focus();
				else if (
					direction === "vertical" ? key === "ArrowUp" : key === "ArrowLeft"
				)
					(previousSibling as HTMLElement)?.focus();
			},
		}),
	};
}
