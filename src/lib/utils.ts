import { number_crunch } from './number-crunch';

export const format_date = (date_string: string) => {
	return new Date(date_string).toLocaleString();
};

// Enhanced number formatting function that can handle different precision levels
export const format_number = (
	num: number,
	precision: number = 0,
): number => {
	if (typeof num !== 'number' || isNaN(num)) return 0;
	return Number(num.toFixed(precision));
};

// Format number for display (existing function)
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

// Helper for formatting percentages
export const format_percentage = (
	value: number,
	precision: number = 1,
): number => {
	return format_number(Math.min(value, 100), precision);
};

// Helper for formatting time-based metrics
export const format_time_metric = (
	value: number,
	precision: number = 2,
): number => {
	return format_number(value, precision);
};
