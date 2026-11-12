# Joeys

Workout planner for a gym's group sessions. TanStack Start app with a floor-plan editor (equipment,
surfaces, dead space).

- Building or editing **workouts**: read [`docs/equipment-and-rules.md`](docs/equipment-and-rules.md) first. It lists
  every piece of equipment, how many exist, and the rules that stop a workout using too much of it.
- Real workout examples (format, style, floor-plan mapping): [`docs/example-workouts.md`](docs/example-workouts.md).
- **Workout generator** (prototype): `/templates` (structure, timings, stations) and `/create` (random cycle with locks,
  rerolls and manual override); see [`docs/generator.md`](docs/generator.md).
- **Settings** (`/settings`): what the gym owns (kettlebells/dumbbells by weight, mats, boxes, benches, sleds, cardio
  machines), `src/lib/inventory.ts`. Counts in `equipment.ts` are only the defaults; read counts through `ownedOf`.
- Equipment definitions live in `src/lib/equipment.ts`; the default floor and equipment layout in
  `src/lib/default-floor.ts`. Keep the doc and the code in step when either changes.
- Vocabulary: **Rig** = rack side (rows A–D), **Turf** = the black surface (E–H), **Mat** = non-rack side (I–L). Max 24 people. **In Lift & Rush (and any `INTO`), keep sections and partners together: lay out each zone as duos, strength station next to its cardio station** (rule 13). Always use the space optimally: spread stations evenly across each zone. **Always add timings** to every workout section (per zone/round, work and move, `INTO` split), but **no total line** in the text. **The whole workout is about 50 minutes, rest included, no warm-up, no cool-down**; see rule 12 in the rules doc.
- **Workout catalogue**: `/workouts` lists saved workouts (name, type, focus, zone notes, a mini floor plan and what's
  in use). The planner (`/`) has a save bar (Save / Update / Save as new / New); `/?workout=<id>` opens one.
  Model and browser storage in `src/lib/workouts.ts` (key `gym-planner:workouts:v1`); the mini plan is
  `src/components/MiniPlan.tsx`. A saved workout stores the whole floor plan snapshot, so it records what is in use.
- **Guided snapping** (floor editor, equipment tool): moving, placing or resizing an item snaps its edges and centres to the same type of
  equipment nearby and to equal spacing, with magenta/cyan guide lines (`snapRect`/`snapSize` in `src/lib/placement.ts`).
  Hold ⌥ to skip it. The RowErg, Runner, SkiErg, Echo Bike and BikeErg have a **direction** (an arrow on the item, in use only, also on
  the mini plan): **R** turns them a quarter clockwise through four facings (`facingOf`, `flip` in `src/lib/equipment.ts`). Dragging stored equipment more than a metre away from the side walls puts it into use (back to the wall: stays stored). Plyo boxes still stack onto each other first. **D** duplicates the selected workout space, bench or mat
  (0.5 m down and right, keeps cascading). On always-on-floor equipment it takes a stored unit of the same type and puts it
  into use next to the selected one.
- **Planner UI**: equipment tool by default; drawing the floor (dead space, turf, the 1 m / 0.5 m precision) is rare and lives in
  _More > Edit floor_. Built to work on phones and tablets: big tap targets, the board only captures touch while editing, and the
  actions for the selected item float at the bottom of the screen on touch.
