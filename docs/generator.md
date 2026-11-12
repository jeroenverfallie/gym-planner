# Workout generator (prototype)

Workflow: **Template** (structure) → **Generate** (random cycle, full manual override) → **Save to catalogue** → open in the planner.

## Pages

- `/templates`: create from one of 10 preset formats (filtered by workout type), then edit. A template has:
  - sections (the text fields of the type: Rig/Turf/Mat, Workout, Strength/Cardio),
  - a rotation per section: `style` (into / alternate / rotate / circuit), rounds, work, rest, move (seconds),
  - stations per section: kind (strength/cardio/any), floor space (none/S/M/L/lane), people, movements, equipment it has,
  - a layout snapshot ("Use the planner's layout" copies `gym-planner:floor:v2`), saved into generated workouts.
  - Total time is shown and warns outside 45–55 min (rule 12).
- `/create?template=<id>`: shuffle (seeded, keeps locked slots), lock/reroll per slot, pick from compatible exercises or type your own, edit amounts, tweak timings (working copy only), edit the generated text per field ("Reset to generated"), then save.

## Code

- `src/lib/exercises.ts`: exercise library, needs, spaces, `compatible()` (kind, equipment, floor space, focus, outside-run only for `hyrox-outside`).
- `src/lib/templates.ts`: template model, timing maths (`sectionSeconds`, `totalSeconds`), the 10 `FORMATS`, storage (`gym-planner:templates:v1`).
- `src/lib/generate.ts`: `generate`, `rerollOne`, `buildNotes` (text in house style, per-section timings, no total line).
- `src/components/TemplateParts.tsx`, `src/routes/templates.tsx`, `src/routes/create.tsx`.

## Generation rules

Exercises fit the slot's equipment and floor; focus is respected; no repeats unless the pool is too small; gym limits hold (from Settings: kettlebell and dumbbell totals, one machine per person, benches/boxes/mats/sleds shared by two, barbells ≤ 4 with 2 people per bay, plates only when no barbell). Exercises needing equipment the gym has none of are never offered. When random picks run out of equipment the generator retries with another seed before leaving a slot empty ("—"). Locked picks still count toward limits. Add exercises in the library using the gym's own wording.

## Known limits

- No per-movement "sequence" mode (each movement its own timed block).
- `into` needs exactly 2 stations, `alternate` exactly 1.
- Slots are defined by hand; the layout is only copied as a snapshot, not checked against the slots.

## INTO with 2 movements

An INTO station holds up to 2 movements. If either station has 2, each movement gets the full work time and the
station with 1 movement holds its exercise for double the work time (same rest), so both halves take the same time.
The section gets longer (e.g. 5 × 2:20 instead of 5 × 1:30); lower the rounds to stay near 50 minutes.
