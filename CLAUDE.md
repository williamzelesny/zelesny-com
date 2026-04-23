# zelesny-com

Source for **www.zelesny.com** — William Zelesny's personal site. This repo builds a static site; the homelab cluster serves it. Replaces the legacy site previously hosted at `www.zelesny.com`.

## Scope

- **Initial:** landing page + resume, ported from content currently live on `www.zelesny.com`.
- **Planned:** portfolio section (not yet scoped).
- **Design direction:** minimal. Text-first, restrained typography, no heavy visuals. Refine iteratively — don't over-design in the first pass.

## Stack

- **Framework:** [Astro](https://astro.build) 6.x — static output, low JS by default.
- **Styling:** [Tailwind CSS](https://tailwindcss.com) 4.x via `@tailwindcss/vite`. Global stylesheet at `src/styles/global.css` is just `@import "tailwindcss";`. Import it once from the shared layout (or each page until a layout exists).
- **Node:** `>=22.12.0` (see `package.json` `engines`).
- **Output:** static, served by a tiny web server in-container (TBD — nginx or `serve`).

## Repository layout

```
src/
  pages/          # routes — index.astro currently; add resume.astro, etc.
  styles/
    global.css    # @import "tailwindcss";
  (layouts/)      # add a Layout.astro and import global.css there once we have >1 page
  (components/)
  (content/)      # MDX/MD content collections for resume sections if we go that route
public/           # static assets (favicon.*, images, resume PDF if any)
astro.config.mjs  # registers @tailwindcss/vite
package.json
tsconfig.json
Dockerfile        # TBD — multi-stage: build → static server
```

## Dev

- `npm run dev` — dev server with HMR.
- `npm run build` — emits `dist/` (static).
- `npm run preview` — serve the built `dist/` locally.

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
3. **ArgoCD app:** `gitops/apps/zelesny-com-app.yaml` mirroring `homepage-app.yaml`, pointing at `manifests/workloads/zelesny-com`.
4. **Cloudflare tunnel routing:** add an ingress entry to `manifests/workloads/cloudflared/configmap.yaml`:
   ```yaml
   - hostname: zelesny.com            # or www.zelesny.com — confirm which the tunnel terminates
     service: http://zelesny-com.zelesny-com.svc.cluster.local:80
   ```
5. **DNS:** Cloudflare DNS record for `zelesny.com` / `www.zelesny.com` points at the tunnel (likely already configured for the legacy site — verify and repoint).

### CI/CD

- Image build + push on merge to `main` (GitHub Actions, most likely). Not yet configured.
- Renovate in the homelab repo picks up new tags and bumps the Deployment — that's how rollouts happen. Matches the pattern used by other workloads.

## Conventions

- Keep the site static. Resist adding a backend or client-side JS unless there's a concrete reason.
- Keep the design minimal — whitespace, readable type, one or two accents. Push back on decoration.
- Content lives in this repo, in plain files (MD/MDX preferred for resume sections so they're diff-friendly).
- Image: small base (Alpine or distroless), multi-stage build, no dev deps in final layer.

## Open questions (resolve as we go)

- Root domain vs. www — which hostname does the tunnel terminate, and should the other redirect?
- Registry — GHCR under `williamzelesny/zelesny-com`, or elsewhere?
- Resume format — inline HTML page, downloadable PDF, or both?
- Is there a portfolio project list anywhere yet, or do we build that later?
