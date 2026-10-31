// Link-preview cards as SVG, 1200x630, for resvg to turn into PNG.
// Colours are daisyUI's light theme as hex: resvg can't read oklch.
export const card = { width: 1200, height: 630 };

const colour = {
	paper: '#ffffff',
	panel: '#f4f4f5',
	ink: '#18181b',
	muted: '#71717a',
	primary: '#422ad5',
	secondary: '#f43098',
};

const font = 'Manrope';
const left = 72;

export interface CardProfile {
	handle: string;
	display_name: string;
	/** data: URI, so resvg needs no network */
	avatar?: string;
	followers: number;
	following: number;
	posts: number;
}

const escape = (text: string) =>
	text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');

/**
 * Cuts text to fit a width. SVG has no text layout, so the width is
 * estimated from each character's average share of the font size
 */
function fit(
	text: string,
	max_width: number,
	size: number,
	em = 0.6,
) {
	const max_chars = Math.floor(max_width / (size * em));
	const chars = Array.from(text);
	if (chars.length <= max_chars) return text;
	return `${chars.slice(0, max_chars - 1).join('')}…`;
}

const compact = new Intl.NumberFormat('en', {
	notation: 'compact',
	maximumFractionDigits: 1,
});

function frame(body: string) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${card.width}" height="${card.height}" viewBox="0 0 ${card.width} ${card.height}">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${colour.primary}"/>
      <stop offset="1" stop-color="${colour.secondary}"/>
    </linearGradient>
    <clipPath id="avatar"><circle cx="${left + 80}" cy="250" r="80"/></clipPath>
  </defs>
  <rect width="100%" height="100%" fill="${colour.paper}"/>
  <rect y="${card.height - 14}" width="100%" height="14" fill="url(#brand)"/>
  ${body}
</svg>`;
}

function wordmark(x: number, y: number, size: number) {
	return `<text x="${x}" y="${y}" font-family="${font}" font-weight="800" font-size="${size}" fill="url(#brand)">SkyKit</text>`;
}

export function render_home_card() {
	return frame(`${wordmark(left, 300, 150)}
  <text x="${left}" y="390" font-family="${font}" font-weight="700" font-size="52" fill="${colour.ink}">Bluesky analytics for any handle</text>
  <text x="${left}" y="460" font-family="${font}" font-weight="500" font-size="32" fill="${colour.muted}">Engagement, posting patterns, network, inactive follows.</text>
  <text x="${left}" y="506" font-family="${font}" font-weight="500" font-size="32" fill="${colour.muted}">No sign-in.</text>
  <text x="${card.width - left}" y="570" text-anchor="end" font-family="${font}" font-weight="700" font-size="28" fill="${colour.muted}">skykit.blue</text>`);
}

function avatar(profile: CardProfile) {
	const cx = left + 80;
	if (profile.avatar) {
		return `<circle cx="${cx}" cy="250" r="84" fill="url(#brand)"/>
  <image href="${profile.avatar}" x="${left}" y="170" width="160" height="160" clip-path="url(#avatar)" preserveAspectRatio="xMidYMid slice"/>`;
	}
	const initial = Array.from(profile.display_name)[0] ?? '?';
	return `<circle cx="${cx}" cy="250" r="80" fill="url(#brand)"/>
  <text x="${cx}" y="276" text-anchor="middle" font-family="${font}" font-weight="800" font-size="76" fill="${colour.paper}">${escape(initial.toUpperCase())}</text>`;
}

function stat(x: number, value: number, label: string) {
	return `<text x="${x}" y="476" font-family="${font}" font-weight="800" font-size="76" fill="${colour.ink}">${compact.format(value)}</text>
  <text x="${x}" y="520" font-family="${font}" font-weight="500" font-size="28" fill="${colour.muted}">${label}</text>`;
}

export function render_profile_card(profile: CardProfile) {
	const text_x = left + 200;
	const text_width = card.width - text_x - left;
	const name = fit(profile.display_name, text_width, 60);
	const handle = fit(`@${profile.handle}`, text_width, 34, 0.55);
	const column = (card.width - left * 2) / 3;

	return frame(`${wordmark(left, 100, 44)}
  <text x="${card.width - left}" y="100" text-anchor="end" font-family="${font}" font-weight="700" font-size="26" fill="${colour.muted}">Bluesky analytics</text>
  ${avatar(profile)}
  <text x="${text_x}" y="248" font-family="${font}" font-weight="800" font-size="60" fill="${colour.ink}">${escape(name)}</text>
  <text x="${text_x}" y="300" font-family="${font}" font-weight="500" font-size="34" fill="${colour.muted}">${escape(handle)}</text>
  <rect x="${left}" y="372" width="${card.width - left * 2}" height="2" fill="${colour.panel}"/>
  ${stat(left, profile.followers, 'Followers')}
  ${stat(left + column, profile.following, 'Following')}
  ${stat(left + column * 2, profile.posts, 'Posts')}
  <text x="${card.width - left}" y="590" text-anchor="end" font-family="${font}" font-weight="700" font-size="24" fill="${colour.muted}">skykit.blue/${escape(profile.handle)}</text>`);
}
