/**
 * Offline quip-corpus expansion using the Anthropic API.
 *
 * Reads the seed corpus in @wnb/content/quips.json, asks Claude to generate
 * variations per context (greet_customer, witness_chaos, exit_kitchen, etc.),
 * then writes the expanded corpus back to disk.
 *
 * IMPORTANT: this is an OFFLINE tool. It runs at authoring time, never at
 * runtime. The game ships with a deterministic, hand-curated JSON corpus —
 * comedy needs to be deterministic and fast, and Claude shouldn't be in the
 * Quip Wheel hot path.
 *
 * Run:  pnpm --filter @wnb/corpus-generator generate
 * Env:  ANTHROPIC_API_KEY required
 *
 * Sprint 4 implementation. This stub just describes the intended flow.
 */

const PLAN = `
[corpus-generator] Sprint 4 stub.

Intended flow:
  1. Read packages/content/src/quips.json.
  2. For each context, ask Claude (Opus 4.7) to generate 8-12 new options
     matching the existing tone palette: polite / non_sequitur / wildcard / silent_beat.
  3. Validate constraints:
       - At least one silent_beat (text "...") per context.
       - No single option is mechanically dominant (comedy > optimization rule).
       - Tone diversity is preserved.
  4. Write back to quips.json with bumped version + provenance metadata.
  5. Open a PR. Humans review every line. AI generates, humans curate.
`;

console.log(PLAN);
process.exit(0);
