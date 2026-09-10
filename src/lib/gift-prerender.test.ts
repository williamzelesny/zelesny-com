import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * One line in one file is the whole barrier.
 *
 * /gift opts out of prerendering so the children's names and codes are read at
 * request time and never enter the build. If that opt-out is removed, the page
 * is prerendered into the image -- and ghcr.io/williamzelesny/zelesny-com is
 * anonymously pullable, so that would publish them permanently.
 *
 * It would fail closed in CI today (GIFT_DATA is not set there, so prerendering
 * would error), but that is a coincidence of the current workflow rather than a
 * guarantee. This asserts the guarantee.
 */
describe('gift page rendering mode', () => {
	it('is not prerendered', () => {
		const source = readFileSync('src/pages/gift.astro', 'utf8');

		expect(
			source,
			'/gift must stay server-rendered. Prerendering it bakes the children names and Ugift codes into the container image, which is published to a public registry.',
		).toContain('export const prerender = false');
	});

	it('passes the unlisted flag to the layout', () => {
		const source = readFileSync('src/pages/gift.astro', 'utf8');

		expect(
			source,
			'/gift must pass `unlisted` to Base.astro; without it the page loses its noindex, noarchive and no-referrer instructions.',
		).toMatch(/\bunlisted\b/);
	});
});
