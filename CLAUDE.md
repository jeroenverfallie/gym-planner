# Joeys

Workout planner for a gym's group sessions. TanStack Start app with a floor-plan editor (equipment,
surfaces, dead space).

- Building or editing **workouts**: read [`docs/equipment-and-rules.md`](docs/equipment-and-rules.md) first. It lists
  every piece of equipment, how many exist, and the rules that stop a workout using too much of it.
- Equipment definitions live in `src/lib/equipment.ts`; the default floor and equipment layout in
  `src/lib/default-floor.ts`. Keep the doc and the code in step when either changes.
- Vocabulary: **Rig** = rack side (rows A–D), **Turf** = the black surface (E–H), **Mat** = non-rack side (I–L). Max 24 people.
