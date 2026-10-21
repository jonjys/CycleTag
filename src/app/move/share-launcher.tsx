"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Truck, Users } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/locale";
import { readPass, type Move } from "@/lib/move";
import { measure } from "@/lib/measure-client";
import { getShareSnapshot, getShareServerSnapshot, newShareKey, parseShare, saveShare, sharedRequest, sharePath, subscribeShare } from "@/lib/shared-move";

export function ShareLauncher({ move, passRaw }: { move: Move; passRaw: string | null | undefined }) {
  const { t } = useLocale();
  const router = useRouter();
  const raw = useSyncExternalStore(subscribeShare, getShareSnapshot, getShareServerSnapshot);
  const saved = parseShare(raw);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = saved;

  async function create() {
    if (!consent || !move.boxes.length || busy) return;
    setBusy(true); setError("");
    // Persist the capability BEFORE sending, so a lost response can be retried safely.
    const credentials = saved && !saved.expiresAt ? saved : { id: crypto.randomUUID(), key: newShareKey(), helper: newShareKey() };
    if (!credentials.helper || !saveShare(credentials)) {
      setError(t("Allow this browser to save site data before creating a shared move.", "Tillåt webbläsaren att spara webbplatsdata innan du delar flytten.")); setBusy(false); return;
    }
    try {
      const result = await sharedRequest({ action: "create", ...credentials, title: title.trim() || t("Moving day", "Flyttdagen"), boxes: move.boxes.map(({ n, room, fragile, heavy }) => ({ n, room, fragile, heavy })), session: readPass(passRaw)?.session });
      if (result.status !== "ok" || !result.move) {
        setError(result.status === "pass_required" ? t("Restore your paid Move Pass to share more than 3 boxes. Your list is unchanged.", "Återställ ditt betalda Move Pass för att dela fler än 3 kartonger. Listan är kvar.") : result.status === "limited" ? t("Too many new shared moves. Try again in an hour.", "För många nya delade flyttar. Försök igen om en timme.") : t("Could not create the shared move. Retry here; the same private reference will be used.", "Kunde inte skapa den delade flytten. Försök här igen; samma privata referens används."));
        return;
      }
      saveShare({ ...credentials, expiresAt: result.move.expiresAt });
      measure("move_day_created", "move");
      router.push(sharePath(credentials));
    } catch { setError(t("Connection lost. Retry here; a second move will not be created.", "Anslutningen bröts. Försök här igen; det skapas ingen extra flytt.")); }
    finally { setBusy(false); }
  }

  return <section className="md-launch no-print" aria-labelledby="md-launch-title">
    <div className="md-launch-icon"><Truck size={26} aria-hidden="true" /></div>
    <div className="md-launch-body"><div className="section-kicker">{t("MOVING DAY · SHARED CHECKS", "FLYTTDAGEN · GEMENSAM AVPRICKNING")}</div>
      <h2 id="md-launch-title">{t("All boxes in. All boxes out.", "Alla kartonger in. Alla kartonger ut.")}</h2>
      <p>{t("Share one link with your helpers. Check boxes onto the van and into the new home. See the missing numbers before anyone leaves.", "Dela en länk med bärhjälpen. Pricka av kartongerna in i bilen och in i nya hemmet. Se vilka nummer som saknas innan någon åker.")}</p>
      {active && saved?.expiresAt ? <><Link className="primary-button" href={sharePath(saved)}>{t("Open your moving day", "Öppna din flyttdag")} <ArrowRight size={18} aria-hidden="true" /></Link><p className="mv-fine">{t("The shared list is a snapshot. Changes to the packing list below are not synced. Manage or delete the shared copy from your moving day.", "Den delade listan är en ögonblicksbild. Ändringar i packlistan nedan synkas inte. Hantera eller radera den delade kopian i flyttdagen.")}</p></> : <>
        <button className="primary-button" type="button" disabled={!move.boxes.length} onClick={() => setExpanded(!expanded)} aria-expanded={expanded}><Users size={18} aria-hidden="true" /> {saved && !saved.expiresAt ? t("Finish creating your shared move", "Slutför din delade flytt") : t("Share moving day", "Dela flyttdagen")}</button>
        {!move.boxes.length && <small>{t("Add your first box below, then share when you're ready to load.", "Lägg till din första kartong nedan. Dela när det är dags att lasta.")}</small>}
      </>}
      {expanded && !saved?.expiresAt && <div className="md-share-form">
        <label htmlFor="md-title">{t("Shared title (optional)", "Delad rubrik (valfritt)")}</label><input id="md-title" value={title} maxLength={40} onChange={e => setTitle(e.target.value)} placeholder={t("Moving day", "Flyttdagen")} />
        <p>{t(`Share ${move.boxes.length} box numbers, rooms and fragile/heavy flags. Contents and packing notes stay on this device. Helpers can change checks and add problem notes. The shared copy expires after 30 days; you can delete it earlier.`, `Dela ${move.boxes.length} kartongnummer, rum och markeringar för ömtåligt/tungt. Innehåll och packanteckningar stannar på enheten. Hjälparna kan ändra avprickningar och lägga till problemanteckningar. Den delade kopian löper ut efter 30 dagar; du kan radera den tidigare.`)}</p>
        <label className="md-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />{t("Upload this shared copy. Anyone with the helper link can view and update it.", "Ladda upp den här delade kopian. Alla med hjälparlänken kan se och uppdatera den.")}</label>
        <button type="button" className="primary-button" disabled={!consent || busy} onClick={() => void create()}>{busy ? t("Creating…", "Skapar…") : t("Create shared moving day", "Skapa delad flyttdag")}</button>
        <p className="mv-fine">{t("3 boxes free. Larger moves use your existing Move Pass (SEK 79 once). No extra fee for helpers.", "3 kartonger gratis. Större flyttar använder ditt befintliga Move Pass (79 kr en gång). Ingen extra avgift för hjälparna.")}</p>
      </div>}
      {error && <p className="md-error" role="alert">{error}</p>}
    </div>
  </section>;
}
