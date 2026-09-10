// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      // The children's first names and Ugift codes, as single-line JSON.
      // Declared here only -- .env files are not loaded inside this config.
      // See docs/plans/2026-09-10-001-feat-ugift-contribution-page-plan.md.
      GIFT_DATA: envField.string({ context: 'server', access: 'secret' }),
    },
    // No-op for a static build (verified 2026-09-10: `astro build` exits 0
    // with GIFT_DATA unset). The real guard is the page's import plus
    // readGiftData(). Kept only as a tripwire if an adapter is ever added.
    validateSecrets: true,
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
