# zelesny-com

Source for [www.zelesny.com](https://www.zelesny.com). A static [Astro](https://astro.build) site,
built into a container image and served from a homelab k3s cluster.

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
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Run the test suite |

## Gift data

`/gift` is an unlisted page that shares the children's NJBEST Ugift codes with family.
It renders from a single environment variable, `GIFT_DATA`, holding **single-line JSON**:

```
GIFT_DATA=[{"name":"Example","code":"AAA-000"}]
```

**The authoritative copy lives in the password manager.** Both the `GIFT_DATA` repository
secret and your local `.env.local` are derived from it — GitHub Actions secrets are
write-only and cannot be read back, so without that copy there is no way to make an
incremental edit without a fresh NJBEST login.

The data never enters this repository. It reaches the build as an Actions secret, crosses
into the container as a BuildKit secret mount, and is validated by `src/lib/gift.ts` before
anything renders. A missing or malformed value fails the build rather than publishing a page
with blank codes.

Building without it will fail. For a clone that just needs the site to build, any
well-formed placeholder works.

### Updating a code or adding a child

1. Update the authoritative copy in the password manager.
2. Update the `GIFT_DATA` repository secret in GitHub Actions settings.
3. **Push an empty commit to `main`.** A `workflow_dispatch` run on an unchanged commit
   re-emits the same SHA tag, so Renovate would see no bump and nothing would roll out.
4. Confirm the workflow pushed a new tag, that Renovate opened the bump PR in
   `homelab-kube-cluster`, and that it merged.
5. Load `/gift` and confirm the rendered pairings match NJBEST.

## Standing constraints

Three things that look like harmless cleanups but are not:

- **Do not re-enable Docker layer caching** in `.github/workflows/build-image.yml`.
  `cache-to: type=gha,mode=max` exports the layer holding the rendered page, and on a public
  repository anyone who can open a pull request can read those caches. Actions caches have no
  visibility setting.
- **Never add `/gift` to a `robots.txt` `Disallow` list.** Blocking the crawl stops crawlers
  from ever reading the page's own no-index instruction, which is self-defeating.
- **If a sitemap integration is ever added, exclude `/gift` from it.**

Background and rationale live in `docs/brainstorms/` and `docs/plans/`.
