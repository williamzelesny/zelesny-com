# zelesny-com

Source for **www.zelesny.com** — William Zelesny's personal site. This repo builds a static site; the homelab cluster serves it. Replaces the legacy site previously hosted at `www.zelesny.com`.

## Scope

- **Initial:** landing page + resume, ported from content currently live on `www.zelesny.com`.
- **Planned:** portfolio section (not yet scoped).
- **Design direction:** minimal. Text-first, restrained typography, no heavy visuals. Refine iteratively — don't over-design in the first pass.

## Stack

- **Framework:** [Astro](https://astro.build) 7.x — prerendered by default, no client JS.
  `/gift` opts out of prerendering (`export const prerender = false`) so its data is read at
  request time; everything else is static. Served by `@astrojs/node` in standalone mode.
- **Styling:** [Tailwind CSS](https://tailwindcss.com) 4.x via `@tailwindcss/vite`. Global stylesheet at `src/styles/global.css` is just `@import "tailwindcss";`. Import it once from the shared layout (or each page until a layout exists).
- **Node:** `>=22.12.0` (see `package.json` `engines`).
- **Output:** `dist/client` (prerendered) plus `dist/server` (request handler), run by Node in-container.
- **Testing:** Vitest (`npm test`) and `astro check` (`npm run check`); both gate CI ahead of the image build.

## Repository layout

```
src/
  pages/          # routes — index, resume, gift
  styles/
    global.css    # @import "tailwindcss";
  layouts/
    Base.astro    # shared shell; `unlisted` prop emits noindex/noarchive/no-referrer
  lib/
    gift.ts       # validates GIFT_DATA; pure over a string so it is testable
  (components/)
public/           # static assets (favicon.*, images, resume PDF if any)
astro.config.mjs  # node adapter, GIFT_DATA env schema, @tailwindcss/vite
package.json
tsconfig.json
Dockerfile        # multi-stage: deps → build → runtime (node)
vitest.config.ts
docs/             # brainstorms/ and plans/
```

## Dev

- `npm run dev` — dev server with HMR.
- `npm run build` — emits `dist/`.
- `npm run preview` — serve the build locally.
- `npm run check` — type check.
- `npm test` — Vitest.

Building needs a `GIFT_DATA` value only for `/gift` at request time; `.env.example` documents
the shape. See README for the Doppler flow.

## Content

**Source of truth for initial port:** `https://www.zelesny.com` (to be replaced by this site).

Key content pulled from the legacy site — encode it as content collections or inline in the relevant page:

- **Identity:** William Zelesny, Clinton NJ, focus on Application Performance Management (APM) and DevOps.
- **Education:** Stevens Institute of Technology — B.S. Computer Science (2003–2007), M.S. Information Systems / Project Management (2009–2015).
- **Work history:** Volvo Cars (VP, Software Engineer, 2024–present), JPMorgan Chase (VP, Software Engineer, 2022–2024), PNC (Senior Technology Engineer 2018–2022, Lead Software Engineer / Dynatrace DCRUM architect 2014–2018), Verizon Wireless (Sr Information Analyst, 2011–2014), Merck/Schering-Plough (IT Associate Analyst, 2008–2011).
- **Contact:** `william@zelesny.com` · LinkedIn `wzelesny` · X `@williamzelesny`.

Treat the legacy site as a starting point, not gospel — we're free to rewrite.

## Deployment

Deploys to the homelab k3s cluster in the sibling repo `~/Code/homelab-kube-cluster` (GitHub: `williamzelesny/homelab-kube-cluster`). Cluster is GitOps-driven by ArgoCD with RenovateBot watching for image bumps, and traffic to `*.zelesny.com` is routed via a Cloudflare Tunnel (`cloudflared` workload).

### Flow

1. **This repo** builds a container image (static site + minimal web server). Image published to a registry (likely GHCR — confirm tag/repo when CI is wired).
2. **homelab-kube-cluster** gets a new workload under `manifests/workloads/zelesny-com/`:
   - `deployment.yaml` referencing the image
   - `service.yaml` — `ClusterIP` is sufficient since cloudflared hits it via cluster DNS (no need for a MetalLB LoadBalancer IP unless we want LAN access too — see `homepage`/`heimdall` for the MetalLB pattern)
   - `kustomization.yaml`
3. **Doppler secret:** `manifests/bootstrapping/doppler/zelesny-com-doppler-secret.yaml`, a `DopplerSecret`
   mirroring `homepage-doppler-secret.yaml`. The Deployment reads `GIFT_DATA` from the managed Secret via
   `secretKeyRef` — same pattern as `homepage`. Without it `/gift` returns an error; the other pages are fine.
4. **ArgoCD app:** `gitops/apps/zelesny-com-app.yaml` mirroring `homepage-app.yaml`, pointing at `manifests/workloads/zelesny-com`.
5. **Cloudflare tunnel routing:** add an ingress entry to `manifests/workloads/cloudflared/configmap.yaml`:
   ```yaml
   - hostname: zelesny.com            # or www.zelesny.com — confirm which the tunnel terminates
     service: http://zelesny-com.zelesny-com.svc.cluster.local:80
   ```
6. **DNS:** Cloudflare DNS record for `zelesny.com` / `www.zelesny.com` points at the tunnel (likely already configured for the legacy site — verify and repoint).

### CI/CD

- Image build + push on merge to `main` via `.github/workflows/build-image.yml`. Type check and tests gate the build.
- Renovate in the homelab repo picks up new tags and bumps the Deployment — that's how rollouts happen. Matches the pattern used by other workloads.

## Conventions

- Keep pages prerendered and free of client-side JS unless there's a concrete reason. `/gift` is the
  one exception: it renders per request so its data can come from a runtime secret instead of the image.
- Keep the design minimal — whitespace, readable type, one or two accents. Push back on decoration.
- Content lives in this repo, in plain files (MD/MDX preferred for resume sections so they're diff-friendly).
  **Exception:** the children's names and Ugift codes on `/gift` are personal data and never enter
  this repo. They come from Doppler at runtime — see README and `docs/plans/`.
- Image: small base (Alpine or distroless), multi-stage build, no dev deps in final layer.

## Open questions (resolve as we go)

- Root domain vs. www — which hostname does the tunnel terminate, and should the other redirect?
- ~~Registry~~ — resolved: GHCR under `williamzelesny/zelesny-com`.
- Resume format — inline HTML page, downloadable PDF, or both?
- Is there a portfolio project list anywhere yet, or do we build that later?
