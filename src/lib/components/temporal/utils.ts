import { isValid, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Add type safety and validation for time windows
export interface TimeWindow {
	day: string;
	time: string;
	count: number;
}

export interface GroupedTime {
	timeRange: string;
	count: number;
}

// Add error handling for date parsing with timezone support
export const safe_format_date = (
	date_string: string,
	format_string: string,
	timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
) => {
	try {
		const date = parseISO(date_string);
		if (!isValid(date)) return 'Invalid date';
		return formatInTimeZone(date, timezone, format_string);
	} catch (err) {
		console.error('Error formatting date:', err);
		return 'Invalid date';
	}
};

export const format_time_window = (
	window: string,
	timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): TimeWindow | null => {
	try {
		const [day, time_range, count] = window.split('|');
		const [start_time, end_time] = time_range.split('-');

		if (!day || !start_time || !end_time || !count) {
			throw new Error('Invalid time window format');
		}

		// Convert times to user's timezone
		const start_date = parseISO(`2000-01-01T${start_time}`);
		const end_date = parseISO(`2000-01-01T${end_time}`);

		return {
			day,
			time: `${formatInTimeZone(start_date, timezone, 'h:mm a')} - ${formatInTimeZone(end_date, timezone, 'h:mm a')}`,
			count: parseInt(count),
		};
	} catch (err) {
		console.error('Error parsing time window:', err);
		return null;
	}
};

export function group_by_day(
	windows: string[],
	timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): Array<[string, GroupedTime[]]> {
	const groups = new Map<string, GroupedTime[]>();

	windows.forEach((window) => {
		const [day, timeRange, count] = window.split('|');
		if (!groups.has(day)) {
			groups.set(day, []);
		}
		groups.get(day)?.push({
			timeRange,
			count: parseInt(count),
		});
	});

	return Array.from(groups.entries());
}

// Helper function to get user's timezone
export function getUserTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
