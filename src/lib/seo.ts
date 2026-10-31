import type { BskyProfile } from '#lib/types.js';
import type { SchemaOrgProps, SeoConfig } from 'svead';

export const site_name = 'SkyKit';
export const site_url = 'https://skykit.blue';
export const site_description =
	'Free Bluesky analytics for any handle: engagement, posting times, network and inactive follows. No sign-in, no app password.';

const author = {
	'@type': 'Person',
	'@id': 'https://scottspence.com/#person',
	name: 'Scott Spence',
	url: 'https://scottspence.com',
	sameAs: [
		'https://bsky.app/profile/scottspence.dev',
		'https://github.com/spences10',
	],
};

const website_id = `${site_url}/#website`;
const app_id = `${site_url}/#app`;

const website = {
	'@type': 'WebSite',
	'@id': website_id,
	url: `${site_url}/`,
	name: site_name,
	description: site_description,
	publisher: { '@id': author['@id'] },
};

const web_app = {
	'@type': 'WebApplication',
	'@id': app_id,
	name: site_name,
	url: `${site_url}/`,
	description: site_description,
	applicationCategory: 'UtilitiesApplication',
	operatingSystem: 'Any',
	browserRequirements: 'Requires JavaScript',
	isAccessibleForFree: true,
	offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
	author: { '@id': author['@id'] },
};

export const page_url = (path = '/') => new URL(path, site_url).href;

interface SeoOptions {
	title: string;
	description: string;
	path?: string;
	/** Absolute URL; defaults to the home card */
	image?: string;
	image_alt?: string;
}

export const create_seo_config = ({
	title,
	description,
	path = '/',
	image = `${site_url}/og.png`,
	image_alt = 'SkyKit, free Bluesky analytics for any handle',
}: SeoOptions): SeoConfig => ({
	title,
	description,
	url: page_url(path),
	website: site_url,
	language: 'en_GB',
	open_graph_image: image,
	open_graph_image_alt: image_alt,
	author_name: author.name,
	site_name,
});

const graph = (...nodes: object[]) =>
	({
		'@context': 'https://schema.org',
		'@graph': [website, web_app, author, ...nodes],
	}) as unknown as SchemaOrgProps['schema'];

export const home_schema = () =>
	graph({
		'@type': 'WebPage',
		'@id': `${site_url}/#webpage`,
		url: `${site_url}/`,
		name: `${site_name}: free Bluesky analytics`,
		description: site_description,
		isPartOf: { '@id': website_id },
		mainEntity: { '@id': app_id },
	});

/** A ProfilePage about a Bluesky account, for a handle's stats page */
export const profile_schema = (
	profile: BskyProfile,
	path: string,
	description: string,
) => {
	const url = page_url(path);
	return graph({
		'@type': 'ProfilePage',
		'@id': `${url}#profile`,
		url,
		name: `${profile.displayName || profile.handle} on Bluesky`,
		description,
		isPartOf: { '@id': website_id },
		dateModified: new Date().toISOString(),
		mainEntity: {
			'@type': 'Person',
			name: profile.displayName || profile.handle,
			alternateName: `@${profile.handle}`,
			identifier: profile.did,
			image: profile.avatar,
			description: profile.description,
			sameAs: [`https://bsky.app/profile/${profile.handle}`],
			interactionStatistic: [
				{
					'@type': 'InteractionCounter',
					interactionType: 'https://schema.org/FollowAction',
					userInteractionCount: profile.followersCount ?? 0,
				},
				{
					'@type': 'InteractionCounter',
					interactionType: 'https://schema.org/WriteAction',
					userInteractionCount: profile.postsCount ?? 0,
				},
			],
		},
	});
};
