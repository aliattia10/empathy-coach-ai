import type { JourneyState } from "@/types/journey";

export type SustainabilityPathStepId =
  | "self_reflection"
  | "mindfulness"
  | "gratitude"
  | "social_logs";

export type SustainabilityPathItem = {
  id: SustainabilityPathStepId;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
};

export const DEFAULT_SUSTAINABILITY_PATH: Omit<SustainabilityPathItem, "completed" | "completed_at" | "sort_order">[] = [
  { id: "self_reflection", title: "Self-Reflection and journaling" },
  { id: "mindfulness", title: "Mindfulness Exercise" },
  { id: "gratitude", title: "Gratitude and Meditation" },
  { id: "social_logs", title: "Social Interaction Logs" },
];

const VALID_IDS = new Set(DEFAULT_SUSTAINABILITY_PATH.map((s) => s.id));

export function defaultSustainabilityPath(): SustainabilityPathItem[] {
  return DEFAULT_SUSTAINABILITY_PATH.map((step, index) => ({
    ...step,
    completed: false,
    completed_at: null,
    sort_order: index,
  }));
}

export function normalizeSustainabilityPath(raw: unknown): SustainabilityPathItem[] {
  const fallback = defaultSustainabilityPath();
  if (!Array.isArray(raw) || raw.length === 0) return fallback;

  const byId = new Map<string, SustainabilityPathItem>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    if (!VALID_IDS.has(id as SustainabilityPathStepId)) continue;
    const meta = DEFAULT_SUSTAINABILITY_PATH.find((s) => s.id === id)!;
    byId.set(id, {
      id: id as SustainabilityPathStepId,
      title: typeof row.title === "string" && row.title.trim() ? row.title.trim() : meta.title,
      completed: !!row.completed,
      completed_at: typeof row.completed_at === "string" ? row.completed_at : null,
      sort_order: typeof row.sort_order === "number" ? row.sort_order : byId.size,
    });
  }

  // Ensure all defaults exist
  for (const def of fallback) {
    if (!byId.has(def.id)) byId.set(def.id, def);
  }

  return [...byId.values()].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title))
    .map((item, index) => ({ ...item, sort_order: index }));
}

export function pathFromJourney(journey: Pick<JourneyState, "sustainability_path">): SustainabilityPathItem[] {
  return normalizeSustainabilityPath(journey.sustainability_path);
}

export function movePathItem(
  items: SustainabilityPathItem[],
  id: string,
  direction: "up" | "down",
): SustainabilityPathItem[] {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const index = sorted.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= sorted.length) return items;
  const next = [...sorted];
  const [removed] = next.splice(index, 1);
  next.splice(target, 0, removed);
  return next.map((item, i) => ({ ...item, sort_order: i }));
}

export function togglePathItemComplete(
  items: SustainabilityPathItem[],
  id: string,
  completed: boolean,
): SustainabilityPathItem[] {
  const now = new Date().toISOString();
  return items.map((item) =>
    item.id === id
      ? { ...item, completed, completed_at: completed ? now : null }
      : item,
  );
}

export function reorderPathByDrag(
  items: SustainabilityPathItem[],
  fromId: string,
  toId: string,
): SustainabilityPathItem[] {
  if (fromId === toId) return items;
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const fromIndex = sorted.findIndex((i) => i.id === fromId);
  const toIndex = sorted.findIndex((i) => i.id === toId);
  if (fromIndex < 0 || toIndex < 0) return items;
  const next = [...sorted];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next.map((item, i) => ({ ...item, sort_order: i }));
}

const storageKey = (journeyId: string) => `shifted.sustainability_path.${journeyId}`;

export function loadPathFromLocal(journeyId: string): SustainabilityPathItem[] | null {
  try {
    const raw = localStorage.getItem(storageKey(journeyId));
    if (!raw) return null;
    return normalizeSustainabilityPath(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function savePathToLocal(journeyId: string, items: SustainabilityPathItem[]) {
  try {
    localStorage.setItem(storageKey(journeyId), JSON.stringify(items));
  } catch {
    /* ignore quota */
  }
}
