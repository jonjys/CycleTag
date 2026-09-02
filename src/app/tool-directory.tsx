"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { reorderToolPath, reorderTools } from "@/lib/reorder-tools";

const groups = ["All", "Home", "Cleaning", "Personal care", "Office", "Vehicle", "Workshop", "Pets"] as const;

export function ToolDirectory() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof groups)[number]>("All");
  const normalized = query.trim().toLowerCase();

  const visible = useMemo(() => reorderTools.filter((tool) => {
    const matchesGroup = group === "All" || tool.group === group;
    const haystack = `${tool.preset.name} ${tool.title} ${tool.description} ${tool.preset.query} ${tool.group}`.toLowerCase();
    return matchesGroup && (!normalized || haystack.includes(normalized));
  }), [group, normalized]);

  return (
    <section className="tool-directory no-print" aria-labelledby="tool-directory-title">
      <div className="directory-heading">
        <div>
          <div className="section-kicker">FIND YOUR REPLACEMENT</div>
          <h2 id="tool-directory-title">What needs a tag?</h2>
        </div>
        <p>Search common refills and replacement parts. Choose one, add the exact model or part number, then print your free QR label.</p>
      </div>

      <div className="tool-search">
        <Search aria-hidden="true" size={21} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search toner, filter, vacuum, toothbrush, car…"
          aria-label="Search replacement products"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X aria-hidden="true" size={18} /></button>}
      </div>

      <div className="tool-filters" aria-label="Filter products by category">
        {groups.map((value) => (
          <button key={value} type="button" className={group === value ? "active" : ""} onClick={() => setGroup(value)}>{value}</button>
        ))}
      </div>

      <div className="tool-result-count" aria-live="polite">{visible.length} replacement {visible.length === 1 ? "tag" : "tags"}</div>
      {visible.length > 0 ? (
        <div className="tool-link-grid">
          {visible.map((tool) => (
            <Link href={reorderToolPath(tool)} key={tool.slug}>
              <small>{tool.group}</small>
              <strong>{tool.preset.name}</strong>
              <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="tool-empty">
          <strong>No exact match yet.</strong>
          <p>Create a custom tag instead — any product and search phrase works.</p>
          <a className="primary-button" href="#create">Create custom tag <ArrowUpRight aria-hidden="true" size={17} /></a>
        </div>
      )}
    </section>
  );
}
