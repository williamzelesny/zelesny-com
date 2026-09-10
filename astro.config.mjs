// @ts-check
import { defineConfig, envField } from 'astro/config';

import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Pages are prerendered by default. Only /gift opts out (see its frontmatter):
  // it renders per request so the children's names and codes are read from the
  // environment at runtime and never enter the build, the image, or the registry.
  adapter: node({ mode: 'standalone' }),
  env: {
    schema: {
      // Supplied at runtime by the Doppler operator, which syncs it into a
      // Kubernetes Secret the Deployment exposes as an env var. Single-line
      // JSON; see .env.example. Never present at build time -- validateSecrets
      // is deliberately left off, or the build would demand a value it must
      // not have.
      GIFT_DATA: envField.string({ context: 'server', access: 'secret' }),
    },
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
