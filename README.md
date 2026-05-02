# Wake 'n Baker's: Bacon Makers

Silent-cartoon asymmetric multiplayer kitchen comedy. Three roles, three completely different gameplay loops, one shared restaurant.

- **Chris** (blonde chef, top-down kitchen) — survivor enduring the shift
- **Hamlet** (pig, top-down kitchen) — patient predator running a deck of sabotages
- **Herb** (burly friendly chef, side-scroll dining floor) — eternally oblivious comedy showcase

The dollhouse-cutaway frame shows kitchen + dining floor simultaneously. Characters rotate 90° between perspectives when they walk through the doorway. The Hospitality dashboard reflects Herb's reality, not the player's — that contrast is the whole joke.

## Stack

- **Next.js 15** (App Router) — landing, level browser, profile, leaderboards
- **Phaser 3 + TypeScript** — game scenes
- **Tailwind v4** — design tokens, utility CSS
- **Zustand** — state management
- **Supabase + Prisma** — auth, database, realtime
- **Vercel** — deploy
- **Turborepo + pnpm workspaces** — monorepo

## Layout

| Path | Role |
|---|---|
| `apps/web/` | Next.js shell (deployed) |
| `apps/game/` | Phaser scenes (workspace package, imported by web) |
| `packages/game-core/` | Pure TS game logic, no rendering — testable |
| `packages/content/` | Quips, customers, shifts, reviews (JSON) |
| `packages/ui/` | Shared React components (HUD, menus, dashboard) |
| `packages/db/` | Prisma schema + Supabase client |
| `tools/corpus-generator/` | Offline Claude API quip expansion |
| `docs/` | Design source of truth |

## Dev

```bash
pnpm install
pnpm dev
```

The full design brief is in [`docs/design.md`](docs/design.md).

## Locked design rules

1. Herb is eternally oblivious. No exceptions.
2. Never violent. Friendly chaos only.
3. Quip Wheel must always have at least one option with zero mechanical effect.
4. Hamlet wins through Chris's downfall, not direct point accumulation.
5. The Hospitality dashboard reflects HERB's perception, not reality.

When in doubt, ship the joke.
