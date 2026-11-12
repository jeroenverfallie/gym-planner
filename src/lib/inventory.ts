import { EQUIPMENT_TYPES, type EquipmentTypeId } from "#/lib/equipment";

/**
 * What the gym owns, configurable on the Settings page. Counts of the floor equipment (cardio machines, sleds, plyo
 * boxes, benches, soft mats) and the kettlebells and dumbbells by weight. The planner, the floor plan and the
 * workout generator all read it. Stored in this browser.
 */

export type WeightCount = { kg: number; count: number };

export type Inventory = {
  /** Owned units of each floor equipment type (workout spaces are markers, not equipment). */
  counts: Partial<Record<EquipmentTypeId, number>>;
  kettlebells: WeightCount[];
  dumbbells: WeightCount[];
};

/** Equipment types the settings page lets you count: everything physical (not the workout space marker). */
export const COUNTED_TYPES = EQUIPMENT_TYPES.filter((t) => !t.marker);

export const defaultInventory = (): Inventory => ({
  counts: Object.fromEntries(COUNTED_TYPES.map((t) => [t.id, t.count])),
  kettlebells: [
    { kg: 8, count: 2 },
    { kg: 12, count: 3 },
    { kg: 16, count: 3 },
  ],
  dumbbells: [
    { kg: 5, count: 2 },
    { kg: 10, count: 4 },
    { kg: 15, count: 4 },
    { kg: 20, count: 4 },
    { kg: 25, count: 2 },
  ],
});

const KEY = "gym-planner:inventory:v1";

const cleanWeights = (raw: unknown, fallback: WeightCount[]): WeightCount[] =>
  Array.isArray(raw)
    ? raw
        .filter(
          (w) =>
            w &&
            Number.isFinite(w.kg) &&
            w.kg > 0 &&
            Number.isFinite(w.count) &&
            w.count >= 0,
        )
        .map((w) => ({ kg: Number(w.kg), count: Math.round(w.count) }))
    : fallback;

/** The saved inventory, with the defaults filling anything missing. Browser only (defaults on the server). */
export function readInventory(): Inventory {
  const d = defaultInventory();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!raw || typeof raw !== "object") return d;
    for (const t of COUNTED_TYPES) {
      const n = raw.counts?.[t.id];
      if (Number.isFinite(n) && n >= 0) d.counts[t.id] = Math.round(n);
    }
    d.kettlebells = cleanWeights(raw.kettlebells, d.kettlebells);
    d.dumbbells = cleanWeights(raw.dumbbells, d.dumbbells);
    return d;
  } catch {
    return d;
  }
}

export function writeInventory(inv: Inventory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(inv));
  } catch {
    /* storage full or blocked */
  }
}

export const totalOf = (list: WeightCount[]) =>
  list.reduce((n, w) => n + w.count, 0);

/** How many of a floor equipment type the gym owns. */
export const ownedOf = (inv: Inventory, id: EquipmentTypeId) =>
  inv.counts[id] ?? EQUIPMENT_TYPES.find((t) => t.id === id)?.count ?? 0;
