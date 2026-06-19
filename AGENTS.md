# FactoryBid OS Agent Notes

## Stack

- Runtime/package manager: Bun.
- Frontend: Vite, React, TypeScript, Tailwind CSS v4, shadcn/ui.
- Backend/data: Convex. Local development can run without a cloud account through `bun run convex:once` or `bun run convex:dev`.
- Tests: Vitest for unit/component tests and Playwright for browser smoke tests.

## Commands

- Install dependencies: `bun install`
- Start app: `bun run dev`
- Build: `bun run build`
- Lint: `bun run lint`
- Unit tests: `bun run test`
- Browser smoke tests: `bun run test:e2e`
- Start local Convex once: `bun run convex:once`

## Conventions

- Keep product logic deterministic and testable. AI integrations must sit behind explicit server-side adapters and must not be required for core quote calculations.
- Do not commit secrets. Use `.env.local` for local values; keep public examples in `.env.example`.
- Treat `convex/_generated/**` as generated code. Regenerate it with Convex tooling instead of editing it manually.
- Keep early PRs small enough for CodeRabbit and Greptile to review well.
- Prefer feature branches named `codex/<short-description>`.
