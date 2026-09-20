"use client";

import { useEffect, useSyncExternalStore } from "react";
import { payloadFromBuilderHash } from "@/lib/tag";
import { Generator } from "./generator";

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getHashSnapshot() {
  return window.location.hash;
}

function getServerHashSnapshot() {
  return "";
}

export function HomeGenerator() {
  const hash = useSyncExternalStore(subscribeToLocation, getHashSnapshot, getServerHashSnapshot);
  const draft = payloadFromBuilderHash(hash);
  const encoded = draft?.encoded;

  useEffect(() => {
    if (!encoded) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    document.getElementById("create")?.scrollIntoView({ behavior, block: "start" });
  }, [encoded]);

  return (
    <Generator
      key={draft ? `${draft.reprint ? "print" : draft.logging ? "log" : "edit"}:${draft.encoded}` : "new-tag"}
      initialTag={draft?.tag}
      reissuing={Boolean(draft && !draft.reprint)}
      reprinting={Boolean(draft?.reprint)}
      logging={Boolean(draft?.logging)}
    />
  );
}
