import classNames from "classnames/bind";
import { useMemo, useRef } from "react";
import { Flipped } from "react-flip-toolkit";
import { type LegendEntryProps, useChart } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyCount } from "@/db/user";
import { useChartControls } from "./ChartControls";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function LegendEntry({
	series: { id, total, $index, ...user },
	onFocus,
	...props
}: LegendEntryProps<UserMonthlyCount>) {
	const { isHighlighted, colorMap } = useChart();
	const [{ pins }, setOptions] = useChartControls();

	const togglePin = () =>
		setOptions({
			pins: (() => {
				const existing = pins.indexOf(id) ?? -1;
				if (pins.length && existing !== -1) {
					const result = pins.toSpliced(existing, 1);
					return result.length ? result : undefined;
				}
				return pins ? pins.concat(id) : [id];
			})(),
		});
	const pinned = useMemo(() => pins.includes(id), [pins, id]);
	const unpinned = pins.length && !pinned;

	const pinRef = useRef<HTMLButtonElement>(null);
	return (
		<Flipped key={id} flipId={id}>
			<li
				tabIndex={!pins.length || pinned ? 0 : -1}
				style={{ ["--series-color" as string]: colorMap[id] }}
				className={cx("info-box", { highlighted: isHighlighted(id), unpinned })}
				onFocus={(e) => {
					onFocus?.(e);
					if (unpinned) {
						pinRef.current?.focus();
					}
				}}
				{...props}
			>
				<UserHeader {...user} />
				<div className={cx("details")}>
					<span className={cx("rank")} aria-label={`rank ${$index + 1}`}>
						#{$index + 1}
					</span>
					<span aria-label={`total score ${total}`}>{total}</span>
				</div>
				<button
					type="button"
					className={cx("pin-btn", { pinned })}
					onClick={togglePin}
					ref={pinRef}
				>
					<PinIcon />
				</button>
			</li>
		</Flipped>
	);
}

const PinIcon = () => (
	<svg
		aria-hidden
		viewBox="0 0 24 24"
		width="20"
		height="20"
		style={{ transform: "rotate(45deg)" }}
	>
		<path
			fill="currentColor"
			d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"
		/>
	</svg>
);
