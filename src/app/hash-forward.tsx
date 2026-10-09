"use client";
import { useEffect } from "react";

/** The maintenance-label builder moved from / to /labels. Forward its old hash links (#edit=, #print=, #create, #tags …). */
export function forwardTarget(hash: string): string | null {
  if (/^#(edit|print|log|clone)=/.test(hash) || hash === "#create" || hash === "#tags") return `/labels${hash}`;
  return null;
}

export function HashForward() {
  useEffect(() => {
    const go = () => { const target = forwardTarget(window.location.hash); if (target) window.location.replace(target); };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  return null;
}
