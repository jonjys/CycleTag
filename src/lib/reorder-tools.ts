import type { Preset } from "./presets";

export type ReorderTool = {
  slug: string;
  title: string;
  description: string;
  focus: string;
  preset: Preset;
  checklist: readonly [string, string, string];
};

export const reorderTools: readonly ReorderTool[] = [
  {
    slug: "printer-toner-qr-label",
    title: "Printer toner QR reorder label",
    description: "Make a free QR label that remembers the exact printer cartridge and opens the same replacement search whenever toner runs low.",
    focus: "Put the printer model and cartridge code in the search field so a future scan does not depend on memory or an old box.",
    preset: { name: "Printer toner", query: "printer model toner cartridge part number", category: "office", interval: 90, icon: "printer" },
    checklist: ["Copy the printer model from its front or settings page.", "Add the cartridge code printed on the current toner.", "Stick the label inside the supply cupboard or printer door."]
  },
  {
    slug: "water-filter-reorder-label",
    title: "Water filter QR reorder label",
    description: "Create a printable QR label for a tap, pitcher or under-sink filter and keep its exact replacement cartridge one scan away.",
    focus: "Filter housings often outlive their packaging. Record the cartridge code now, before the current filter is discarded.",
    preset: { name: "Water filter", query: "water filter replacement cartridge model", category: "water", interval: 180, icon: "water" },
    checklist: ["Find the code on the cartridge or filter housing.", "Set the interval recommended for your water use.", "Place the QR where it stays dry but remains easy to scan."]
  },
  {
    slug: "refrigerator-filter-qr-label",
    title: "Refrigerator filter QR reorder label",
    description: "Generate a stateless QR reminder for the exact refrigerator water filter your appliance accepts—no account or app required.",
    focus: "Fridge model names are easy to confuse. Use the filter part number as the primary search phrase and add the appliance model if needed.",
    preset: { name: "Refrigerator filter", query: "refrigerator water filter part number", category: "water", interval: 180, icon: "water" },
    checklist: ["Photograph or copy the old filter part number.", "Adjust the suggested six-month interval to the manual.", "Attach the printed label inside the fridge or nearby cupboard."]
  },
  {
    slug: "coffee-machine-filter-label",
    title: "Coffee machine filter QR label",
    description: "Build a QR label for coffee-machine filters, descaler or cleaning tablets and reopen the right replacement search on every cycle.",
    focus: "Include the machine series and the consumable code. A precise phrase avoids look-alike filters that do not fit.",
    preset: { name: "Coffee machine care", query: "coffee machine model filter descaler part number", category: "coffee", interval: 60, icon: "coffee" },
    checklist: ["Enter the machine series and consumable code.", "Choose the interval for filter, descaler or tablets.", "Keep the label near the water tank or cleaning supplies."]
  },
  {
    slug: "vacuum-bag-reorder-label",
    title: "Vacuum bag QR reorder label",
    description: "Print a QR label that stores the exact vacuum bag or filter search and makes the next refill a quick scan instead of a model hunt.",
    focus: "Bag families can fit many vacuums while looking almost identical. Store both the vacuum model and bag type in the search.",
    preset: { name: "Vacuum bags / filter", query: "vacuum model bag type replacement filter", category: "cleaning", interval: 90, icon: "vacuum" },
    checklist: ["Copy the vacuum model and bag family.", "Set a cycle based on how quickly your household fills a bag.", "Stick the QR inside the cleaning cupboard."]
  },
  {
    slug: "air-purifier-filter-label",
    title: "Air purifier filter QR reorder label",
    description: "Create a free QR replacement label for a HEPA, carbon or pre-filter and preserve the exact purifier model for the next order.",
    focus: "State the purifier model and filter grade, especially when HEPA and carbon elements are sold separately.",
    preset: { name: "Air purifier filter", query: "air purifier model HEPA replacement filter", category: "home", interval: 180, icon: "vacuum" },
    checklist: ["Use the model printed on the purifier rating plate.", "Specify HEPA, carbon or combined filter.", "Place the label beside the filter-access panel."]
  },
  {
    slug: "pet-fountain-filter-label",
    title: "Pet fountain filter QR reorder label",
    description: "Make a QR label for pet-fountain filters that survives after the box is gone and opens the right refill search from any phone.",
    focus: "Add the fountain brand, model and filter shape because visually similar pads can have different dimensions.",
    preset: { name: "Pet fountain filter", query: "pet fountain brand model replacement filter", category: "pet", interval: 30, icon: "pet" },
    checklist: ["Enter the fountain brand and exact model.", "Match the cycle to the number of pets and water quality.", "Keep the label on the fountain base or refill container."]
  },
  {
    slug: "label-printer-roll-reorder-label",
    title: "Label printer roll QR reorder label",
    description: "Generate a QR reorder label for thermal rolls or label cartridges and keep width, length and printer compatibility attached to the machine.",
    focus: "Dimensions matter more than appearance. Include roll width, core size and printer model in the saved search.",
    preset: { name: "Label printer rolls", query: "label printer model roll width core size", category: "office", interval: 45, icon: "printer" },
    checklist: ["Record roll width, length and core size.", "Add the printer model or cartridge family.", "Attach the QR to the printer or roll-storage bin."]
  },
  {
    slug: "sanding-disc-reorder-label",
    title: "Sanding disc QR reorder label",
    description: "Create a workshop QR label that remembers disc diameter, hole pattern and grit for the next refill.",
    focus: "A useful sanding-disc search needs diameter, attachment type, hole pattern and grit—not just the tool brand.",
    preset: { name: "Sanding discs", query: "sanding disc diameter hole pattern grit", category: "workshop", interval: 45, icon: "workshop" },
    checklist: ["Enter diameter and hook-and-loop or adhesive backing.", "Add hole pattern and the grit you use most.", "Label the matching drawer, shelf or sander case."]
  },
  {
    slug: "robot-vacuum-parts-label",
    title: "Robot vacuum parts QR reorder label",
    description: "Build one QR label for the correct robot-vacuum filters, side brushes or dust bags and recover the exact search after every maintenance cycle.",
    focus: "Robot generations can share a brand but use different parts. Include the full model code and the specific consumable.",
    preset: { name: "Robot vacuum parts", query: "robot vacuum full model filter side brush dust bag", category: "cleaning", interval: 60, icon: "vacuum" },
    checklist: ["Copy the full model code from the underside.", "Name the filter, brush or bag you are tracking.", "Place the QR at the dock or spare-parts box."]
  },
  {
    slug: "pool-filter-reorder-label",
    title: "Pool filter QR reorder label",
    description: "Print a QR label for a pool or spa filter cartridge and save its dimensions and model before the old cartridge is thrown away.",
    focus: "Part numbers are best; otherwise include outer diameter, length and opening size to narrow the replacement search.",
    preset: { name: "Pool / spa filter", query: "pool spa filter cartridge part number dimensions", category: "water", interval: 180, icon: "water" },
    checklist: ["Use the cartridge part number or exact dimensions.", "Set a realistic replacement—not cleaning—interval.", "Attach the QR to the pump housing or maintenance box."]
  },
  {
    slug: "humidifier-filter-reorder-label",
    title: "Humidifier filter QR reorder label",
    description: "Create a QR replacement label for a humidifier wick, cartridge or demineralization filter with the correct model already remembered.",
    focus: "Describe the filter type as well as the humidifier model; wick filters and mineral cartridges are not interchangeable.",
    preset: { name: "Humidifier filter", query: "humidifier model wick replacement filter cartridge", category: "home", interval: 60, icon: "water" },
    checklist: ["Copy the complete humidifier model.", "Specify wick, cartridge or mineral filter.", "Keep the QR near the tank or seasonal storage box."]
  }
];

export function getReorderTool(slug: string): ReorderTool | undefined {
  return reorderTools.find((tool) => tool.slug === slug);
}

export function reorderToolPath(tool: ReorderTool): string {
  return `/reorder-label/${tool.slug}`;
}
