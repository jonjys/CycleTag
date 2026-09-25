"use client";
import { useEffect, useRef, useState } from "react";
import { markets, type Market } from "./tag";
import { marketForLanguage } from "./region";

/** Only suggest a market for new labels. Saved snapshots and manual choices win. */
export function useMarket(saved?: Market) {
  const [market, setMarket] = useState<Market>(saved ?? "DE");
  const locked = useRef(Boolean(saved));
  useEffect(() => {
    if (saved) return;
    let active = true;
    const fallback = marketForLanguage(navigator.language);
    void fetch("/api/region", { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
      .then(response => response.ok ? response.json() : null)
      .catch(() => null)
      .then(result => {
        if (!active || locked.current) return;
        const detected = navigator.language.toLowerCase().startsWith("sv") ? "DE" : result?.market;
        setMarket(markets.includes(detected) ? detected : fallback);
      });
    return () => { active = false; };
  }, [saved]);
  function chooseMarket(value: Market) { locked.current = true; setMarket(value); }
  function lockMarket() { locked.current = true; }
  return { market, chooseMarket, lockMarket };
}
