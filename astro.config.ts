import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	site: 'https://armutebi.com',

	integrations: [mdx(), sitemap()],

	vite: {
		plugins: [tailwindcss()],
	},

	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Bricolage Grotesque',
			cssVariable: '--font-bricolage',
			fallbacks: ['sans-serif'],
		},
	],
});
