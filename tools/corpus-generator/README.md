# Quip Corpus Generator

Offline tool. Expands the hand-curated seed corpus in `@wnb/content/quips.json` with AI-generated variations.

**Why offline?** Comedy needs to be deterministic and fast. We never call Claude at runtime — that'd add latency and unpredictability to the Quip Wheel, and the wheel needs to land on the joke instantly.

**Why human-in-the-loop?** AI is for *expansion*, not curation. Every generated line gets a human review before it ships. The wheel rewards being a person, not a player; the curation pipeline reflects that.

## Run

```bash
ANTHROPIC_API_KEY=sk-ant-... pnpm --filter @wnb/corpus-generator generate
```

## Status

Sprint 4 implementation. Stub for now — see `src/index.ts` for the planned flow.
