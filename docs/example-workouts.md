# Example workouts

Real examples from the gym's slides, with how they map to the floor plan. Use them to match the **format and
style** when generating workouts. See [equipment-and-rules.md](equipment-and-rules.md) for the limits.

## Format

- Header: the workout type and focus (e.g. **LIFT – LOWER**).
- In the app, each zone's workout text is typed in the notes box beside that zone (Rig, Turf, Mat), next to the
  floor plan.
- One block per zone: **RIG**, **TURF**, **MAT**, each with its movements, one per line.
- Terse, upper-case movement names. Reps only where they matter ("8-12 barbell squat"), no loads.
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
RIG   8-12 BARBELL SQUAT
      10 DROP SQUATS
TURF  BENCH HIP THRUST L|R
      INTO
      REVERSE LUNGE TO HIGH KNEE L|R
MAT   BROAD JUMPS
      FRONT LUNGES
      INTO
      KB SUMO SQUATS
      LEG CURLS
```

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
