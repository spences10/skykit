<script lang="ts">
	import {
		HandleSearch,
		LandingDetails,
	} from '#lib/components/index.js';
	import {
		create_seo_config,
		home_schema,
		site_description,
	} from '#lib/seo.js';
	import { Head, SchemaOrg } from 'svead';

	const seo_config = create_seo_config({
		title: 'SkyKit · Free Bluesky analytics, no sign-in',
		description: site_description,
	});
</script>

<Head {seo_config} />
<SchemaOrg schema={home_schema()} />

<div class="container mx-auto max-w-2xl p-4 pt-20">
	<div class="mb-12 text-center">
		<h1
			class="mb-4 bg-linear-to-r from-primary to-secondary bg-clip-text text-5xl leading-normal font-extrabold text-transparent"
		>
			SkyKit
		</h1>
		<p class="text-lg text-base-content/70">
			Free Bluesky analytics for any handle
		</p>
	</div>

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<HandleSearch />
			<p class="text-sm text-base-content/60">
				No sign-in, no app password. Just a handle.
			</p>
		</div>
	</div>

	<LandingDetails />
</div>
