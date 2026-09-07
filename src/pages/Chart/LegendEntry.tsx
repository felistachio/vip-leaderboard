import classNames from "classnames/bind";
import { useMemo } from "react";
import { type LegendEntryProps, useChart } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyCount } from "@/db/user";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function LegendEntry({
	series: { id, total, ...user },
	seriesColor,
	seriesIndex,
	...props
}: LegendEntryProps<UserMonthlyCount>) {
	const { isHighlighted, pinnedIds, setPinnedIds } = useChart();
	const rank = seriesIndex + 1;

	const togglePin = () =>
		setPinnedIds((current) => {
			const existing = current?.indexOf(id) ?? -1;
			if (current && existing !== -1) {
				const result = current.toSpliced(existing, 1);
				return result.length ? result : undefined;
			}
			return current ? [id, ...current] : [id];
		});
	const isPinned = useMemo(() => pinnedIds?.includes(id), [pinnedIds, id]);

	return (
		<li
			tabIndex={0}
			style={{ ["--series-color" as string]: seriesColor }}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			{...props}
		>
			<UserHeader {...user} />
			<div className={cx("details")}>
				<span className={cx("rank")} aria-label={`rank ${rank}`}>
					#{rank}
				</span>
				<span aria-label={`total score ${total}`}>{total}</span>
			</div>
			<PinIcon
				className={cx("pin-icon", { pinned: isPinned })}
				onClick={togglePin}
			/>
		</li>
	);
}

const PinIcon = ({
	className,
	onClick,
}: {
	className?: string;
	onClick?: () => void;
}) => (
	<svg
		aria-hidden
		viewBox="0 0 24 24"
		className={className}
		width="20"
		height="20"
		onClick={onClick}
	>
		<path
			fill="currentColor"
			d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"
		/>
	</svg>
);
