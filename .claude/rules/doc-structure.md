# Docs Structure — Where Incidental Notes Go

> **Scope**: `docs/*.md` design and architecture docs. Not `.claude/rules/*.md` — those are already single-topic and have no narrative arc to protect.

## Rule

Incidental implementation-detail notes — dependency overrides and pins, workarounds, environment gotchas, "drop this once X ships" caveats — go in a single top-level `## Implementation Notes` section, placed at the end of the narrative flow and outside every tier/layer/phase section (a trailing roadmap section may follow it — see `docs/link-metadata-extraction.md`). Never nest one as a `###`/`####` sub-heading inside a tier, layer, phase, step, or roadmap section.

## Why

These docs carry an argument from problem to design, and a reader follows it top to bottom. A `#### The re2 override` wedged between Tier 1 and Tier 2 interrupts that argument with trivia. Getting it wrong also costs a commit to undo: #108 (`3c36905`) landed the `re2` note under Tier 1, and `9980e7f` existed for no other purpose than moving it back out.

## Creating the Section

If `## Implementation Notes` is absent, add it as a new `##` section rather than nesting the note under an existing one. Do not pre-create it empty — it appears on first use. Use `###` sub-headings freely _inside_ it, one per note; the nesting ban is about narrative sections, not about structure within the catch-all.

Every file in `docs/` also carries a one-line HTML-comment marker immediately under the H1, pointing here. New docs get it too — copy the line verbatim from any existing `docs/*.md`.

## Example

```md
<!-- WRONG — trivia interrupts the two-tier narrative it sits inside -->

## Two-Tier Extraction Strategy

### Tier 1 — Synchronous HTML Meta Parsing (~200ms)

#### The re2 override

`@metascraper/helpers` declares a hard dependency on `re2` …

### Tier 2 — Async Full-Content Extraction (~3-5s per link)
```

```md
<!-- CORRECT — the narrative stays intact, the note has its own home -->

## Implementation Notes

### The `re2` override

`@metascraper/helpers` declares a hard dependency on `re2` …
```

## What Does Not Belong There

Material that _is_ the design argument stays in its own narrative section: rejected alternatives, schema analysis, the tier or layer design itself, roadmap phases. `## Implementation Notes` is the home for notes that would otherwise have none — not a bucket for anything short.
