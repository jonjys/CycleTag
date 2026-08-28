import type { TagCategory } from "./tag";

export type Preset = {
  name: string;
  query: string;
  category: TagCategory;
  interval: number;
  icon: "printer" | "water" | "coffee" | "vacuum" | "pet" | "workshop";
};

export const presets: Preset[] = [
  { name: "Printer ink / toner", query: "printer ink toner cartridge", category: "office", interval: 90, icon: "printer" },
  { name: "Water filter", query: "replacement water filter cartridge", category: "water", interval: 180, icon: "water" },
  { name: "Coffee machine care", query: "coffee machine descaler filter", category: "coffee", interval: 60, icon: "coffee" },
  { name: "Vacuum bags / filter", query: "vacuum cleaner bags replacement filter", category: "cleaning", interval: 90, icon: "vacuum" },
  { name: "Pet fountain filter", query: "pet fountain replacement filter", category: "pet", interval: 30, icon: "pet" },
  { name: "Workshop supplies", query: "workshop replacement consumables", category: "workshop", interval: 45, icon: "workshop" }
];
