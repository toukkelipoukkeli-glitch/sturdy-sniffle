# FactoryBid OS

Local-first manufacturing quote automation workspace.

This repository is currently in bootstrap mode. The first pull request is only intended to verify the development stack, CI, and automated review bots before product features are added.

See [ROADMAP.md](./ROADMAP.md) for the planned FactoryBid OS product slices.

## Stack

- Bun
- Vite + React + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Convex
- Vitest + Playwright

## Local Checks

```sh
bun install
bun run lint
bun run test
bun run test:e2e
bun run build
```
