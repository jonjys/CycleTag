import type { Preset } from "./presets";

export type ReorderTool = {
  slug: string;
  group: "Home" | "Cleaning" | "Personal care" | "Office" | "Vehicle" | "Workshop" | "Pets";
  title: string;
  description: string;
  focus: string;
  preset: Preset;
  checklist: readonly [string, string, string];
};

export const reorderTools: readonly ReorderTool[] = [
  {
    slug: "printer-toner-qr-label",
    group: "Office",
    title: "Printer toner QR reorder label",
    description: "Make a free QR label that remembers the exact printer cartridge and opens the same replacement search whenever toner runs low.",
    focus: "Put the printer model and cartridge code in the search field so a future scan does not depend on memory or an old box.",
    preset: { name: "Printer toner", query: "printer model toner cartridge part number", category: "office", interval: 90, icon: "printer" },
    checklist: ["Copy the printer model from its front or settings page.", "Add the cartridge code printed on the current toner.", "Stick the label inside the supply cupboard or printer door."]
  },
  {
    slug: "water-filter-reorder-label",
    group: "Home",
    title: "Water filter QR reorder label",
    description: "Create a printable QR label for a tap, pitcher or under-sink filter and keep its exact replacement cartridge one scan away.",
    focus: "Filter housings often outlive their packaging. Record the cartridge code now, before the current filter is discarded.",
    preset: { name: "Water filter", query: "water filter replacement cartridge model", category: "water", interval: 180, icon: "water" },
    checklist: ["Find the code on the cartridge or filter housing.", "Set the interval recommended for your water use.", "Place the QR where it stays dry but remains easy to scan."]
  },
  {
    slug: "refrigerator-filter-qr-label",
    group: "Home",
    title: "Refrigerator filter QR reorder label",
    description: "Generate a stateless QR reminder for the exact refrigerator water filter your appliance accepts—no account or app required.",
    focus: "Fridge model names are easy to confuse. Use the filter part number as the primary search phrase and add the appliance model if needed.",
    preset: { name: "Refrigerator filter", query: "refrigerator water filter part number", category: "water", interval: 180, icon: "water" },
    checklist: ["Photograph or copy the old filter part number.", "Adjust the suggested six-month interval to the manual.", "Attach the printed label inside the fridge or nearby cupboard."]
  },
  {
    slug: "coffee-machine-filter-label",
    group: "Home",
    title: "Coffee machine filter QR label",
    description: "Build a QR label for coffee-machine filters, descaler or cleaning tablets and reopen the right replacement search on every cycle.",
    focus: "Include the machine series and the consumable code. A precise phrase avoids look-alike filters that do not fit.",
    preset: { name: "Coffee machine care", query: "coffee machine model filter descaler part number", category: "coffee", interval: 60, icon: "coffee" },
    checklist: ["Enter the machine series and consumable code.", "Choose the interval for filter, descaler or tablets.", "Keep the label near the water tank or cleaning supplies."]
  },
  {
    slug: "vacuum-bag-reorder-label",
    group: "Cleaning",
    title: "Vacuum bag QR reorder label",
    description: "Print a QR label that stores the exact vacuum bag or filter search and makes the next refill a quick scan instead of a model hunt.",
    focus: "Bag families can fit many vacuums while looking almost identical. Store both the vacuum model and bag type in the search.",
    preset: { name: "Vacuum bags / filter", query: "vacuum model bag type replacement filter", category: "cleaning", interval: 90, icon: "vacuum" },
    checklist: ["Copy the vacuum model and bag family.", "Set a cycle based on how quickly your household fills a bag.", "Stick the QR inside the cleaning cupboard."]
  },
  {
    slug: "air-purifier-filter-label",
    group: "Home",
    title: "Air purifier filter QR reorder label",
    description: "Create a free QR replacement label for a HEPA, carbon or pre-filter and preserve the exact purifier model for the next order.",
    focus: "State the purifier model and filter grade, especially when HEPA and carbon elements are sold separately.",
    preset: { name: "Air purifier filter", query: "air purifier model HEPA replacement filter", category: "home", interval: 180, icon: "vacuum" },
    checklist: ["Use the model printed on the purifier rating plate.", "Specify HEPA, carbon or combined filter.", "Place the label beside the filter-access panel."]
  },
  {
    slug: "pet-fountain-filter-label",
    group: "Pets",
    title: "Pet fountain filter QR reorder label",
    description: "Make a QR label for pet-fountain filters that survives after the box is gone and opens the right refill search from any phone.",
    focus: "Add the fountain brand, model and filter shape because visually similar pads can have different dimensions.",
    preset: { name: "Pet fountain filter", query: "pet fountain brand model replacement filter", category: "pet", interval: 30, icon: "pet" },
    checklist: ["Enter the fountain brand and exact model.", "Match the cycle to the number of pets and water quality.", "Keep the label on the fountain base or refill container."]
  },
  {
    slug: "label-printer-roll-reorder-label",
    group: "Office",
    title: "Label printer roll QR reorder label",
    description: "Generate a QR reorder label for thermal rolls or label cartridges and keep width, length and printer compatibility attached to the machine.",
    focus: "Dimensions matter more than appearance. Include roll width, core size and printer model in the saved search.",
    preset: { name: "Label printer rolls", query: "label printer model roll width core size", category: "office", interval: 45, icon: "printer" },
    checklist: ["Record roll width, length and core size.", "Add the printer model or cartridge family.", "Attach the QR to the printer or roll-storage bin."]
  },
  {
    slug: "sanding-disc-reorder-label",
    group: "Workshop",
    title: "Sanding disc QR reorder label",
    description: "Create a workshop QR label that remembers disc diameter, hole pattern and grit for the next refill.",
    focus: "A useful sanding-disc search needs diameter, attachment type, hole pattern and grit—not just the tool brand.",
    preset: { name: "Sanding discs", query: "sanding disc diameter hole pattern grit", category: "workshop", interval: 45, icon: "workshop" },
    checklist: ["Enter diameter and hook-and-loop or adhesive backing.", "Add hole pattern and the grit you use most.", "Label the matching drawer, shelf or sander case."]
  },
  {
    slug: "robot-vacuum-parts-label",
    group: "Cleaning",
    title: "Robot vacuum parts QR reorder label",
    description: "Build one QR label for the correct robot-vacuum filters, side brushes or dust bags and recover the exact search after every maintenance cycle.",
    focus: "Robot generations can share a brand but use different parts. Include the full model code and the specific consumable.",
    preset: { name: "Robot vacuum parts", query: "robot vacuum full model filter side brush dust bag", category: "cleaning", interval: 60, icon: "vacuum" },
    checklist: ["Copy the full model code from the underside.", "Name the filter, brush or bag you are tracking.", "Place the QR at the dock or spare-parts box."]
  },
  {
    slug: "pool-filter-reorder-label",
    group: "Home",
    title: "Pool filter QR reorder label",
    description: "Print a QR label for a pool or spa filter cartridge and save its dimensions and model before the old cartridge is thrown away.",
    focus: "Part numbers are best; otherwise include outer diameter, length and opening size to narrow the replacement search.",
    preset: { name: "Pool / spa filter", query: "pool spa filter cartridge part number dimensions", category: "water", interval: 180, icon: "water" },
    checklist: ["Use the cartridge part number or exact dimensions.", "Set a realistic replacement—not cleaning—interval.", "Attach the QR to the pump housing or maintenance box."]
  },
  {
    slug: "humidifier-filter-reorder-label",
    group: "Home",
    title: "Humidifier filter QR reorder label",
    description: "Create a QR replacement label for a humidifier wick, cartridge or demineralization filter with the correct model already remembered.",
    focus: "Describe the filter type as well as the humidifier model; wick filters and mineral cartridges are not interchangeable.",
    preset: { name: "Humidifier filter", query: "humidifier model wick replacement filter cartridge", category: "home", interval: 60, icon: "water" },
    checklist: ["Copy the complete humidifier model.", "Specify wick, cartridge or mineral filter.", "Keep the QR near the tank or seasonal storage box."]
  },
  {
    slug: "electric-toothbrush-head-label",
    group: "Personal care",
    title: "Electric toothbrush head QR reorder label",
    description: "Save the exact toothbrush series and brush-head type on a printable QR label for fast, compatible refills.",
    focus: "Electric toothbrush families often use several incompatible fittings. Include both the handle series and preferred head type.",
    preset: { name: "Toothbrush heads", query: "electric toothbrush model replacement brush heads", category: "other", interval: 90, icon: "workshop" },
    checklist: ["Copy the series name from the toothbrush handle.", "Add the preferred head type, such as sensitive or cross-action.", "Place the QR on the charger or bathroom storage box."]
  },
  {
    slug: "electric-shaver-head-label",
    group: "Personal care",
    title: "Electric shaver head QR reorder label",
    description: "Create a QR label for the correct foil, cutter or rotary head and avoid buying a look-alike that does not fit.",
    focus: "Shaver replacement heads are strongly model-specific. Store the complete shaver model and replacement-head code together.",
    preset: { name: "Shaver heads", query: "electric shaver full model replacement head foil cutter", category: "other", interval: 180, icon: "workshop" },
    checklist: ["Find the full model on the handle or charging base.", "Add foil, cutter or rotary-head type.", "Attach the QR inside the bathroom cabinet."]
  },
  {
    slug: "extractor-hood-filter-label",
    group: "Home",
    title: "Extractor hood filter QR reorder label",
    description: "Remember the exact cooker-hood grease or carbon filter dimensions with a permanent QR reorder label.",
    focus: "Carbon filters and grease mats may look universal but dimensions and mounting tabs differ. Include the hood model and filter size.",
    preset: { name: "Extractor hood filter", query: "cooker extractor hood model carbon grease filter", category: "home", interval: 120, icon: "vacuum" },
    checklist: ["Copy the hood model from inside the filter cover.", "Specify carbon, grease or combined filter.", "Stick the QR inside a nearby kitchen cupboard."]
  },
  {
    slug: "aquarium-filter-media-label",
    group: "Pets",
    title: "Aquarium filter media QR reorder label",
    description: "Make a QR label for the correct aquarium cartridge, sponge, carbon pad or filter-media refill.",
    focus: "Use the filter model and media type. Many cartridges share a shape while differing slightly in size and flow rating.",
    preset: { name: "Aquarium filter media", query: "aquarium filter model replacement cartridge media", category: "pet", interval: 45, icon: "pet" },
    checklist: ["Enter the filter brand and complete model.", "Name the cartridge, sponge or carbon-media type.", "Keep the QR on the aquarium cabinet or supply box."]
  },
  {
    slug: "car-cabin-filter-label",
    group: "Vehicle",
    title: "Car cabin filter QR reorder label",
    description: "Create a vehicle-specific QR label for the right pollen or activated-carbon cabin filter.",
    focus: "Vehicle fit depends on model year, engine and sometimes body style. Store all three plus the current filter part number.",
    preset: { name: "Car cabin filter", query: "car make model year cabin pollen filter part number", category: "other", interval: 365, icon: "workshop" },
    checklist: ["Enter make, model, year and engine.", "Add the old filter part number when available.", "Attach the QR in the glovebox or service folder."]
  },
  {
    slug: "car-wiper-blade-label",
    group: "Vehicle",
    title: "Car wiper blade QR reorder label",
    description: "Store the correct front and rear wiper lengths and connector type in a QR label kept with the car.",
    focus: "Wiper fit is more than length. Include vehicle year, left/right lengths and connector style to improve the search.",
    preset: { name: "Wiper blades", query: "car make model year front rear wiper blades", category: "other", interval: 365, icon: "workshop" },
    checklist: ["Enter make, model and year.", "Add front-left, front-right and rear lengths if known.", "Keep the QR inside the glovebox."]
  },
  {
    slug: "lawn-mower-service-parts-label",
    group: "Workshop",
    title: "Lawn mower service parts QR reorder label",
    description: "Save the mower model, air filter, spark plug and blade references on one reusable maintenance label.",
    focus: "The deck and engine can have separate model codes. Store both when searching for filters, plugs or blades.",
    preset: { name: "Lawn mower service parts", query: "lawn mower engine model air filter spark plug blade", category: "workshop", interval: 365, icon: "workshop" },
    checklist: ["Copy both mower and engine model numbers.", "Name the service part being tracked.", "Attach the QR under the handle or inside the shed."]
  },
  {
    slug: "three-d-printer-consumables-label",
    group: "Workshop",
    title: "3D printer consumables QR reorder label",
    description: "Create a QR label for filament diameter, material, colour, nozzle size or build-surface refills.",
    focus: "Record filament diameter and material before the spool is empty. For hardware, include the exact printer and nozzle thread.",
    preset: { name: "3D printer supplies", query: "3D printer model filament diameter nozzle build plate", category: "workshop", interval: 30, icon: "workshop" },
    checklist: ["Enter printer model and consumable type.", "Add diameter, material, colour or nozzle size.", "Place the QR on the printer or filament shelf."]
  },
  {
    slug: "sewing-machine-supplies-label",
    group: "Workshop",
    title: "Sewing machine supplies QR reorder label",
    description: "Remember the exact needle system, bobbin style, presser foot or belt for a sewing machine with one QR label.",
    focus: "Machine model plus needle or bobbin system produces better matches than brand alone.",
    preset: { name: "Sewing machine supplies", query: "sewing machine model needles bobbins replacement parts", category: "workshop", interval: 90, icon: "workshop" },
    checklist: ["Copy the complete machine model.", "Add needle system, bobbin class or part number.", "Attach the QR inside the accessory compartment."]
  },
  {
    slug: "camera-printer-paper-label",
    group: "Office",
    title: "Photo printer paper QR reorder label",
    description: "Save the right instant-film or compact photo-printer paper and cartridge pack for the next refill.",
    focus: "Compact photo printers often require a specific paper-and-ribbon pack. Include printer model, paper size and pack code.",
    preset: { name: "Photo printer refills", query: "photo printer model paper ink cartridge refill pack", category: "office", interval: 60, icon: "printer" },
    checklist: ["Enter the printer or camera model.", "Add paper size and refill-pack code.", "Keep the QR on the printer case or paper box."]
  },
  {
    slug: "heating-ventilation-filter-label",
    group: "Home",
    title: "Ventilation filter QR reorder label",
    description: "Create a QR label for the exact HVAC, heat-recovery or furnace filter dimensions and grade.",
    focus: "Dimensions and filtration grade are essential. Record width, height, depth and filter class along with the unit model.",
    preset: { name: "Ventilation filter", query: "ventilation HVAC unit model replacement filter dimensions grade", category: "home", interval: 180, icon: "vacuum" },
    checklist: ["Copy unit model and filter dimensions.", "Add filtration class or MERV rating.", "Attach the QR near the filter-access panel."]
  },
  {
    slug: "dehumidifier-filter-label",
    group: "Home",
    title: "Dehumidifier filter QR reorder label",
    description: "Keep the correct dehumidifier filter or drainage accessory one scan away with a model-specific QR label.",
    focus: "Use the complete dehumidifier model and specify washable pre-filter, HEPA element or drainage accessory.",
    preset: { name: "Dehumidifier filter", query: "dehumidifier full model replacement filter HEPA", category: "home", interval: 180, icon: "water" },
    checklist: ["Copy the full model from the rating plate.", "Specify the filter or accessory type.", "Place the QR beside the filter cover."]
  }
];

export function getReorderTool(slug: string): ReorderTool | undefined {
  return reorderTools.find((tool) => tool.slug === slug);
}

export function reorderToolPath(tool: ReorderTool): string {
  return `/reorder-label/${tool.slug}`;
}
