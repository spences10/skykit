import { number_crunch } from './number-crunch';

export const format_date = (date_string: string) => {
	return new Date(date_string).toLocaleString();
};

export const format_number = (num: number) => {
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
			? format_number(value)
			: undefined,
	};
};
