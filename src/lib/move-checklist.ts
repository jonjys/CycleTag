export const CHECKLIST_KEY = "staytag.move-checklist.v1";
const EVENT = "staytag:move-checklist";
export const phases = [
  { id: "plan", days: -28, en: "4 weeks before", sv: "4 veckor före" },
  { id: "pack", days: -7, en: "1 week before", sv: "1 vecka före" },
  { id: "day", days: 0, en: "Moving day", sv: "Flyttdagen" },
  { id: "settle", days: 7, en: "After the move", sv: "Efter flytten" },
] as const;
export type Phase = typeof phases[number]["id"];
export const tasks = [
  { id: "transport", phase: "plan", en: "Book transport or a moving company", sv: "Boka transport eller flyttfirma" },
  { id: "declutter", phase: "plan", en: "Sell, donate or recycle things you no longer need", sv: "Sälj, skänk eller återvinn det du inte behöver" },
  { id: "services", phase: "plan", en: "Arrange electricity, internet and home insurance", sv: "Ordna el, bredband och hemförsäkring" },
  { id: "address", phase: "plan", en: "Check address-change and mail-forwarding arrangements", sv: "Kontrollera flyttanmälan och eventuell eftersändning" },
  { id: "labels", phase: "pack", en: "Pack by room and label your boxes below", sv: "Packa rum för rum och märk kartongerna nedan" },
  { id: "essentials", phase: "pack", en: "Pack a first-night bag: medicine, chargers, clothes and toiletries", sv: "Packa första natten-väska: mediciner, laddare, kläder och hygienartiklar" },
  { id: "cleaning", phase: "pack", en: "Arrange cleaning and key handover", sv: "Ordna flyttstädning och nyckelöverlämning" },
  { id: "confirm", phase: "pack", en: "Confirm arrival time, parking and access with your helpers", sv: "Bekräfta tid, parkering och tillträde med flytthjälpen" },
  { id: "photos", phase: "day", en: "Photograph the condition of both homes", sv: "Fotografera skicket i båda bostäderna" },
  { id: "meters", phase: "day", en: "Record meter readings where applicable", sv: "Anteckna mätarställningar där det behövs" },
  { id: "rooms", phase: "day", en: "Put each box in its labelled room", sv: "Ställ varje kartong i rummet på etiketten" },
  { id: "last-check", phase: "day", en: "Check cupboards, storage and keys before leaving", sv: "Kontrollera skåp, förråd och nycklar innan du lämnar" },
  { id: "unpack", phase: "settle", en: "Unpack essentials and mark boxes unpacked below", sv: "Packa upp det viktigaste och markera kartongerna uppackade nedan" },
  { id: "safety", phase: "settle", en: "Check smoke alarms and locate the water shut-off", sv: "Testa brandvarnare och hitta vattenavstängningen" },
  { id: "contacts", phase: "settle", en: "Update your address with relevant contacts and deliveries", sv: "Uppdatera adressen hos berörda kontakter och leveranser" },
  { id: "recycle", phase: "settle", en: "Reuse or recycle empty boxes and packing materials", sv: "Återanvänd eller återvinn kartonger och packmaterial" },
] as const;
export type Checklist = { date: string; done: string[]; custom: { id: string; text: string; phase: Phase }[] };
export const emptyChecklist = (): Checklist => ({ date: "", done: [], custom: [] });

export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 1900 && date.toISOString().slice(0, 10) === value;
}

export function phaseDate(date: string, days: number): string | null {
  if (!validDate(date)) return null;
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  const shifted = result.toISOString().slice(0, 10);
  return validDate(shifted) ? shifted : null;
}

/** A separate versioned record preserves the existing box inventory and pass. */
export function parseChecklist(raw: string | null): { value: Checklist; damaged: boolean } {
  if (raw === null) return { value: emptyChecklist(), damaged: false };
  try {
    const data = JSON.parse(raw);
    if (!data || (data.date !== "" && !validDate(data.date)) || !Array.isArray(data.done) || !Array.isArray(data.custom) || data.custom.length > 50) throw new Error();
    const ids = new Set<string>();
    for (const task of data.custom) {
      if (!task || typeof task.id !== "string" || !/^custom-[a-zA-Z0-9-]{1,80}$/.test(task.id) || ids.has(task.id) || typeof task.text !== "string" || !task.text.trim() || task.text.length > 160 || !phases.some(p => p.id === task.phase)) throw new Error();
      ids.add(task.id);
    }
    const allowed = new Set<string>([...tasks.map(t => t.id), ...ids]);
    if (data.done.length > allowed.size || !data.done.every((id: unknown) => typeof id === "string" && allowed.has(id))) throw new Error();
    return { value: { date: data.date, done: [...new Set<string>(data.done)], custom: data.custom }, damaged: false };
  } catch { return { value: emptyChecklist(), damaged: true }; }
}

export function getChecklistSnapshot(): string | null {
  try { return window.localStorage.getItem(CHECKLIST_KEY); } catch { return null; }
}
export const getChecklistServerSnapshot = (): undefined => undefined;
export function subscribeChecklist(callback: () => void): () => void {
  const storage = (event: StorageEvent) => { if (event.key === CHECKLIST_KEY || event.key === null) callback(); };
  window.addEventListener("storage", storage);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(EVENT, callback); };
}
export function writeChecklist(value: Checklist): boolean {
  try {
    const raw = JSON.stringify(value);
    if (parseChecklist(raw).damaged) return false;
    window.localStorage.setItem(CHECKLIST_KEY, raw);
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch { return false; }
}
