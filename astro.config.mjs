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
    // Kept on, but note it does NOT fail a static build on its own: verified
    // 2026-09-10 that `astro build` exits 0 with GIFT_DATA unset. R9's
    // missing-data half is carried by src/pages/gift.astro importing
    // astro:env/server and handing the value to readGiftData, which throws on
    // anything unparseable -- including a missing value. This flag matters
    // only if a server adapter is added later.
    validateSecrets: true,
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
