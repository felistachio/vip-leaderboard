import type { ComponentProps, FC } from "react";
import type { OneOf } from "@/utils/types";
import type { TimeSeries } from "../ChartWrapper";

export type LegendEntryProps<S extends TimeSeries> = {
	series: Omit<S, "data">;
	seriesColor: string;
	seriesIndex: number;
} & Pick<
	ComponentProps<"li">,
	"onFocus" | "onBlur" | "onKeyDown" | "onMouseEnter" | "onMouseLeave" | "ref"
>;

export type Direction = "horizontal" | "vertical";

export type LegendProps<S extends TimeSeries> = {
	Entry: FC<LegendEntryProps<S>>;
	className?: string;
} & OneOf<Record<Direction, true>>;
