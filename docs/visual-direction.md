# Visual Direction

Source: canon TikTok account [@wake.n.bakers.bac](https://www.tiktok.com/@wake.n.bakers.bac), the show that the game is paying off.

## Art language

- **2D hand-drawn cartoon, flat colors, thick brown outlines.** Painterly soft shading on key art / promotional, line-art-flat for in-show panels and gameplay
- Closest reference: *The Simpsons* visual grammar at the silhouette level, *The Triplets of Belleville* on color warmth, classic Tom & Jerry on pacing
- **Squash and stretch on every animation.** Cheap squash and stretch sells the entire vibe
- **Silent slapstick.** Characters never speak voiced dialogue in MVP; speech bubbles and foley do all the work
- **The dashboard UI is deliberately mid-90s corporate kitsch.** Comic Sans-adjacent fonts, gradient bars, mascot in the corner. The contrast between in-kitchen chaos and the cheerful dashboard IS the gag

## Setting

- **Cream/butter-yellow diner exterior** with red-and-cream striped awning, "DINER" sign in bold red lettering, rolling green hills, big rising sun behind
- Interior: warm wood, classic vinyl booths in deep red, chrome accents
- The kitchen is small enough to feel claustrophobic when Hamlet is in it
- Mid-American roadside aesthetic; never specific to a city

## Color tokens (Savoryville palette)

- CSS source: [`apps/web/src/app/globals.css`](../apps/web/src/app/globals.css) (`@theme` block)
- Phaser source: [`apps/game/src/palette.ts`](../apps/game/src/palette.ts)

| Family | Role | Notable shade |
|---|---|---|
| `bacon-*` | Heat / signage / brand red | `bacon-500` (#b23a1a) — primary CTA, "BACON MAKERS" title |
| `butter-*` | Warm light, mustard, diner skin | `butter-500` (#f5c547) — logo bg, friendly accents |
| `skillet-*` | Cast iron / line art | `skillet-900` (#2b201a) — outlines, dark backgrounds |
| `linen-*` | Cream / paper | `linen-100` (#fbf3e3) — page background |
| `sizzle-*` | Accent orange | `sizzle-500` (#e8761f) — bacon, heat, energy |
| `steam-*` | Neutral grey | kitchen tile, smoke |
| `dash-*` | 90s dashboard kitsch | teal + magenta + marigold |

**Character colors (locked from canon)**

- Hamlet: warm salmon `#f2a98f` (`palette.hamletPink`)
- Pam Stax: teal `#4ab8a8` (`palette.pamTeal`)
- Herb: dark beard, butter apron, black t-shirt
- Chris: butter-blonde hair, white coat, freckled

## Type

- **Display**: Fredoka — round, friendly, headline weight
- **Body**: Inter — neutral, readable
- **Dashboard**: Marker Felt / Comic Sans MS — *deliberately* off-brand kitsch (the joke)

Curly apostrophes in Wake 'n Baker's wordmark (`'`) — Sprint 2 typography pass swaps from JSX `&apos;` to true curly. Not a Sprint 1 blocker.

## Animation rules

- Squash on landings, stretch on jumps
- Eyes dart before bodies move (Hamlet especially — it's the tell)
- Bacon sizzles even when nothing else is happening (continuous foley + alpha pulse)
- Chase sequences add screen shake; everything else stays grounded
- The dashboard is the *only* UI that moves smoothly — its calm is the joke

## Brand mark

The pig-on-bacon roundel: pig face peeking over a wavy strip of bacon, on a butter-yellow disc, chocolate-brown ring border, maroon arched lockup ("WAKE 'N BAKER'S" top / "BACON MAKERS" bottom).

**TODO before Sprint 2:** request a vector (SVG) of the brand mark from the canon creator. Don't recreate by hand — it'll drift.

## Reference cache

When canon screenshots are dropped during a session, file them here:

- `docs/assets/refs/` (gitignored if large; PNG compressed if small)

Currently captured (2026-05-02):

- Logo close-up (pig-on-bacon disc)
- TikTok profile thumbnail grid (recurring storefront, 4-panel comics)
- "BACON MAKERS" key art (Herb + Chris + Hamlet, painterly, black background)
- 4-panel gameplay-loop comic (Herb-oblivious-while-chaos canon dynamic)
- Character lineup ("DINER" sign with Herb / Hamlet / Chris / Pam Stax labeled)

## What to ASK before guessing

- Brand mark vector (SVG)
- Character turnaround sheets (front / 3⁄4 / side / back) — needed before Sprint 2 sprite work
- Color callouts on saturated key art (the painterly version differs slightly from line-art panels)
- Whether Pam Stax has any planned reactive expressions vs. always-knowing-smirk
