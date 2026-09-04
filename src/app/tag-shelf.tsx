"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { marketChoiceLabel, marketplaceName } from "@/lib/affiliate";
import { formatDate } from "@/lib/cycle";
import {
  clearShelf,
  getServerShelfSnapshot,
  getServerShelfStatusSnapshot,
  getShelfSnapshot,
  getShelfStatusSnapshot,
  removeShelfTag,
  shelfOpenHref,
  shelfPrintHref,
  subscribeShelf,
  type ShelfRecord
} from "@/lib/shelf";
import { ActionToast, type ToastTone } from "./action-toast";

type Flash = { text: string; tone: ToastTone };

export function TagShelf() {
  const records = useSyncExternalStore(subscribeShelf, getShelfSnapshot, getServerShelfSnapshot);
  const status = useSyncExternalStore(subscribeShelf, getShelfStatusSnapshot, getServerShelfStatusSnapshot);
  const [confirmClear, setConfirmClear] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const storageBlocked = records.length === 0 && status === "unavailable";

  function removeOne(record: ShelfRecord) {
    const result = removeShelfTag(record.encoded);
    setConfirmClear(false);
    setFlash(
      result.ok
        ? { tone: "success", text: "Removed from this device. The QR and printed label still work." }
        : { tone: "error", text: "This browser could not update the local list." }
    );
  }

  function clearAll() {
    const result = clearShelf();
    setConfirmClear(false);
    setFlash(
      result.ok
        ? { tone: "success", text: "Local list cleared. CycleTag never had a copy to delete." }
        : { tone: "error", text: "This browser could not clear the local list." }
    );
  }

  return (
    <section className="tag-shelf no-print" id="tags" aria-labelledby="shelf-title">
      <div className="shelf-heading">
        <div>
          <div className="section-kicker">ON THIS DEVICE ONLY</div>
          <h2 id="shelf-title">My tags</h2>
        </div>
        <p>A short list of labels created in this browser. CycleTag does not upload it, and there is still no account.</p>
      </div>

      <p className="payload-warning shelf-privacy">
        <ShieldCheck aria-hidden="true" size={14} />
        This list stays on your device. Clearing site data, using private mode, or tapping Clear all removes it here — printed stickers and QR links are unchanged.
      </p>

      {storageBlocked && (
        <aside className="shelf-unavailable" aria-live="polite">
          <strong>This browser cannot keep a local list.</strong>
          <p>Private mode, blocked storage or a full quota stops CycleTag from saving tags on this device. Print the label or copy the link instead — nothing is sent to CycleTag either way.</p>
        </aside>
      )}

      {flash && <ActionToast message={flash.text} tone={flash.tone} />}

      {records.length === 0 ? (
        <div className="shelf-empty">
          <strong>{storageBlocked ? "Nothing can be stored here right now." : "No tags saved on this device yet."}</strong>
          <p>
            {storageBlocked
              ? "Create a tag as usual, then print or bookmark the public link."
              : "Create a CycleTag and it will appear here automatically. The payload still lives in the QR, not in a CycleTag database."}
          </p>
          {!storageBlocked && <a className="primary-button" href="#create">Create a tag</a>}
        </div>
      ) : (
        <div className="shelf-list">
          <div className="shelf-count" aria-live="polite">
            {records.length} saved {records.length === 1 ? "tag" : "tags"} on this device
          </div>
          <ul>
            {records.map((record) => (
              <li className="shelf-item" key={record.encoded}>
                <div>
                  <strong>{record.name}</strong>
                  <p className="shelf-query">{record.query}</p>
                  <div className="shelf-item-meta">
                    <span>{marketChoiceLabel(record.market)}</span>
                    <span>{marketplaceName(record.market)}</span>
                    <span>Last replaced {formatDate(new Date(`${record.lastReplaced}T00:00:00Z`))}</span>
                    <span>Saved {formatSavedAt(record.savedAt)}</span>
                  </div>
                </div>
                <div className="shelf-item-actions">
                  <Link href={shelfOpenHref(record)}>Open</Link>
                  <a href={shelfPrintHref(record)}>Print again</a>
                  <button type="button" onClick={() => removeOne(record)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="shelf-toolbar">
            {confirmClear ? (
              <>
                <p>This only deletes the list on this device. Printed labels stay as they are.</p>
                <div className="shelf-item-actions">
                  <button type="button" onClick={clearAll}>Confirm clear</button>
                  <button type="button" onClick={() => setConfirmClear(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <p>Remove the local list without touching stickers or share links.</p>
                <button type="button" onClick={() => setConfirmClear(true)}>Clear all</button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "on this device";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
