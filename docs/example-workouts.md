# Example workouts

Real examples from the gym's slides, with how they map to the floor plan. Use them to match the **format and
style** when generating workouts. See [equipment-and-rules.md](equipment-and-rules.md) for the limits.

## Format

- Header: the workout type and focus (e.g. **LIFT – LOWER**).
- In the app, each zone's workout text is typed in the notes box beside that zone (Rig, Turf, Mat), next to the
  floor plan.
- One block per zone: **RIG**, **TURF**, **MAT**, each with its movements, one per line.
- Terse, upper-case movement names. Reps only where they matter ("8-12 barbell squat"), no loads.
- **Timings are always included** (total, per zone, work and move; see rule 12 in the rules doc). They sit in the first
  lines of a field, e.g. `16:30 · 7:30 + 7:30 · 1:30 SWAP + REST`. No total line: the time per section is enough.
- `INTO` separates **two stations** in a zone. Half the zone (e.g. **4 of 8 people**) does the first station while
  the other half does the second; then they **switch**. A station can hold more than one movement, one per line.
  So a zone with an `INTO` needs equipment for only **half** its people at each station.
- `L|R` means do the movement on each side.
- 24 people split evenly across the zones (8 each in a 3-zone workout).
- Every zone is split in two: people work as **partners next to each other**, one at each station, then swap.
  Lay the stations out alternating (`Soft mat – Space – Soft mat – Space …`). A **workout space** (1.5 × 2.5 m,
  rotatable) marks the floor a movement like jumps or lunges needs.

## Lift – Lower

```
RIG   16:30 · 5 x 3:00 + 1:30 SWAP + REST
      5 x 3:00 · PARTNERS ALTERNATE
      1:30 WORK / 1:30 REST EACH
      8-12 BARBELL SQUAT
      10 DROP SQUATS
TURF  16:30 · 7:30 + 7:30 · 1:30 SWAP + REST
      5 x 1:30 · 0:50 WORK / 0:40 REST
      BENCH HIP THRUST L|R
      INTO
      5 x 1:30 · 0:50 WORK / 0:40 REST
      REVERSE LUNGE TO HIGH KNEE L|R
MAT   16:30 · 7:30 + 7:30 · 1:30 SWAP + REST
      5 x 1:30 · 0:50 WORK / 0:40 REST
      BROAD JUMPS
      FRONT LUNGES
      INTO
      5 x 1:30 · 0:50 WORK / 0:40 REST
      KB SUMO SQUATS
      LEG CURLS
```

(The slide itself has no timings; they were added: 3 zones × 16:30 (about 50 minutes, rest and moves included, no warm-up or cool-down).)

Equipment and floor plan (tested in the editor, 24 people, no conflicts):

| Zone | Stations | People | Equipment | Floor plan |
|---|---|---|---|---|
| Rig | Barbell squat, then drop squats (no `INTO`: everyone does both) | 8 | 4 barbell bays + 4 barbells, 2 people per bay (partners alternate); a workout space each for the drop squats | Barbells 4/4 on; the flanking pull stations stay off (barbell or pull, never both). `Bay – Space – Bay – Space – Bay – Space – Bay – Space`: three spaces sit in front of the pull-up bays between the barbell bays, the fourth to the right of the last bay (clear of the stored cardio kit). |
| Turf | Station 1: bench hip thrust L\|R. `INTO` station 2: reverse lunge to high knee L\|R | 4 + 4, partners side by side, then swap | 4 benches; the lunges need a workout space each | `Bench – Space – Bench – Space – Bench – Space – Bench – Space` spread evenly across the turf's whole usable width (about 0.86 m between items), benches turned 90° (more natural on the turf). |
| Mat | Station 1: broad jumps, front lunges. `INTO` station 2: KB sumo squats, leg curls | 4 + 4, partners side by side, then swap | 4 kettlebells, 4 soft mats (leg curls), a workout space each for the jumps/lunges | `Soft mat – Space – Soft mat – Space – Soft mat – Space – Soft mat – Space` spread evenly across the Mat side (about 0.56 m between items), soft mats turned to run along the jump direction. |

Rules check: no cardio machines (Lift); barbells in use so no free plates; kettlebell block = 4 people (limit 8);
total = 24 (limit 24). Everything not listed stays stored.

Interpretation notes (not confirmed): the Mat block is read as two stations of two movements each, split at `INTO`
(like the turf). "10 drop squats" was read as a bodyweight/no-extra-equipment movement at the rig bay, and "leg
curls" as a floor movement on the soft mat.

## Hyrox – Partner Hyrox (built and tested in the editor)

Built from the rules, not from a slide. **6 teams of 4 (2 partner pairs) = 24 people, 6 stations, 7:00 + 1:00 move and rest,
rotate clockwise, 6 rounds (about 48 minutes, rest and moves included, no warm-up or cool-down).** One text field for the whole workout (Hyrox type). No running station: this in-room
version swaps the HYROX runs for short moves between stations (running outside is the other Hyrox type).

```
1 SKIERG                3 x 2:20 · 2:00 WORK / 0:20 REST · 500 M
2 FARMERS CARRY         3 x 2:20 · 1:30 WORK / 0:50 REST · 2 x 12 M CARRY (2 KB, 6 M LANE OUT AND BACK) + 10 LUNGES
3 WALL BALLS            3 x 2:20 · 1:45 WORK / 0:35 REST · 35 REPS
4 BURPEE BROAD JUMPS    4 x 1:45 · 1:00 WORK / 0:45 REST · 12 M (6 M LANE OUT AND BACK)
5 ROW                   3 x 2:20 · 2:00 WORK / 0:20 REST · 500 M
6 SLED                  3 x 2:20 · 1:30 WORK / 0:50 REST · 2 x 12 M PUSH + 12 M PULL (3 sleds, 4 people: one rests, rotate each length)
```

| # | Station | Equipment (limit) | Floor plan |
|---|---|---|---|
| 1 | SkiErg | 4 SkiErgs (4) | Rig zone, left: 4 turned SkiErgs spread evenly, below the rack (rack not used). |
| 2 | Farmers carry + lunges | 2 kettlebells each (KB for 8 people) | Rig zone, right: **4 lanes** (workout spaces 6 × 0.75 m, out and back = 12 m) beside the SkiErgs. |
| 3 | Wall balls | 4 targets (4) | Wall balls switched **in use**: B16, D16 (rig) and I16, K16 (mat), throwing space in front. |
| 4 | Burpee broad jumps | none | Mat zone, right of the rowers: **4 lanes** (workout spaces 6 × 0.75 m, out and back = 12 m), partners side by side. |
| 5 | Row | 4 RowErgs (4) | Mat zone, left: 4 RowErgs stacked with the 0.3 m safe-area gaps. |
| 6 | Sled | 3 sleds (3) | Turf: 3 lanes across the turf, sleds at the left wall pushing right (11.5 m runway). |

Rules check: 24 people (limit 24); SkiErg 4/4, Row 4/4, wall balls 4/4, sleds 3/3, kettlebells 4 people (limit 8); no
barbells, no pull stations (rig off); stored: Echo Bikes, BikeErgs, plyo boxes, runners. 0 conflicts, 0 safe-area warnings.

What testing it taught us:
- **Stored equipment is an obstacle.** The default storage on the right wall sits inside the wall ball throwing areas
  (runners, upright RowErgs, sleds, SkiErgs all overlap B16/D16/I16/K16). For a wall ball workout, the in-use machines
  leave the wall anyway, but the **stored runners** have to be moved (here to the right wall between the two throwing areas, x 14.2–16 m, y 4.7–6.3 m). **Not** to the dead corner I1–L2: dead space can't hold equipment, stored or not.
- **Sled lanes need a clear runway.** Sleds in use claim an 11.5 m lane, and a stored BikeErg at the left wall clipped
  the first lane until the sleds started 0.3 m further right (x = 1.3 m).
- **Resizable spaces make real lanes.** The first version used rows of fixed 1.5 × 2.5 m spaces for the 12 m movements and
  struggled: a 12 m effort doesn't fit a box. With the resizable workout space, farmers carry and burpee jumps got
  4 lanes of 6 × 0.75 m (out and back).
- **Time and volume must agree.** An earlier version of the Lift & Rush gave each station a 7:30 block for a single
  250 m row (about a minute of work). Stations are now written as intervals (5 × 1:30, 3 × 2:20) so the work fills the
  time; see rule 12.
- **A lane per sled fills the turf** (3 × 1.3 m of the 4 m): nothing else goes on the turf while sleds are in use.
- **4 people on 3 sleds** needs a rest rotation; write that into the workout text.

## Lift & Rush – Upper (built and tested in the editor)

Built from the rules. **24 people, three zones of 8 with `INTO`: 4 do the strength station while 4 do the cardio
station, then they switch, so everyone spends half their time on cardio (the Lift & Rush rule).** Upper-body focus.

```
RIG   16:30 · 7:30 + 7:30 · 1:30 SWAP + REST
      5 x 1:30 · 0:50 WORK / 0:40 REST
      6-10 PULL-UPS (OR TRX ROWS)
      INTO
      5 x 1:30 · 1:10 WORK / 0:20 REST
      SKIERG 250 M
TURF  16:30 · 7:30 + 7:30 · 1:30 SWAP + REST
      5 x 1:30 · 0:50 WORK / 0:40 REST
      DB BENCH PRESS 8-12
      INTO
      5 x 1:30 · 1:10 WORK / 0:20 REST
      ROW 250 M
MAT   16:30 · 7:30 + 7:30 · 1:30 SWAP + REST
      5 x 1:30 · 0:50 WORK / 0:40 REST
      DB SHOULDER PRESS 8-12
      INTO
      5 x 1:30 · 1:00 WORK / 0:30 REST
      ECHO BIKE / BIKEERG 15 CAL
```

| Zone | Strength (4 people) | Cardio (4 people) | Floor plan |
|---|---|---|---|
| Rig | 2 pull-up bays, 2 people each (partners) | 4 SkiErgs | Pull-up bays 1 and 3 switched on, each with its two SkiErgs directly below it: **duos** (one at the bay, the partner at the SkiErg below). |
| Turf | 4 benches (turned 90°), dumbbells | 4 RowErgs | **4 duos `bench \| rower`** spread evenly across the turf, the rowers turned to run across it. |
| Mat | 4 small workout spaces (1 × 1 m) for dumbbell presses | 2 Echo Bikes + 2 BikeErgs | **4 duos `press space \| bike`** spread evenly across the Mat side (two Echo duos, two BikeErg duos). |

Rules check: cardio machines in use 4 + 4 + 2 + 2 = 12 of 24 people = **50% cardio**; pull-up bays 4 of 6 places;
benches 4 of 8; dumbbells 8 people (limit 16); no barbells (so plates aren't an issue), no kettlebells; nothing on dead
space; 0 conflicts, 0 safe-area warnings. Stored: runners, sleds, plyo boxes, the other two BikeErgs.

Notes from testing:
- **Keep sections and partners together.** The first version put all rowers in one stack and all benches elsewhere,
  and all bikes apart from the press spaces. In a Lift & Rush the strength and cardio stations of a duo must sit
  side by side, so each zone is a row of duos (rule 13).
- Starting from the **default layout** (Reset to default) is the clean way to begin a workout: everything is stored
  and in known positions.
- The stored BikeErgs at the left wall reach x = 1.22 m, so anything in use with a safe area starting left of about
  1.3 m clips them (the first rower did, until the RowErgs moved to x = 1.45 m).
- Barbell or pull stations never ran here; only pull-up bays (which are independent of both) were used on the rig.

## 50-50 – Legs (the gym's own exercises, laid out in the editor)

**12 people on strength (rig side) and 12 on cardio, then they swap.** The strength half is the gym's own circuit; the
cardio half is the gym's own too (laid out by the gym on the Turf and Mat side, which is interchangeable). Two text
fields: Strength and Cardio.

```
STRENGTH  2x
          3:00 weighted crunches
          3:00 kb swing
          3:00 box step up
          3:00 man maker
CARDIO    6:00 row
          6:00 ski
          INTO
          3:00 echo
          3:00 bike
          3:00 run
          3:00 burpee
```

How the **strength** circuit maps to the floor plan: 12 people, 4 stations, so **3 spots per station**, rotating every
3:00 (one round = 12:00, `2x` = 24:00 of work). The stations are a loop in the rig zone (the rack is not used):

| Station (3 people) | Equipment | Floor plan (rig zone, below the rack) |
|---|---|---|
| Weighted crunches | 3 workout spaces 2.0 × 1.2 m (lying along them), plates or dumbbells | Top left, three in a row. |
| KB swing | 3 workout spaces 1 × 1 m, kettlebells (3 people, limit 8) | Top right, three in a row. |
| Box step-up | 3 plyo boxes taken out of storage (the others stay stacked) | Bottom right: boxes 1.35 m apart so their safe areas just meet. |
| Man maker | 3 workout spaces 2.0 × 1.2 m, dumbbells | Bottom left, below the crunches. |

Checks: strength half 12 people on 4 stations of 3; kettlebells 3 people (limit 8), dumbbells and plates well within their
limits, plyo boxes 3 of 8; the loop runs crunches → KB swing → box step-up → man maker; nothing on dead space; 0 conflicts,
0 safe-area warnings with the gym's cardio layout.

Notes from testing:
- **Use the gym's own exercises.** The first version of this workout (barbell back squats plus Bulgarian split squats on
  benches) was my invention; the gym replaced it. When the gym provides exercises, use them as written and lay the
  floor plan out for them.
- The gym's cardio text has no rest times or intervals yet. Their text is kept as written.
- Workout spaces don't carry a name, so the plan can't say which station each space is; the loop order and the table
  above are the key.
