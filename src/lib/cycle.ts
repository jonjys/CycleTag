const dayMs = 86_400_000;

export type CycleStatus = {
  nextDue: Date;
  previousDue: Date;
  daysUntil: number;
  state: "due" | "soon" | "scheduled";
};

function utcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) / dayMs;
}

export function calculateCycle(start: string, intervalDays: number, now = new Date()): CycleStatus {
  const startDay = Date.parse(`${start}T00:00:00Z`) / dayMs;
  const today = utcDay(now);
  const elapsed = Math.max(0, today - startDay);
  const completed = Math.floor(elapsed / intervalDays);
  const previousDay = startDay + completed * intervalDays;
  const nextDay = elapsed === completed * intervalDays && elapsed > 0
    ? previousDay
    : startDay + (completed + 1) * intervalDays;
  const daysUntil = nextDay - today;

  return {
    nextDue: new Date(nextDay * dayMs),
    previousDue: new Date(previousDay * dayMs),
    daysUntil,
    state: daysUntil === 0 ? "due" : daysUntil <= Math.min(7, Math.ceil(intervalDays / 4)) ? "soon" : "scheduled"
  };
}

export function formatDate(date: Date, locale = "en"): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
