import { defineConfig } from 'vitest/config';

// Deliberately not astro/config's getViteConfig: src/lib/gift.ts avoids
// importing astro:env/server precisely so it is testable outside Astro, and
// loading the Astro + Tailwind plugin chain tripled test startup for nothing.
export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
	},
});
