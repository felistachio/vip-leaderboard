export const windowed3 = <T>(arr: readonly T[]) =>
	arr.map((elt, i) => [arr[i - 1], elt, arr[i + 1]] as const);

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
	arr extends readonly unknown[],
	f extends (elt: arr[number]) => unknown,
	__acc extends unknown[] = [],
> = f extends (elt: any) => infer U
	? number extends arr["length"]
		? U[]
		: arr extends readonly [infer _, ...infer Rest]
			? Map<Rest, f, [...__acc, U]>
			: __acc
	: never;

export function map<const arr extends readonly unknown[], out>(
	arr: arr,
	f: (elt: arr[number]) => out,
) {
	return arr.map(f) as Map<arr, typeof f>;
}
