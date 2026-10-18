"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useLocale } from "@/lib/locale";
import { getChecklistServerSnapshot, getChecklistSnapshot, parseChecklist, phaseDate, phases, subscribeChecklist, tasks, writeChecklist, type Checklist, type Phase } from "@/lib/move-checklist";

export function MoveChecklist() {
  const { t, locale } = useLocale();
  const raw = useSyncExternalStore(subscribeChecklist, getChecklistSnapshot, getChecklistServerSnapshot);
  const { value, damaged } = parseChecklist(raw ?? null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("plan");
  const [error, setError] = useState("");
  const [remainingOnly, setRemainingOnly] = useState(false);
  const total = tasks.length + value.custom.length;
  const ready = raw !== undefined;

  function save(next: Checklist): boolean {
    if (!writeChecklist(next)) {
      setError(t("Could not save. Allow browser storage and try again. Your change was not saved.", "Kunde inte spara. Tillåt lagring i webbläsaren och försök igen. Ändringen sparades inte."));
      return false;
    }
    setError("");
    return true;
  }
  function toggle(id: string) {
    save({ ...value, done: value.done.includes(id) ? value.done.filter(done => done !== id) : [...value.done, id] });
  }
  function add(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || value.custom.length >= 50) return;
    if (save({ ...value, custom: [...value.custom, { id: `custom-${crypto.randomUUID()}`, text: text.trim(), phase }] })) setText("");
  }

  return <section className="mv-checklist no-print" id="checklist" aria-labelledby="mv-checklist-title">
    <div className="mv-checklist-head">
      <div><h2 id="mv-checklist-title">{t("Moving house checklist", "Checklista för flytten")}</h2><p>{t("A little less to remember. Plan your move, then label your boxes below.", "Lite mindre att hålla i huvudet. Planera flytten och märk sedan kartongerna nedan.")}</p></div>
      <label className="mv-checklist-date" htmlFor="mv-moving-date">{t("Moving date (optional)", "Flyttdatum (valfritt)")}<input id="mv-moving-date" type="date" min="1900-01-01" max="9999-12-31" value={value.date} disabled={!ready} onChange={e => save({ ...value, date: e.target.value })} /></label>
    </div>
    <p className="mv-fine">{t("Free · Saved only in this browser, on this device. Clearing browser data removes the list. Dates are suggested planning dates.", "Gratis · Sparas bara i den här webbläsaren på enheten. Rensar du webbläsardata försvinner listan. Datumen är förslag för din planering.")}</p>
    {error && <p className="mv-notice error" role="alert">{error}</p>}
    {damaged && <p className="mv-notice error" role="alert">{t("The saved checklist could not be read. Your next change starts a new checklist. Box labels are unaffected.", "Den sparade checklistan kunde inte läsas. Nästa ändring startar en ny checklista. Kartongetiketterna påverkas inte.")}</p>}
    <div className="mv-checklist-progress"><label htmlFor="mv-checklist-progress" aria-live="polite">{t(`${value.done.length} of ${total} done`, `${value.done.length} av ${total} klara`)}</label><progress id="mv-checklist-progress" value={value.done.length} max={total} /><label className="mv-checklist-filter"><input type="checkbox" checked={remainingOnly} onChange={e => setRemainingOnly(e.target.checked)} />{t("Only remaining", "Bara kvarvarande")}</label></div>
    <div className="mv-checklist-grid">{phases.map(group => {
      const date = phaseDate(value.date, group.days);
      const items = [...tasks.filter(task => task.phase === group.id).map(task => ({ id: task.id as string, text: t(task.en, task.sv), custom: false })), ...value.custom.filter(task => task.phase === group.id).map(task => ({ ...task, custom: true }))];
      const visible = items.filter(task => !remainingOnly || !value.done.includes(task.id));
      return <div className="mv-checklist-group" key={group.id}><h3>{t(group.en, group.sv)}{date && <time dateTime={date}>{new Intl.DateTimeFormat(locale === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}</time>}</h3><ul>{visible.map(task => <li key={task.id}><label className={value.done.includes(task.id) ? "is-done" : ""}><input type="checkbox" checked={value.done.includes(task.id)} disabled={!ready} onChange={() => toggle(task.id)} /><span>{task.text}</span></label>{task.custom && <button type="button" onClick={() => save({ ...value, custom: value.custom.filter(item => item.id !== task.id), done: value.done.filter(id => id !== task.id) })} aria-label={t(`Remove ${task.text}`, `Ta bort ${task.text}`)}>×</button>}</li>)}</ul>{visible.length === 0 && <p>{t("All done in this section!", "Allt klart i den här delen!")}</p>}</div>;
    })}</div>
    <form className="mv-checklist-add" onSubmit={add}><label htmlFor="mv-custom-task">{t("Add your own task", "Lägg till egen punkt")}<input id="mv-custom-task" maxLength={160} value={text} disabled={!ready || value.custom.length >= 50} onChange={e => setText(e.target.value)} placeholder={t("e.g. Return the spare keys", "t.ex. Lämna tillbaka extranycklar")} required /></label><label htmlFor="mv-task-phase">{t("When", "När")}<select id="mv-task-phase" value={phase} onChange={e => setPhase(e.target.value as Phase)}>{phases.map(group => <option key={group.id} value={group.id}>{t(group.en, group.sv)}</option>)}</select></label><button className="secondary-button" type="submit" disabled={!ready || !text.trim() || value.custom.length >= 50}>{t("Add task", "Lägg till")}</button></form>
    {value.custom.length >= 50 && <p className="mv-fine">{t("You have reached the limit of 50 custom tasks.", "Du har nått gränsen på 50 egna punkter.")}</p>}
  </section>;
}
