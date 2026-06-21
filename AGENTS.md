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
- Regenerate Convex types: `bun run convex:codegen`
- Start local Convex once: `bun run convex:once`
- Autonomous build handoff: `docs/AUTONOMOUS_BUILD_HANDOFF.md`

## Conventions

- Keep product logic deterministic and testable. AI integrations must sit behind explicit server-side adapters and must not be required for core quote calculations.
- Do not commit secrets. Use `.env.local` for local values; keep public examples in `.env.example`.
- `.worktreeinclude` lists `.env.local` so managed Codex worktrees can copy local ignored deployment settings without committing their contents.
- Treat `convex/_generated/**` as generated code. Regenerate it with Convex tooling instead of editing it manually.
- Keep early PRs small enough for CodeRabbit and Greptile to review well.
- Prefer feature branches named `codex/<short-description>`.
- When a long autonomous run pauses or hands off to another machine, update `docs/AUTONOMOUS_BUILD_HANDOFF.md` without committing secrets.
