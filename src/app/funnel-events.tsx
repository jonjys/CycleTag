"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { measure } from "@/lib/measure-client";
import { funnelSources, type FunnelSource } from "@/lib/measurement";
function sourceFor(path: string): FunnelSource { const source = path === "/" ? "home" : path.slice(1); return funnelSources.includes(source as FunnelSource) ? source as FunnelSource : "other"; }
export function FunnelEvents() {
  const path = usePathname(); const last = useRef("");
  useEffect(() => {
    const source = sourceFor(path);
    if (last.current !== path) { last.current = path; measure("page_view", source); }
    const started = new WeakSet<Element>();
    function start(event: Event) {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      const control = event.target.closest("input, textarea, select, button.preset, button[type=submit]");
      const builder = control?.closest("[data-tag-builder]");
      if (builder && !started.has(builder)) { started.add(builder); measure("label_started", source); }
    }
    function click(event: MouseEvent) {
      if (!event.isTrusted || (event.type === "auxclick" && event.button !== 1)) return;
      start(event);
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor) return;
      try {
        const url = new URL(anchor.href);
        if (/^(www\.)?ebay\.(com|co\.uk|de|fr|it|es|com\.au|ca)$/.test(url.hostname)) measure("outbound_ebay", source);
        else if (anchor.dataset.storeLink === "true") measure("outbound_store", source);
        else if (anchor.dataset.supportLink === "true" && url.hostname === "buy.stripe.com") measure("support_checkout_opened", source);
      } catch {}
    }
    const print = () => measure("print_requested", source);
    document.addEventListener("input", start); document.addEventListener("click", click); document.addEventListener("auxclick", click); window.addEventListener("beforeprint", print);
    return () => { document.removeEventListener("input", start); document.removeEventListener("click", click); document.removeEventListener("auxclick", click); window.removeEventListener("beforeprint", print); };
  }, [path]);
  return null;
}
