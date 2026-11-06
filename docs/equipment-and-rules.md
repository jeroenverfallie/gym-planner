# Gym equipment and workout rules

Read this **before generating or editing any workout**. The gym runs **group sessions** in one
16 × 12 m room, **max 24 people**. A workout must never use more equipment than exists, and must say which
equipment it uses so everything else can be put away (stored).

Source of truth for placeable equipment counts and sizes: [`src/lib/equipment.ts`](../src/lib/equipment.ts).
If a count here and the code disagree, fix the one that's wrong and tell the user.

## The room

- 16 × 12 m. Columns 1–16 left to right, rows A–L top to bottom (1 m each).
- **Max 24 people in the room at once.**
- **Zones** (names the user uses; always use these words):
  - **Rig**: the rack side, rows A–D (rack along the top wall).
  - **Turf**: the black surface, rows E–H, full width (the old "mat"; there is no "sled mat" any more).
  - **Mat**: the non-rack side, rows I–L (standard tiles). Not to be confused with the soft exercise mats below.
- **Turf** surface: 4 × 16 m. Surface for sled push/pull. Wide enough for 3 HYROX sleds with padding.
  Everything else is standard gym tiles.
- **Fixed dead space** (unusable): I1–L2 and L8–L16.
- **Rack** (BLK BOX, fixed, 12 × 0.9 m, A3–A14), left to right:
  `P B P U P B P U P B P U P B P` where **P** = pillar with a pull station (8), **B** = barbell/squat bay (4,
  1.2 m each), **U** = pull-up bay (3). Pillars are shared between neighbouring bays.
- **Wall ball targets**: 4, on the right wall, centred on B16, D16, I16, K16. They hang in the air, so the floor
  below them stays usable when they aren't in use.
- Unused equipment is stored along the side walls (left wall and right wall columns). See `src/lib/default-floor.ts`.

## Equipment inventory

"Max at once" is the most people who can use that item at the same time. Never plan more than this per workout block.

### Cardio machines (one person each)

| Equipment | Qty | Max at once |
|---|---|---|
| Rogue Echo Bike | 2 | 2 |
| Concept2 RowErg | 4 | 4 |
| Concept2 SkiErg | 4 | 4 |
| Concept2 BikeErg | 4 | 4 |
| Rogue curved runner (TrueForm) | 2 | 2 |

### Strength / conditioning

| Equipment | Qty | Max at once | Notes |
|---|---|---|---|
| HYROX sled | 3 | 3 | On the turf, one per lane. Push and pull. |
| Stride soft 3-in-1 plyo box | 8 | 8 | 50 × 60 × 75 cm. Stored stacked up to 3 high. |
| Rack: barbell/squat bay | 4 | 4 | Needs a barbell (below). Either/or with the pull stations beside it. |
| Rack: pull station | 8 | 8 | Cable pulls built into the pillars. Either/or with the barbell bay beside it. |
| Rack: pull-up bay | 3 | **6** | **2 people per bay.** TRX can hang from the bays; still 2 people per bay. |
| Wall ball | enough for the 4 targets | 4 | One target per person. |
| Barbell | 4 | 4 | |
| Bench | 8 | 8 | 1.2 × 0.4 m. |
| Soft mat | 8 | 8 | Floor work. Size estimated at 1.8 × 0.6 m. |

### Free weights (no fixed count: sized by people)

| Equipment | Enough for | Notes |
|---|---|---|
| Dumbbells | 16 people at a time | |
| Kettlebells | 8 people at a time | |
| Plates | 8 people at a time | **Only when the barbells are not in use** (see rules). |

**Loads:** exact weights don't matter for these group sessions. Moving well matters more than the specific
weight. Don't prescribe kilos; say things like "moderate", "challenging but moveable", or "pick a weight you can
keep moving with". Dumbbells, kettlebells and barbells come in various weights, so people choose their own.

## Rig rule: barbell or pull, never both side by side

A barbell bay and the pull stations (pillars) on either side of it are **either/or**: use the barbell bay or the
pull stations next to it, not both at once. Pull-up bays are independent of both.

```
P  B1  P  U1  P  B2  P  U2  P  B3  P  U3  P  B4  P
```

(P = pillar with a pull station, B = barbell bay, U = pull-up bay.)

Every pillar sits next to a barbell bay, so in practice the rig runs **either up to 4 barbell bays, or up to
8 pull stations, or a mix** where each barbell bay in use switches off its two flanking pillars (and the other
way round). Pull-up bays (6 people) are always available on top. The floor editor enforces this when you switch
stations on.

## Safe areas (space a unit needs while in use)

Estimates for an average person. Safe areas **may overlap each other** (shared aisles); what may **not**
happen is another unit (or its footprint) standing inside one. Stored equipment is not in use, so it claims no
safe area. The floor editor draws these and flags anything inside one in amber. Source: `safe` in
`src/lib/equipment.ts` (and the rack/wall-ball rectangles beneath it).

| Unit | Beyond the short ends | Beyond the long sides | Notes |
|---|---|---|---|
| Concept2 RowErg | 0.15 m | 0.30 m | Concept2's own use space is 2.74 × 1.22 m. |
| Concept2 SkiErg | 0.30 m | 0.40 m | Arm swing. |
| Concept2 BikeErg | 0.30 m | 0.40 m | Mount/dismount. |
| Rogue Echo Bike | 0.30 m | 0.40 m | |
| Rogue curved runner | 0.60 m | 0.30 m | Longer at the rear to step off. |
| HYROX sled | 0 | 0.35 m | Plus a runway of about 11.5 m beyond one end (toward the roomier side): the sled lane. |
| Plyo box | 0.60 m | 0.60 m | Approach and landing. |
| Bench | 0.40 m | 0.60 m | Room for dumbbell work either side. |
| Soft mat | 0.30 m | 0.30 m | Floor work. |
| Rack: barbell bay | | | 2.0 m deep in front of the bay, as wide as the bay. |
| Rack: pull station | | | 1.0 m wide × 1.4 m deep in front of the pillar. |
| Rack: pull-up bay | | | 1.0 m deep in front of the bay. |
| Wall ball target | | | 1.8 m wide × 2.5 m out from the wall. |

Each rack station (every barbell bay, pull station and pull-up bay) is marked **in use** on its own in the floor
editor, by clicking it on the plan or with the Barbells / Pulls / Pull-ups buttons. The wall ball targets are
switched together ("Wall balls in use"). Only stations in use claim their safe area. Always aim for the best use
of space and flow: put stations people move between close together, keep walkways clear, and let neighbouring safe
areas overlap where they can.

## Workout types

All workouts: **max 24 people**, within the equipment limits above. A workout names the equipment it uses; the
rest is stored.

1. **Lift** (lower- or upper-focused): **no cardio machines** (bikes, RowErg, SkiErg, runner). Strength only.
   Sleds, plyo boxes and wall balls may be used or not; the user isn't strict about this.
2. **Lift & Rush** (lower- or upper-focused): **all equipment** may be used; **cardio is about 50%** of the workout.
3. **Hyrox**: HYROX or HYROX-style movements, very cardio-intense. (Typical stations: SkiErg, sled push, sled pull,
   rowing, wall balls, running.)
4. **Hyrox with running outside**: same, but running is a station and may take extra space outside the room.
5. **50-50**: **12 people on cardio equipment (Mat side)** and **12 people lifting (Rig side)**. The **Turf is
   interchangeable**: either half can use it (e.g. sleds). The two halves rotate or work independently.

## Rules for building workouts

0. **Max 24 people in the room**, in every workout type.
1. **Capacity is a hard limit.** At any moment, people on an item ≤ its "Max at once". If a block has more
   people than stations, rotate (split the group) instead of exceeding it.
2. **Rig: barbell or pull, not both beside each other** (see the rig rule). Pull-up bays: 2 people each.
3. **Barbells vs plates.** The plates live on the barbells. If a workout uses barbells (rack bays, barbell
   work), there are **no free plates** for plate work. Free plates (e.g. plate-to-overhead, for up to
   8 people) are only available when the barbells are unused. Don't schedule both in the same workout
   unless the user explicitly says it works.
4. **Dumbbells (16) and kettlebells (8) are separate pools** and can be used together in one workout, but
   count people: dumbbell blocks ≤ 16 people, kettlebell blocks ≤ 8 people.
5. **Wall balls**: max 4 people at once, one per target.
6. **Sleds**: max 3 at once, on the turf. Don't plan anything else on the turf that blocks the sled lanes
   while sleds are in use.
7. **Name the equipment each workout uses.** Everything not named is stored away; the floor plan shows
   it stored. Don't rely on equipment that isn't listed.
8. **Don't invent equipment.** If a workout needs something not on this list, ask the user first.
9. **Don't prescribe exact loads.** Group sessions: the movement matters, not the weight.

## Still unconfirmed

- Soft mat size (estimated 1.8 × 0.6 m) and bench/soft mat safe areas (estimated).
- Wall ball target size and the wall ball throwing space (estimated).
- Where each workout type puts its stations is up to the planner (rig/turf/mat), within the rules above.
