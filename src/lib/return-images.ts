/** Original return screenshots, kept in this browser's IndexedDB only. */
const DB = "staytag-returns";
const STORE = "images";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("unavailable")); return; }
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("unavailable"));
    request.onblocked = () => reject(new Error("blocked"));
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error("failed"));
      tx.onabort = () => reject(tx.error ?? new Error("aborted"));
    });
  } finally { db.close(); }
}

export async function saveReturnImage(id: string, blob: Blob): Promise<boolean> {
  try { await run("readwrite", store => store.put(blob, id)); return true; } catch { return false; }
}

export async function loadReturnImage(id: string): Promise<Blob | null> {
  try { const value = await run<unknown>("readonly", store => store.get(id)); return value instanceof Blob ? value : null; } catch { return null; }
}

export async function deleteReturnImage(id: string): Promise<void> {
  try { await run("readwrite", store => store.delete(id)); } catch { /* nothing stored */ }
}

export async function clearReturnImages(): Promise<void> {
  try { await run("readwrite", store => store.clear()); } catch { /* nothing stored */ }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(value: string): Promise<Blob> {
  const [head, body] = value.split(",", 2);
  const type = /^data:(image\/(?:png|jpeg|webp));base64$/.exec(head)?.[1];
  if (!type || !body) throw new Error("Not an image");
  const binary = atob(body);
  return new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))], { type });
}
