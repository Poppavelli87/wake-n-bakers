# Character Bibles

Source-of-truth for character design, personality, and gameplay vocabulary. Keep in sync with [`design.md`](design.md) and the canon at [@wake.n.bakers.bac](https://www.tiktok.com/@wake.n.bakers.bac).

## Chris — the Survivor (and Artisan)

**Look** (canon)

- Blonde male chef, smug-cool resting face, light freckles
- White double-breasted chef coat (no toque on duty)
- Body language: arms crossed, hip cocked — earned competence, not posturing

**Identity**

- **Master craftsman.** Treats bacon as a serious medium. He doesn't cut corners.
- His smugness is earned: he's actually *good*. The cocky face is a master at work.
- The chaos around him is the *cost* of the work, not its failure.

**Voice / vibe**

- Silent in dialogue (no voice acting)
- Reads through animation: eye-rolls, exasperated huffs (foley), the slow burn of an artist watching his canvas get stepped on
- His humor: dignity-under-siege

**Player feel**

- Reactive, not proactive
- Five-tool defensive vocabulary (Pan slam, Counter wipe, Lid shield, Whistle, Cover-up)
- The whole role is a survival rhythm — Composure depletion fast, recovery slow

**Relationship with Hamlet**

- They clash *constantly* — sabotage and counter-sabotage are the rhythm
- Despite the clash, they *always produce great work*. The bacon always ships.
- This is canon: Hospitality scores stay high not because Herb is delusional but because the food actually does come out. **Composure is the price; service is preserved.**

**Lose condition**

- Composure hits 0 → meltdown animation: apron hits the floor, storms out the back door
- Bacon Run completes → automatic loss (Hamlet wins outright)

## Hamlet — the Patient Predator

**Look** (canon)

- Salmon-pink pig (warmer than baby pink — see [`palette.ts`](../apps/game/src/palette.ts) `hamletPink`)
- Wears a chef's toque he absolutely did not earn
- Smug knowing finger raised; "I told you" energy
- Tiny body, big presence

**Voice / vibe**

- Fully silent (no quips). Communicates through pose and action
- Comedic register: the Coyote, not the Roadrunner. Always *almost* getting away with it

**Player feel**

- Deck-of-cards sabotage system, three tiers (Pranks / Schemes / Heists)
- Heat meter governs risk; chase sequences punish recklessness
- Wins through Chris's *meltdown*, not a direct point race

**Relationship with Chris**

- They clash *constantly* — but they always produce great work together
- The chaos is in the *process*; the result still lands
- Hamlet's job isn't to ruin the food. It's to push Chris to the brink *while the food gets made*

## Herb — the Comedy Showcase

**Look** (canon)

- Burly, full dark beard, broad smile
- Black t-shirt, tan apron with strap over one shoulder
- Big waving hands, perma-grin
- The kindest man on Earth

**Voice / vibe**

- Eventually voiced via ElevenLabs (post-MVP). MVP: speech bubbles + foley
- Speech style: avuncular, non-sequitur-prone, never mean
- *Never* clocks the chaos. **Locked rule.**
- **Genuinely warm, well-intentioned, and amazing at service.** Not a buffoon — customers love him because he's *actually good* at the job. The dramatic irony is that the *people* love him while the *kitchen* burns; he simply doesn't see the kitchen.

**Player feel**

- Quip Wheel — 4 options per beat, at least one with zero mechanical effect
- Lean-back fun: pick the line that makes you laugh, not the optimal one
- Vibes meter softly amplifies Hospitality gains; never dictates choices

## Pam Stax — Rival Restaurateur (Stax Pamcakes)

**Look** (canon)

- Brunette, dark-fringed bob
- Teal short-sleeved dress with red collar trim, red apron tied at waist
- Carries a spatula
- Sly knowing smile — the face of someone who clocks everything and says nothing

**Identity: Pam owns Stax Pamcakes**

- Her own competing food truck. **Pancakes vs the diner's bacon.**
- *Friendly* rivalry — they'll work together when needed (canon panel: Pam flipping pancakes alongside Herb's bacon during a chaos beat) but their businesses compete
- The "Bacon vs Pancakes" rivalry is a recurring event/shift type — Sprint 5+ scope

**Subtext: she's into Herb**

- Pam has a crush on Herb.
- Herb is oblivious and **it is never stated** — pure subtext, communicated through animation only: lingering looks, the spatula slips a little when he waves, a half-step hesitation when he says her name. The audience sees it; nobody in the show acknowledges it.
- This is the *second* dramatic-irony layer on Herb: he misses the chaos AND he misses the feelings. Both are invisible to him in the exact same way.
- **Implementation rule**: this directs Pam's reactive-expression palette in Sprint 5+. **Never write a line of dialogue, internal monologue, popup, or in-game text that confirms it.** It only ever lives in animation. The moment it's stated, it stops being funny.

**Role in the game**

- **Sprint 4**: appears as NPC server moving on the dining floor (working a shift at the diner; presumably scoping the competition)
- **Sprint 5+**: anchors a new event shift type — *Bacon vs Pancakes Throwdown*. Pam's truck pulls up across the street; customers split between the two; Hospitality scoring becomes a head-to-head
- The second pair of eyes — where Herb misses everything, Pam catches it all
- Audience-surrogate inside the diner: she's the one who *gets it*

**Open questions**

- Does Stax Pamcakes appear visually on the dining-floor side of the dollhouse cutaway, parked across the street? (likely yes, post-MVP)
- Does she ever directly help Chris during a chase, or stay scrupulously neutral as a rival?
- Reactive expressions tied to live game state — how much UI real estate does she earn?

## Customers (archetypes)

Seeded in [`customers.json`](../packages/content/src/customers.json). Each has:

- patience seconds
- preferred orders
- tip baseline
- review weighting (VIPs disproportionately shape Yelp digest)

| Archetype | Patience | Tip | Notes |
|---|---|---|---|
| Regular | 90s | 4 | Forgiving; the bread of the floor |
| Picky | 70s | 3 | Specific orders ("well done", "no grease") |
| VIP Foodie | 60s | 12 | Short fuse, big tipper, weighted review |

## Background NPCs (not yet in canon)

Flag as we hit them:

- Delivery driver
- Health inspector
- Mascot in costume (?)
- Newspaper-reading regular
- Stax Pamcakes regulars (Pam's loyal pancake crowd) — Sprint 5+ when the rival shift lands

When canon adds them, mirror here.
