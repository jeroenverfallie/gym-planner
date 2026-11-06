# Joeys

Workout planner for a gym's group sessions. TanStack Start app with a floor-plan editor (equipment,
surfaces, dead space).

- Building or editing **workouts**: read [`docs/equipment-and-rules.md`](docs/equipment-and-rules.md) first. It lists
  every piece of equipment, how many exist, and the rules that stop a workout using too much of it.
- Real workout examples (format, style, floor-plan mapping): [`docs/example-workouts.md`](docs/example-workouts.md).
- Equipment definitions live in `src/lib/equipment.ts`; the default floor and equipment layout in
  `src/lib/default-floor.ts`. Keep the doc and the code in step when either changes.
- Vocabulary: **Rig** = rack side (rows A–D), **Turf** = the black surface (E–H), **Mat** = non-rack side (I–L). Max 24 people. Always use the space optimally: spread stations evenly across each zone.
- **Workout catalogue**: `/workouts` lists saved workouts (name, type, focus, zone notes, a mini floor plan and what's
  in use). The planner (`/`) has a save bar (Save / Update / Save as new / New); `/?workout=<id>` opens one.
  Model and browser storage in `src/lib/workouts.ts` (key `joeys:workouts:v1`); the mini plan is
  `src/components/MiniPlan.tsx`. A saved workout stores the whole floor plan snapshot, so it records what is in use.
