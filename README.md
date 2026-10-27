# SkyKit

Me dicking around with the `@atproto/api`

## Checks

`pnpm check` runs the guardrails in `tools/checks` (ported from cv0),
Vite+ format and lint with warnings as errors, and svelte-check.

The guardrails fail on: `$effect` in app code, nested ternaries,
non-snake_case names, source files over 300 lines, and tracked `.env`
or SQLite files. Test them with `pnpm test:guardrails`.
