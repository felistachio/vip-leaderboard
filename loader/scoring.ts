import { groupBy, map, pipe } from "es-toolkit/fp";
import type { User as UserData } from "@/data/types";
import { reduce } from "@/utils/array";
import { values } from "@/utils/object";
import { toYyyyMm } from "@/utils/time";
import type { ActivityData } from "./data-save";
import type { Channel, Message, User } from "./types";

export function countActivities(channels: Channel[]) {
	const users: (UserData & { discoverTime: number })[] = [];
	const activities = new Map<string, ActivityData>();

	channels.forEach(({ channel: { id }, messages }) => {
		if (id === WARNINGS_CHANNEL_ID) {
			countWarnings(users, activities, messages);
		} else if (id === BANS_CHANNEL_ID) {
			countBans(users, activities, messages);
		} else {
			countReports(users, activities, messages);
		}
	});

	const validatedUsers = pipe(
		users.sort((u1, u2) => u1.discoverTime - u2.discoverTime),
		groupBy((u) => u.id),
		values,
		map((duplicates) =>
			reduce(duplicates, (current: UserData, { discoverTime, ...u }) => ({
				...u,
				color: EXCLUDED_COLORS.includes(u.color) ? current.color : u.color,
			})),
		),
	).filter((u) => !EXCLUDED_COLORS.includes(u.color));

	const userIds = new Set(validatedUsers.map((u) => u.id));
	const validatedActivities = activities
		.values()
		.filter(({ userId }) => userIds.has(userId))
		.toArray();
	return { users: validatedUsers, activities: validatedActivities };
}

function registerUser(
	users: (UserData & { discoverTime: number })[],
	timestamp: string,
) {
	return ({ name, nickname, avatarUrl, color }: User): string => {
		const id = name.toLowerCase(); // sql primary key may be case-insensitive
		const avatarParamIndex = avatarUrl.lastIndexOf("?");
		avatarUrl = avatarUrl.substring(
			"https://cdn.discordapp.com/".length,
			avatarParamIndex === -1 ? undefined : avatarParamIndex,
		);
		// Users whose color is excluded don't count, but fetching color is unreliable
		// (sometimes color is null when it shouldn't). So:
		// 1) During discovery phase, save all users. Convert null color to one of the excluded.
		// 2) Sort by discovery time (to prioritize most recent data)
		// 3) Insert all user instances to DB, on conflict, update if the new color is not excluded.
		// 4) Delete + cascade all users whose color is excluded.
		users.push({
			id,
			name: nickname,
			avatarUrl,
			color: color ?? EXCLUDED_COLORS[0],
			discoverTime: new Date(timestamp).getTime(),
		});
		return id;
	};
}

function countReports(
	users: (UserData & { discoverTime: number })[],
	activities: Map<string, ActivityData>,
	messages: Message[],
) {
	messages.forEach(({ id, author, reactions, timestamp }) => {
		const date = new Date(timestamp);
		const getUserId = registerUser(users, timestamp);
		const authorId = getUserId(author);

		reactions
			.filter((r) => REPORT_HANDLE_REACTIONS.has(r.emoji.code))
			.flatMap((r) => r.users)
			.map(getUserId)
			.filter((userId) => userId !== authorId)
			.forEach((userId) =>
				activities.set(`${id}-${userId}`, {
					userId,
					month: toYyyyMm(date),
					type: "report",
				}),
			);
	});
}

function countWarnings(
	users: (UserData & { discoverTime: number })[],
	activities: Map<string, ActivityData>,
	messages: Message[],
) {
	messages.forEach(({ id, author, content, timestamp, forwardedMessage }) => {
		const getUserId = registerUser(users, timestamp);
		getUserId(author);

		const recipientIds = content.match(USER_ID_REGEX);
		if (!recipientIds?.length) {
			return;
		}

		const realContent = `${forwardedMessage?.content ?? ""}\n${content}`;

		const date = new Date(timestamp);
		// Before this date, bans and warnings were in the same channel.
		// So only count if the message contains the word "warn"
		if (date < bansChannelCreationDate && !realContent.match(/warn/i)) {
			return;
		}

		recipientIds.forEach((recipientId) =>
			activities.set(`${id}-${recipientId}`, {
				month: toYyyyMm(date),
				userId: getUserId(author),
				type: "warning",
			}),
		);
	});
}

function countBans(
	users: (UserData & { discoverTime: number })[],
	activities: Map<string, ActivityData>,
	messages: Message[],
) {
	messages.forEach(
		({
			id,
			author,
			content,
			reactions,
			embeds,
			timestamp,
			forwardedMessage,
		}) => {
			const getUserId = registerUser(users, timestamp);
			const authorId = getUserId(author);

			// Count the :verified: reactions on auto ban announcements
			const autoban = embeds.find((e) => e.title === "Auto banned user");
			if (autoban) {
				const date = new Date(timestamp);
				const recipientIds = autoban.description.match(USER_ID_REGEX);

				recipientIds?.forEach((recipientId) => {
					reactions
						.filter((r) => r.emoji.code === "verified")
						.flatMap((r) => r.users)
						.map(getUserId)
						.forEach((userId) =>
							// intentionally not including message ID in the key
							// because sometimes autobans have duplicate user IDs
							activities.set(`${recipientId}-${userId}`, {
								month: toYyyyMm(date),
								userId,
								type: "ban",
							}),
						);
				});
				return;
			}

			// Normal bans: count the message's author and those reacting with BAN_SUPPORT_REACTIONS
			// It doesn't matter whether the recipient was actually banned.
			const realContent = `${forwardedMessage?.content ?? ""}\n${content}`;
			const recipientIds = realContent.match(USER_ID_REGEX);
			if (!recipientIds?.length) {
				return;
			}

			const date = new Date(timestamp);
			if (date < bansChannelCreationDate && !realContent.match(/ban/i)) {
				return;
			}

			recipientIds.forEach((recipientId) =>
				activities.set(`${id}-${recipientId}`, {
					month: toYyyyMm(date),
					userId: authorId,
					type: "ban",
				}),
			);

			reactions
				.filter((r) => BAN_SUPPORT_REACTIONS.has(r.emoji.code))
				.flatMap((r) => r.users)
				.map(getUserId)
				.filter((userId) => userId !== authorId)
				.forEach((userId) =>
					activities.set(`${id}-${userId}`, {
						month: toYyyyMm(date),
						userId,
						type: "ban",
					}),
				);
		},
	);
}

const REPORT_HANDLE_REACTIONS = new Set([
	"white_check_mark",
	"x",
	"wastebasket",
	"lock",
]);
const BAN_SUPPORT_REACTIONS = new Set([
	"white_check_mark",
	"hammer",
	"thumbsup",
	"thumbup",
	"ehh",
	"thumbsdown",
	"thumbdown",
	"x",
]);

const WARNINGS_CHANNEL_ID = "614936519710605408";
const BANS_CHANNEL_ID = "875213677530320897";
const USER_ID_REGEX = /(?<![a-z0-9])[a-z0-9]{64}(?![a-z0-9])/g;

const bansChannelCreationDate = new Date("2021-08-11T20:07:10.447-07:00");

const EXCLUDED_COLORS = ["#A08AC6", "#ECF1F8"] satisfies [string, string];
