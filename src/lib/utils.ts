import {
	differenceInDays,
	format,
	formatDistanceToNow,
	isValid,
	parseISO,
} from 'date-fns';
import { number_crunch } from './number-crunch';

export const format_date = (
	date_string: string,
	format_string: string = 'PPp',
) => {
	try {
		const date = parseISO(date_string);
		if (!isValid(date)) return 'Invalid date';
		return format(date, format_string);
	} catch (err) {
		console.error('Error formatting date:', err);
		return 'Invalid date';
	}
};

export const format_relative_date = (date_string: string) => {
	try {
		const date = parseISO(date_string);
		if (!isValid(date)) return 'Invalid date';
		return formatDistanceToNow(date, { addSuffix: true });
	} catch (err) {
		console.error('Error formatting relative date:', err);
		return 'Invalid date';
	}
};

export const format_date_range = (from: string, to: string) => {
	try {
		const from_date = parseISO(from);
		const to_date = parseISO(to);

		if (!isValid(from_date) || !isValid(to_date)) {
			return 'Invalid date range';
		}

		return `${format(from_date, 'PP')} to ${format(to_date, 'PP')}`;
	} catch (err) {
		console.error('Error formatting date range:', err);
		return 'Invalid date range';
	}
};

export const is_within_days = (date_string: string, days: number) => {
	try {
		const date = parseISO(date_string);
		if (!isValid(date)) return false;
		return differenceInDays(new Date(), date) <= days;
	} catch (err) {
		console.error('Error checking date range:', err);
		return false;
	}
};

export const format_display_number = (num: number) => {
	return new Intl.NumberFormat().format(num);
};

export const get_tooltip_props = (value: number) => {
	const crunched = number_crunch(value);
	const should_show_tooltip = crunched !== value.toString();

	return {
		class: should_show_tooltip
			? 'tooltip tooltip-right tooltip-primary'
			: '',
		'data-tip': should_show_tooltip
			? format_display_number(value)
			: undefined,
	};
};
