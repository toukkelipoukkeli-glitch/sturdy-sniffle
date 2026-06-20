# FactoryBid OS

Local-first manufacturing quote automation workspace.

This repository is in active product buildout. The stack, CI, automated review bots, deterministic quote engines, Convex workflow boundaries, connector adapter boundaries, and the first operator workspace flows are already in place.

See [ROADMAP.md](./ROADMAP.md) for the planned FactoryBid OS product slices.

## Stack

- Bun
- Vite + React + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Convex
- Vitest + Playwright

## Local Checks

Convex codegen requires a configured `.env.local` or an injected `CONVEX_DEPLOYMENT`.

```sh
bun install
bun run lint
bun run test
bun run test:e2e
bun run convex:codegen
bun run build
```
