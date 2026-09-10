# zelesny-com

Source for [www.zelesny.com](https://www.zelesny.com). An [Astro](https://astro.build) site,
built into a container image and served from a homelab k3s cluster.

Two pages are prerendered. One — `/gift` — renders per request, so the data it shows never
enters the build.

## Requirements

- Node 22 (`package.json` sets `engines.node` to `>=22.12.0`; CI and the image both pin 22)

## Getting started

```sh
npm ci
cp .env.example .env.local   # then replace the placeholder gift data
npm run dev
```

| Command | What it does |
| :------ | :----------- |
| `npm run dev` | Dev server with HMR at `localhost:4321` |
| `npm run build` | Build into `dist/` (`dist/client` prerendered, `dist/server` the request handler) |
| `npm run preview` | Serve the build locally |
| `npm run check` | Type check (`astro check`) |
| `npm test` | Run the test suite |

## Gift data

`/gift` is an unlisted page that shares the children's NJBEST Ugift codes with family.
It renders from a single environment variable, `GIFT_DATA`, holding **single-line JSON**:

```
GIFT_DATA=[{"name":"Example","code":"AAA-000"}]
```

**Doppler is the authoritative copy.** In the cluster, the Doppler operator syncs it into a
Kubernetes Secret and the Deployment exposes it to the container as `GIFT_DATA` — the same
pattern every other workload in `homelab-kube-cluster` uses. Locally, `.env.local` stands in.

The data never enters this repository, the build, the image, or the registry. `/gift` opts out
of prerendering, so the value is read at request time and validated by `src/lib/gift.ts` before
anything renders. Malformed data throws rather than rendering a page with wrong codes.

### Updating a code or adding a child

1. Update the value in Doppler.
2. The operator syncs the Kubernetes Secret; restart the deployment to pick it up.
3. Load `/gift` and confirm the rendered pairings match NJBEST.

No rebuild, no new image, no Renovate bump — the data is not in the image.

## Standing constraints

Two things that look like harmless cleanups but are not:

- **Never add `/gift` to a `robots.txt` `Disallow` list.** Blocking the crawl stops crawlers
  from ever reading the page's own no-index instruction, which is self-defeating. The page
  sends `noindex, noarchive` and a no-referrer instruction via the layout's `unlisted` prop.
- **If a sitemap integration is ever added, exclude `/gift` from it.**

Background and rationale live in `docs/brainstorms/` and `docs/plans/`.
