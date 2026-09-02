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
  { name: "Workshop supplies", query: "workshop replacement consumables", category: "workshop", interval: 45, icon: "workshop" },
  { name: "Robot vacuum parts", query: "robot vacuum model filter side brush dust bag", category: "cleaning", interval: 60, icon: "vacuum" },
  { name: "Toothbrush heads", query: "electric toothbrush model replacement brush heads", category: "other", interval: 90, icon: "workshop" },
  { name: "Aquarium filter", query: "aquarium filter model replacement cartridge media", category: "pet", interval: 45, icon: "pet" },
  { name: "Car cabin filter", query: "car make model year cabin pollen filter", category: "other", interval: 365, icon: "workshop" }
];
