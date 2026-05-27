/**
 * FMCSA cargo token constants — safe to import from client components.
 * Mirrors the canonical list maintained in AP_module (lib/fmcsa-cargo-tokens.ts);
 * the values are the MCS-150 cargo flags stored in unilink_portal_ap.fmcsa_census_carriers.cargo_carried.
 */

export const CARGO_TOKENS = {
  GENERAL_FREIGHT: 'General Freight',
  HOUSEHOLD_GOODS: 'Household Goods',
  METAL_SHEETS_COILS_ROLLS: 'Metal Sheets/Coils/Rolls',
  MOTOR_VEHICLES: 'Motor Vehicles',
  DRIVE_TOW_AWAY: 'Drive/Tow Away',
  LOGS_POLES_BEAMS_LUMBER: 'Logs/Poles/Beams/Lumber',
  BUILDING_MATERIALS: 'Building Materials',
  MOBILE_HOMES: 'Mobile Homes',
  MACHINERY_LARGE_OBJECTS: 'Machinery/Large Objects',
  FRESH_PRODUCE: 'Fresh Produce',
  LIQUIDS_GASES: 'Liquids/Gases',
  INTERMODAL_CONTAINERS: 'Intermodal Containers',
  PASSENGERS: 'Passengers',
  OILFIELD_EQUIPMENT: 'Oilfield Equipment',
  LIVESTOCK: 'Livestock',
  GRAIN_FEED_HAY: 'Grain/Feed/Hay',
  COAL_COKE: 'Coal/Coke',
  MEAT: 'Meat',
  GARBAGE_REFUSE_TRASH: 'Garbage/Refuse/Trash',
  USMAIL: 'U.S. Mail',
  CHEMICALS: 'Chemicals',
  COMMODITIES_DRY_BULK: 'Commodities Dry Bulk',
  REFRIGERATED_FOOD: 'Refrigerated Food',
  BEVERAGES: 'Beverages',
  PAPER_PRODUCTS: 'Paper Products',
  UTILITY: 'Utility',
  FARM_SUPPLIES: 'Farm Supplies',
  CONSTRUCTION: 'Construction',
  WATER_WELL: 'Water Well',
  OTHER: 'Other',
} as const

export type CargoToken = keyof typeof CARGO_TOKENS

export const CARGO_PRESETS = {
  BELLY_DUMP: [
    'BUILDING_MATERIALS',
    'COMMODITIES_DRY_BULK',
    'COAL_COKE',
    'CONSTRUCTION',
    'GRAIN_FEED_HAY',
  ],
  OTR_VAN: [
    'GENERAL_FREIGHT',
    'PAPER_PRODUCTS',
    'BEVERAGES',
    'CONSTRUCTION',
    'BUILDING_MATERIALS',
    'MACHINERY_LARGE_OBJECTS',
  ],
  REEFER: ['REFRIGERATED_FOOD', 'FRESH_PRODUCE', 'MEAT'],
  FLATBED: [
    'BUILDING_MATERIALS',
    'MACHINERY_LARGE_OBJECTS',
    'METAL_SHEETS_COILS_ROLLS',
    'LOGS_POLES_BEAMS_LUMBER',
    'OILFIELD_EQUIPMENT',
  ],
  TANKER: ['LIQUIDS_GASES', 'CHEMICALS'],
  AGRICULTURE: ['GRAIN_FEED_HAY', 'LIVESTOCK', 'FARM_SUPPLIES', 'FRESH_PRODUCE'],
  // Heuristic for oversized/overweight: FMCSA has no federal OS/OW permit field
  // (state-issued), so approximate by commodities typically hauled on flatbed/RGN/lowboy.
  HEAVY_HAUL: [
    'MACHINERY_LARGE_OBJECTS',
    'MOBILE_HOMES',
    'OILFIELD_EQUIPMENT',
    'LOGS_POLES_BEAMS_LUMBER',
    'BUILDING_MATERIALS',
    'METAL_SHEETS_COILS_ROLLS',
  ],
} as const satisfies Record<string, CargoToken[]>

export type CargoPreset = keyof typeof CARGO_PRESETS
