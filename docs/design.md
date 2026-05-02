# Wake 'n Baker's: Bacon Makers — Design Source-of-Truth

> Last updated: 2026-05-02. This is the design source-of-truth. When design changes, update this doc in the same PR.
>
> Visual canon lives at [@wake.n.bakers.bac](https://www.tiktok.com/@wake.n.bakers.bac); art notes are in [`visual-direction.md`](visual-direction.md); character bibles are in [`characters.md`](characters.md).

## What we're building

A Tom & Jerry–style asymmetric multiplayer kitchen comedy. Three playable roles, three completely different gameplay loops, one shared restaurant. Plus a rival restaurateur (Pam Stax, who runs the Stax Pamcakes food truck) anchoring the dining floor and competing with the diner from across the street.

**The vibe:** silent slapstick. Friendly chaos, never violent. The humor is in dramatic irony — the audience sees what the characters don't.

## The dollhouse-cutaway frame

The screen shows two rooms simultaneously:

- **Top half** — kitchen, top-down perspective
- **Bottom half** — dining floor, side-scroller perspective
- Connected by a pass-through window and a doorway. Characters who walk through the doorway visually rotate 90° between perspectives. This is canon, it's a feature, it's the game's signature visual.

## The three playable roles

### Chris — Survivor (and Artisan)

Blonde male chef, smug-cool resting face, white coat. **Master craftsman** — treats bacon as a serious medium and his cocky face is earned competence. Plays from the **kitchen, top-down**. Goal: cook bacon, serve customers, endure Hamlet's sabotage. He is *enduring*, not winning. Lose condition: composure meltdown (apron hits the floor, storms out).

**Composure meter** (visible only to Chris's player):

- Drains with sabotage, recovers with successful cooks.
- Visual escalation at 100/75/50/25/0%.
- Recovery is slow, depletion is fast. That asymmetry IS the survival rhythm.
- Math: [`packages/game-core/src/scoring/composure.ts`](../packages/game-core/src/scoring/composure.ts).

**Defensive vocabulary** (deliberately limited to 5 tools — he's reactive):

- **Pan slam** — stuns Hamlet for a beat in melee range.
- **Counter wipe** — clears one slick or flour bomb.
- **Lid shield** — covers a cooking item, sabotage-immune for ~3s.
- **Whistle** — briefly reveals Hamlet's location.
- **Cover-up** — context-sensitive quick action when Herb is incoming (toss bowl over Hamlet, kick mess under counter, body-block smoke). Successful covers restore significant composure AND boost Hospitality Score.

### Hamlet — Patient Predator

Salmon-pink pig in a chef's toque. Plays from the **kitchen, top-down**. Goal: sabotage Chris, eventually steal bacon. He's a deck of cards, not a toolbar — each sabotage is a *play* with cost, timing, and tells.

**Tier 1 — Pranks** (short cooldown, low Heat, chip damage)

- **Salt avalanche** — tips a shaker onto one cooking item, ruins it.
- **Burner nudge** — flicks heat up/down a notch (burn or stay raw).
- **Pan swap** — moves a hot pan one burner over while Chris is looking away.
- **Plate clatter** — knocks a clean stack to the floor.

**Tier 2 — Schemes** (medium cooldown, requires positioning, real composure damage)

- **Butter slick** — Hamlet has to physically place it; chokepoint matters.
- **Bait swap** — replaces finished bacon with a rubber decoy.
- **Smoke signal** — deliberately burns something; triggers Herb visit (sabotage AND forced cover-up).
- **Timer reset** — spins Chris's cooking clock back to zero (quietly devastating).

**Tier 3 — Heists** (long cooldown, massive payoff, Heat spikes hard)

- **Grease fire** — small flame, Chris must run for extinguisher; soot streak on his face for the rest of the shift (cosmetic).
- **Walk-in lockout** — shoves Chris in the freezer briefly; emerges shivering.
- **Dumbwaiter swap** — wrong order goes to Herb; first real crack in the Hospitality dashboard.
- **Bacon Run** — when bacon is on the cooling rack, sprint and grab it. Maxes Heat instantly, triggers chase sequence. Highest payoff, highest risk.

**Heat Meter** governs Hamlet's risk:

- Tiers generate Heat at different rates (see [`heat.ts`](../packages/game-core/src/scoring/heat.ts)).
- Maxed Heat (accumulation OR Bacon Run) triggers a chase — Chris pursues with frying pan; Hamlet can't sabotage until he escapes.
- Heat decays during cooldown. Patient Hamlets win.

### Herb — Comedy Showcase

Burly, dark-bearded chef, perma-grin. Plays from the **dining floor, side-scroll**, with periodic kitchen visits. **Herb is canonically oblivious. He NEVER figures out what's happening. This is locked.** The moment he clocks the chaos, the joke dies.

Crucially: **Herb is not a buffoon.** He's genuinely warm, well-intentioned, and amazing at service. Customers love him because he's *actually good*. The dramatic irony is that the *people* love him while the *kitchen* burns; he just doesn't see the kitchen.

Herb's gameplay is fundamentally different — it's not strategic, it's a **dialogue jukebox with legs**. Lean-back fun, not optimization.

**The Quip Wheel.** When Herb is near a customer, coworker, or witnessing something, a 4-option dialogue wheel appears. Options refresh based on game state. Player picks one. Line plays. Something happens.

**Critical design rule:** every option must be funny in its own way, and **none should have a clearly best mechanical outcome**. Players pick based on which line makes them laugh, not which scores highest.

Every wheel includes:

- A **safe/polite** option (small reliable Hospitality)
- A **non-sequitur/wildcard** option (RNG, sometimes the highest-value play in the game)
- A **generous** option (good for score, often disrupts Chris)
- A **wildcard silent beat** (`"..."` / shrug / whistle — pure timing, sometimes nothing happens, sometimes it's the funniest moment of the round)

At least one option per wheel has **no mechanical effect at all** — pure flavor. Comedy > optimization.

**Herb Vibes meter** (visible only to Herb's player). High Vibes: sunbeam, customers clap on entrance, tip jar glows. Low Vibes: restaurant muted, soundtrack tightens. Soft amplifier for Hospitality gains. Never dictates correct choices.

**Hospitality Score** is the global game score, displayed on a 1990s chain-restaurant-style corporate dashboard with a thumbs-up mascot. The joke: it reflects Herb's reality, not the player's. Customers leave 5-star reviews after witnessing grease fires. Score has a soft cap that *eventually* cracks under catastrophic failures. The first negative review should feel tectonic.

**Yelp digest** at end of shift: 5 randomly generated reviews missing the point spectacularly. Templates live in [`reviews.json`](../packages/content/src/reviews.json). Inherently shareable. This is the IP flywheel.

## Pam Stax — Rival restaurateur

Brunette, teal-and-red apron, sly knowing smile. **Owns Stax Pamcakes**, a competing food truck — pancakes vs the diner's bacon. Friendly rivalry; they'll work together when it counts but their businesses compete.

In Sprint 4 she shows up as an NPC moving the dining floor (working a shift at the diner, presumably scoping the competition). In Sprint 5+ she anchors a new event-shift type — **Bacon vs Pancakes Throwdown** — where her truck pulls up across the street and customers split between the two operations.

She's also the audience-surrogate inside the diner: where Herb misses everything, Pam catches it all and never says a word. Full bible in [`characters.md`](characters.md).

## Herb visit beat structure

Herb wanders into the kitchen on a loose timer (60–90s, jittered) plus event triggers (smoke alarm, loud crash, customer asking, long wait). Visit lasts ~8 seconds. He always has a reason (refilling salt, grabbing a spoon, asking a question he'll forget).

During the visit: Hamlet's stealth is at maximum risk; Chris's cover-up window is open. After Herb leaves, score resolves based on what Herb "saw" — which, since he's Herb, is almost never reality.

This pulse rhythm — tense buildup → Herb visit → exhale → buildup → chase → reset — IS the structure of every Tom & Jerry short. The gameplay loop is the cartoon.

## Locked design rules

1. **Herb is eternally oblivious. No exceptions.**
2. **Never violent. Friendly chaos only. Tom & Jerry, not Itchy & Scratchy.**
3. **The Quip Wheel must always have at least one option with zero mechanical effect.** Comedy > optimization.
4. **Hamlet wins through Chris's downfall, not direct point accumulation.** His scoring is sabotage damage and bacon stolen, but the win condition is *making Chris break*.
5. **The Hospitality dashboard scoring system reflects HERB's perception, not reality.** Catastrophes can pass unnoticed. This contrast is the central joke.
6. **The bacon always ships.** Chris and Hamlet clash forever — sabotage and counter-sabotage are the rhythm — but they always produce great work together. Service output is preserved; **composure is the price.** The dashboard isn't lying; the food *actually* comes out. The dramatic irony is in the *process*, not the *result*.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | Vercel-clean; static landing + dynamic /play |
| Game engine | Phaser 3 + TypeScript | Mixed top-down/side-scroll, Matter.js built in |
| Physics | Matter.js (via Phaser) | Cartoon physics: squash, bounce, slips |
| State | Zustand | Lightweight; plays nice with Phaser scenes |
| Backend | Supabase (Postgres + Auth + Realtime + Storage) | Auth, runs, scores, kitchens, async multiplayer |
| Real-time | Supabase Realtime / PartyKit | Future live PvP |
| ORM | Prisma | Type-safe schema |
| Deploy | Vercel | Preview deploys per PR |
| Sprites | Aseprite → spritesheets | Industry standard 2D |
| Animation | Phaser tweens + atlases (in-game); Remotion (cutscenes/trailers) | |
| Voice (later) | ElevenLabs | Herb's pleasant barks corpus |
| Quip corpus | JSON, AI-augmented offline | Pre-write quips; expand offline with Claude API |

## MVP sprint roadmap

### Sprint 1 — Foundation (in progress)

- Monorepo (pnpm + Turborepo) ✅
- Next.js shell, Phaser scene, "Hello Savoryville" ✅
- Tailwind v4 + Savoryville design tokens ✅
- Supabase + Prisma schema (placeholder DATABASE_URL) ✅
- Vercel deploy
- Sentry wired

### Sprint 2 — Chris core loop (single-player vs. AI Hamlet)

- Top-down kitchen scene with one cooking station
- Chris movement, basic cooking timer, plate-up to pass-through
- AI Hamlet stub triggers Tier 1 pranks on a timer
- Composure meter, basic HUD
- One customer at a time, basic patience timer
- Win/lose conditions

### Sprint 3 — Hamlet's deck + chase

- All Tier 1 + Tier 2 sabotages
- Heat Meter + chase sequence
- Bacon Run as Tier 3 first heist
- Pivot to local hotseat 2-player (keyboard split / controller)

### Sprint 4 — Herb mode

- Side-scrolling dining floor
- Pass-through window + doorway perspective transition (prototype early)
- Quip Wheel UI + selection logic
- Quip corpus v1 (50–100 lines, hand-written)
- Hospitality dashboard (1990s aesthetic)
- Herb visit timer + trigger system
- Herb Vibes meter
- **Pam Stax NPC** — wandering server loop

### Sprint 5 — Shift structure + Yelp digest

- Round/shift system (Tuesday Lunch, Friday Rush, Sunday Brunch)
- **Bacon vs Pancakes Throwdown** — event shift type. Pam's Stax Pamcakes truck pulls up across the street; customers split between the two; head-to-head Hospitality scoring
- Multiple customer types
- End-of-shift Yelp review generator
- Save runs to Supabase
- Basic leaderboards

### Sprint 6 — Polish + share

- Replay capture (key events → GIF/video)
- Yelp review share cards
- Sound design (foley-heavy silent cartoon)
- Visual polish, screen shake, particle slapstick

### Post-MVP

- Async multiplayer (level editor, share kitchens)
- Career mode (week meta-loop, unlockable Hamlet T3)
- Real-time PvP
- ElevenLabs Herb voice
- Mobile touch
- Patreon-tier exclusive customers/skins
- Stax Pamcakes truck visible on the dining-floor side of the dollhouse cutaway
- Pam reactive expressions tied to live game state

## Open questions (prototype-don't-decide)

1. **Camera framing**: top/bottom split vs. L-shape. Top/bottom = cleaner cartoon language; L-shape = more level-editor canvas. Sprint 4 problem.
2. **Hamlet's secondary objectives**: pure bacon count vs. per-customer targets vs. VIP sabotage. Sprint 3 problem.
3. **Career mode shape**: weekly progression with unlocks, or replayable shifts with mutators? Post-MVP.
4. **Single best Herb quip**: playtesting will reveal the meme line. Build for iteration on the corpus.
5. **Bacon vs Pancakes shape**: is it a head-to-head split-screen mode, or does Pam's truck siphon customers from your shift? Sprint 5 prototype call.

## References

- Visual canon: [@wake.n.bakers.bac on TikTok](https://www.tiktok.com/@wake.n.bakers.bac) — see [`visual-direction.md`](visual-direction.md)
- Discord: discord.gg/GhNSqKj7Q
- Character bibles: [`characters.md`](characters.md)

When in doubt: **ship the joke**.
