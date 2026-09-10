import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Lives in src/lib/, not next to the page: anything under src/pages/ is treated
 * as a route by Astro, so a test file there breaks the build.
 *
 * The page carries two facts that were never confirmed against NJBEST. It
 * renders per request, so a throw in its frontmatter would 500 a visitor
 * rather than fail CI -- this test is the gate instead. `npm test` runs in the
 * workflow ahead of the image build, so the page cannot ship while either
 * placeholder is still in place.
 */
describe('gift page copy', () => {
	it('has no unconfirmed placeholder facts left', () => {
		const source = readFileSync('src/pages/gift.astro', 'utf8');

		expect(
			source,
			'Replace MINIMUM and PAYMENT_METHODS in src/pages/gift.astro with values observed in the real NJBEST Ugift flow before shipping.',
		).not.toContain('[CONFIRM');
	});
});
