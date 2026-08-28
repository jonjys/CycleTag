"use client";

import { useSyncExternalStore } from "react";
import { decodeTag } from "@/lib/tag";
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
  const encoded = new URLSearchParams(hash.slice(1)).get("clone");
  const cloned = decodeTag(encoded);

  return (
    <Generator
      key={cloned ? encoded : "new-tag"}
      initialTag={cloned ?? undefined}
      initialMessage={cloned ? "Tag copied into the builder. Adjust it and create a fresh label." : undefined}
    />
  );
}
