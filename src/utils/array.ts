export const windowed3 = <T>(arr: readonly T[]) =>
	arr.map((elt, i) => [arr[i - 1], elt, arr[i + 1]] as const);

export function reduce<T extends TNext, TNext>(
	array: readonly T[],
	reducer: (prev: TNext, curr: T) => TNext,
): TNext {
	return array.reduce(reducer as any);
}

export function mapReduce<T, TPrev, TNext extends TPrev>(
	array: readonly T[],
	reducer: (prev: TPrev, curr: T) => TNext,
	initial: TPrev,
) {
	const result: TNext[] = [];

	let prev = initial;
	for (const curr of array) {
		const next = reducer(prev, curr);
		result.push(next);
		prev = next;
	}

	return result;
}

type Map<
	Arr extends readonly unknown[],
	F extends (elt: Arr[number]) => unknown,
	__acc extends unknown[] = [],
> = F extends (elt: any) => infer U
	? number extends Arr["length"]
		? U[]
		: Arr extends readonly [infer _, ...infer Rest]
			? Map<Rest, F, [...__acc, U]>
			: __acc
	: never;

export function map<const Arr extends readonly unknown[], Out>(
	Arr: Arr,
	f: (elt: Arr[number]) => Out,
) {
	return Arr.map(f) as Map<Arr, typeof f>;
}
