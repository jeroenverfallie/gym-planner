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
- **Fixed dead space** (unusable): I1–L2 and L8–L16. **Nothing may stand on it: no equipment, no stored equipment, no
  workout spaces.** The floor editor flags anything on dead space as a conflict.
- **Rack** (BLK BOX, fixed, 12 × 0.9 m, A3–A14), left to right:
  `P B P U P B P U P B P U P B P` where **P** = pillar with a pull station (8), **B** = barbell/squat bay (4,
  1.2 m each), **U** = pull-up bay (3). Pillars are shared between neighbouring bays.
- **Wall ball targets**: 4, on the right wall, centred on B16, D16, I16, K16. They hang in the air, so the floor
  below them stays usable when they aren't in use.
- Unused equipment is stored along the side walls (left wall and right wall columns). See `src/lib/default-floor.ts`.

## Equipment inventory

**Permanent equipment.** Everything the gym owns (bikes, rowers, SkiErgs, runners, sleds, plyo boxes, and the rack
and wall ball targets) is **always on the floor plan** and can't be deleted: it has to be somewhere. When a
workout doesn't use it, it stays on the plan **stored** (the dulled items along the walls); a workout marks what it
uses as in use. Only **benches, soft mats and workout spaces** are added and removed per workout. In the floor
editor the permanent items have no "place" buttons and can't be removed; if a saved layout is missing one, it is
put back automatically.

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

### Workout space (a resizable marker, not equipment)

A **workout space** marks floor that must stay clear for a movement. It is placed in the floor editor like
equipment, but it is only a marker: it doesn't count toward equipment totals, and nothing else may stand in it
(overlapping equipment is a conflict). Plan one per person (or per lane) that needs it.

It is **resizable**: drag its right, bottom or corner handle, type an exact width and height (metres), or pick a
preset; **R** swaps width and height. New ones start at 1.5 × 2.5 m. Typical sizes (width × depth):

| Use | Size |
|---|---|
| **S**: stationary standing work: squats, kettlebell swings, goblet squats, thrusters, presses, curls, step-ups | 1.0 × 1.0 m |
| **M**: floor work and burpees: burpees, push-ups, planks, sit-ups, mountain climbers, leg curls | 1.2 × 2.0 m |
| **L**: movements that travel a short way: broad jumps, lunges, bear crawls | 1.5 × 2.5 m |
| **Lane**: carries, long jumps, walking lunges: as long as the distance (or half of it for out-and-back), about 0.75 m wide per person | e.g. 6 × 0.75 m |

Use **lanes** for any distance movement instead of rows of small spaces, and the smallest size the movement allows,
so the zone can hold more people or spread out more. All sizes are estimates for an average person.

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

**Text fields in the planner (what a workout's text is organised by):** Lift and Lift & Rush have one field per
zone (**Rig, Turf, Mat**); **Hyrox** (and Hyrox + outside run) has **one** field covering the whole plan; **50-50**
has two, **Strength** and **Cardio**.

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
10. **Partners side by side.** Every zone is split in two: the people work as **partners next to each other**,
    one at each station, then swap. Lay stations out alternating, e.g. on the Mat side
    `Soft mat – Workout space – Soft mat – Workout space …`, on the turf `Bench – Space – Bench – Space …`, and on the rig `Barbell bay – Space – Barbell bay – Space …`
    (the partner of each lifter has a space beside the bay, e.g. in front of the pull-up bays between them).
11. **Always use the space optimally.** Spread stations and workout spaces **evenly across the full usable width
    of their zone** with equal gaps, as far apart as the zone allows, instead of bunching them. Gaps must never be
    smaller than the safe areas need. Use the zone's depth too (centre rows in it). Keep clear of stored equipment
    and the dead space.
12. **Always add timings per section, and keep the whole workout to about 50 minutes.** Every section of a workout (each
    zone, station or half) states its own time, and the times add up: the **section time**, the **work and
    move/rest** times inside it, and for `INTO` the split. **Don't write a total in the workout text; the time per
    section is enough.** But size the sections so the whole workout is **around 50:00, with all rest and moves
    included. There is no warm-up and no cool-down**: the 50 minutes are all workout, so don't add either. A section
    without a time isn't finished. Put the times in the workout text itself (first line of a field), not only in
    your reply. Usual shapes (use them unless told otherwise):
    - **Always state the rest explicitly.** Each interval is written **work + rest**, e.g. `5 x 1:30 · 0:50 WORK / 0:40
      REST`, and the move between zones/stations is written **MOVE + REST** (`1:30 MOVE + REST`). Rest guide: strength
      sets (6–12 reps) about **0:40–0:45 rest after about 0:50 work**; cardio intervals about **0:20–0:30 rest**;
      partners alternating get an equal rest (`1:30 WORK / 1:30 REST EACH`).
    - **Time and volume must agree.** Never give a station a long time block with a task that takes a fraction of it
      (a 7:30 block for one 250 m row makes no sense). Write each station as **intervals (N × M:SS)** where the work
      takes about 60–80% of the interval and the rest is recovery, e.g. **5 × 1:30** for 250 m on the row or SkiErg
      (about 1:05–1:20), 15 cal on a bike (about 1:00), 8–12 pull-ups, presses or squats. Rough speeds for an average
      person: row or SkiErg 500 m about 2:00–2:15; 250 m about 1:05–1:20; wall balls about 25 per 1:10; burpee broad
      jumps about 12 m per minute; 12 m sled push plus pull about 1:15.
    - 3-zone lifts (Lift, Lift & Rush): **3 zones × 16:30 (= 49:30)**. Each field starts `16:30 · …`. A zone with
      `INTO` is **7:30 + 7:30 + 1:30 move**; a zone without `INTO` (partners alternating) is **5 × 3:00 + 1:30 move**.
    - Hyrox: **6 stations × (7:00 work + 1:00 move) (= 48:00)**, 6 rounds, rotate clockwise. State the per-station
      time and the rounds, not the total. Size the volume at each station to fill the 7:00 for the pair that sets
      the pace.
    - 50-50: **two halves of 25:00** (= 50:00) that swap at 25:00, with the rest and moves inside each half. Each field
      states its half's time.
13. **Lift & Rush: keep sections and partners together, in duos.** The two stations of an `INTO` (strength and
    cardio) are laid out **next to each other**, so the two partners of a duo work side by side and swap places. Don't
    park all the cardio machines in one place and all the strength stations in another. Per zone, repeat the duo
    `strength | cardio` across the zone, spread evenly (e.g. `Bench | Rower  Bench | Rower …` on the turf,
    `Press space | Bike  Press space | Bike …` on the Mat side, pull-up bay with the SkiErgs right below it on the
    rig). This applies to every `INTO` workout, and most of all to Lift & Rush.
14. **`INTO` means two stations, half and half.** In a zone with `INTO`, half the people (e.g. 4 of 8) do
    the first station while the other half do the second, then they switch. Count equipment per station, not per
    zone: the zone needs only half its people's worth at each. See [example-workouts.md](example-workouts.md).

## Still unconfirmed

- Soft mat size (estimated 1.8 × 0.6 m) and bench/soft mat safe areas (estimated).
- Wall ball target size and the wall ball throwing space (estimated).
- Where each workout type puts its stations is up to the planner (rig/turf/mat), within the rules above.
