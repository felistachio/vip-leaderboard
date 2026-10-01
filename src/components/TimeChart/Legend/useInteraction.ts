import { type KeyboardEvent, useEffect, useRef } from "react";
import { useDrag } from "@/hooks/useDrag";
import { useChart } from "../chartContext";
import type { Direction } from "./types";

export function useInteraction(direction: Direction) {
	const { isDragging } = useDrag();
	const { activeSeries, setActiveSeries, isUnpinned } = useChart();

	const entriesRef = useRef<Record<string, HTMLLIElement>>({});
	useEffect(() => {
		if (activeSeries) {
			// mostly for the search bar (focus on successful search)
			entriesRef.current[activeSeries]?.focus();
		}
	}, [activeSeries]);

	return {
		onKeyDown(e: KeyboardEvent) {
			if (e.key.startsWith("Arrow")) {
				// prevent native keyboard scrolling
				// because we're manually controlling the scroll to snap to entry
				e.preventDefault();
			} else if (e.key === "Escape" && activeSeries) {
				entriesRef.current[activeSeries]?.blur();
				setActiveSeries(undefined);
			}
		},
		entry: (seriesId: string) => ({
			ref(entry: HTMLLIElement | null) {
				if (entry) {
					entriesRef.current[seriesId] = entry;
				}
			},
			onMouseEnter() {
				if (!isDragging && !isUnpinned(seriesId)) {
					setActiveSeries(seriesId);
					entriesRef.current[seriesId]?.focus();
				}
			},
			onMouseLeave() {
				setActiveSeries(undefined);
				entriesRef.current[seriesId]?.blur();
			},
			onFocus() {
				if (!isUnpinned(seriesId)) {
					setActiveSeries(seriesId);
				}
			},
			onBlur() {
				setTimeout(
					// prevent a brief moment when tabbing between entries
					// where no entry is focused, causing flicker
					() => {
						if (
							!entriesRef.current[seriesId]?.contains(document.activeElement)
						) {
							setActiveSeries((c) => (c === seriesId ? undefined : c));
						}
					},
					0,
				);
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
