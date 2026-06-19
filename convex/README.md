# Convex Workflow

This directory contains the FactoryBid OS backend schema and future Convex functions.

## Local Generation

- Run `bun run convex:codegen` after changing files in `convex/`.
- Run `bun run convex:once` when you want Convex to codegen, typecheck, and push once to the configured dev deployment.
- `convex/_generated/` is generated output in this repo. Do not edit it manually; regenerate it with Convex tooling.

If cloud auth, deployment configuration, or quotas block Convex commands, keep changes local and validate the deterministic TypeScript/test surface that does not depend on the external deployment. Provider-backed features should keep mock/local fallbacks.
