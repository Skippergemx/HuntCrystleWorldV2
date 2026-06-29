import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const ITEM_CATALOG: Record<string, any> = {
  "hp_potion": {
    "cost": 50,
    "sellValue": 20,
    "type": "Consumable",
    "category": "Consumable",
    "reqLvl": 1
  },
  "auto_scroll": {
    "cost": 300,
    "sellValue": 120,
    "type": "Consumable",
    "category": "Consumable",
    "reqLvl": 1
  },
  "mega_hp_potion": {
    "sellValue": 100,
    "type": "Consumable",
    "category": "Consumable"
  },
  "ultra_hp_potion": {
    "sellValue": 500,
    "type": "Consumable",
    "category": "Consumable"
  },
  "auto_scroll_3m": {
    "sellValue": 350,
    "type": "Consumable",
    "category": "Consumable"
  },
  "auto_scroll_6m": {
    "sellValue": 700,
    "type": "Consumable",
    "category": "Consumable"
  },
  "auto_scroll_9m": {
    "sellValue": 1000,
    "type": "Consumable",
    "category": "Consumable"
  },
  "auto_scroll_12m": {
    "sellValue": 1400,
    "type": "Consumable",
    "category": "Consumable"
  },
  "steel_edge": {
    "cost": 100,
    "sellValue": 40,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 2
  },
  "breaker_hammer": {
    "cost": 400,
    "sellValue": 160,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 8
  },
  "scout_vest": {
    "cost": 150,
    "sellValue": 60,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 3
  },
  "heavy_plate": {
    "cost": 600,
    "sellValue": 240,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 10
  },
  "leather_cap": {
    "cost": 80,
    "sellValue": 32,
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 1
  },
  "iron_helm": {
    "cost": 250,
    "sellValue": 100,
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 5
  },
  "leather_boots": {
    "cost": 80,
    "sellValue": 32,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 1
  },
  "swift_sandals": {
    "cost": 300,
    "sellValue": 120,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 6
  },
  "war_boots": {
    "cost": 500,
    "sellValue": 200,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 12
  },
  "crystle_blade": {
    "sellValue": 400,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 5
  },
  "neon_plate": {
    "sellValue": 600,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 8
  },
  "tech_visor": {
    "sellValue": 320,
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 4
  },
  "kinetic_boots": {
    "sellValue": 480,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 6
  },
  "void_edge": {
    "sellValue": 2000,
    "rarity": "Epic",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 20
  },
  "guardian_core": {
    "sellValue": 2000,
    "rarity": "Legendary",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 20
  },
  "void_capacitor": {
    "sellValue": 1800,
    "rarity": "Epic",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 15
  },
  "omega_sigil": {
    "sellValue": 3200,
    "rarity": "Legendary",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 25
  },
  "crystle_shard": {
    "sellValue": 500,
    "scrapValue": 5000,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "beast_hide": {
    "sellValue": 15,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "void_essence": {
    "sellValue": 50,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "ancient_gear": {
    "sellValue": 200,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "core_pulse": {
    "sellValue": 1000,
    "rarity": "Epic",
    "type": "Heart",
    "category": "Loot"
  },
  "omega_crystle": {
    "sellValue": 5000,
    "rarity": "Legendary",
    "type": "Artifact",
    "category": "Loot"
  },
  "slum_scrap": {
    "sellValue": 5,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "toxic_sludge": {
    "sellValue": 8,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "rusty_wire": {
    "sellValue": 6,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "mutant_tooth": {
    "sellValue": 12,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "neon_dust": {
    "sellValue": 15,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "broken_sensor": {
    "sellValue": 45,
    "rarity": "Uncommon",
    "type": "Component",
    "category": "Loot"
  },
  "slum_medals": {
    "sellValue": 60,
    "rarity": "Uncommon",
    "type": "Token",
    "category": "Loot"
  },
  "cypher_chip": {
    "sellValue": 250,
    "rarity": "Rare",
    "type": "Data",
    "category": "Loot"
  },
  "glowing_eye": {
    "sellValue": 1200,
    "rarity": "Epic",
    "type": "Relic",
    "category": "Loot"
  },
  "slum_rat_tail": {
    "sellValue": 4,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "copper_piping": {
    "sellValue": 14,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "broken_glasses": {
    "sellValue": 2,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "dirty_rag": {
    "sellValue": 1,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "moldy_bread": {
    "sellValue": 1,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "faded_poster": {
    "sellValue": 5,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "cracked_tile": {
    "sellValue": 3,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "plastic_bottle": {
    "sellValue": 2,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "old_coin": {
    "sellValue": 35,
    "rarity": "Uncommon",
    "type": "Currency",
    "category": "Loot"
  },
  "bio_vial": {
    "sellValue": 75,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "hazard_tape": {
    "sellValue": 10,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "rusted_key": {
    "sellValue": 40,
    "rarity": "Uncommon",
    "type": "Key",
    "category": "Loot"
  },
  "empty_can": {
    "sellValue": 3,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "cracked_screen": {
    "sellValue": 55,
    "rarity": "Uncommon",
    "type": "Component",
    "category": "Loot"
  },
  "neon_filament": {
    "sellValue": 180,
    "rarity": "Rare",
    "type": "Material",
    "category": "Loot"
  },
  "canyon_iron": {
    "sellValue": 25,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "oil_drum": {
    "sellValue": 30,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "cracked_piston": {
    "sellValue": 20,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "sand_glass": {
    "sellValue": 18,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "engine_bolt": {
    "sellValue": 15,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "power_cell": {
    "sellValue": 80,
    "rarity": "Uncommon",
    "type": "Energy",
    "category": "Loot"
  },
  "vintage_armor": {
    "sellValue": 95,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "titanium_link": {
    "sellValue": 350,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "turbo_charger": {
    "sellValue": 1500,
    "rarity": "Epic",
    "type": "Component",
    "category": "Loot"
  },
  "exhaust_pipe": {
    "sellValue": 40,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "steel_spring": {
    "sellValue": 35,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "rubber_hose": {
    "sellValue": 25,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "spark_plug": {
    "sellValue": 65,
    "rarity": "Uncommon",
    "type": "Component",
    "category": "Loot"
  },
  "fan_blade": {
    "sellValue": 75,
    "rarity": "Uncommon",
    "type": "Component",
    "category": "Loot"
  },
  "rusty_cog": {
    "sellValue": 45,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "metal_shard": {
    "sellValue": 20,
    "rarity": "Common",
    "type": "Loot",
    "category": "Loot"
  },
  "fuel_filter": {
    "sellValue": 85,
    "rarity": "Uncommon",
    "type": "Component",
    "category": "Loot"
  },
  "brake_pad": {
    "sellValue": 90,
    "rarity": "Uncommon",
    "type": "Component",
    "category": "Loot"
  },
  "clutch_plate": {
    "sellValue": 250,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "valve_stem": {
    "sellValue": 70,
    "rarity": "Uncommon",
    "type": "Component",
    "category": "Loot"
  },
  "radiator_fin": {
    "sellValue": 55,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "chrome_trim": {
    "sellValue": 200,
    "rarity": "Rare",
    "type": "Loot",
    "category": "Loot"
  },
  "carbon_filter": {
    "sellValue": 320,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "hydraulics": {
    "sellValue": 1200,
    "rarity": "Epic",
    "type": "Component",
    "category": "Loot"
  },
  "ignition_coil": {
    "sellValue": 400,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "void_shard": {
    "sellValue": 100,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "dark_matter": {
    "sellValue": 120,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "gravity_well": {
    "sellValue": 150,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "neural_net": {
    "sellValue": 110,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "plasma_core": {
    "sellValue": 450,
    "rarity": "Uncommon",
    "type": "Energy",
    "category": "Loot"
  },
  "void_crystal": {
    "sellValue": 800,
    "rarity": "Rare",
    "type": "Relic",
    "category": "Loot"
  },
  "singularity": {
    "sellValue": 10000,
    "rarity": "Legendary",
    "type": "Artifact",
    "category": "Loot"
  },
  "event_horizon": {
    "sellValue": 4000,
    "rarity": "Epic",
    "type": "Relic",
    "category": "Loot"
  },
  "quantum_bit": {
    "sellValue": 900,
    "rarity": "Rare",
    "type": "Data",
    "category": "Loot"
  },
  "nanite_cloud": {
    "sellValue": 600,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "warp_drive_part": {
    "sellValue": 2500,
    "rarity": "Epic",
    "type": "Component",
    "category": "Loot"
  },
  "cyber_heart": {
    "sellValue": 2000,
    "rarity": "Epic",
    "type": "Heart",
    "category": "Loot"
  },
  "stardust": {
    "sellValue": 400,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "obsidian_glass": {
    "sellValue": 200,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "void_tear": {
    "sellValue": 350,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "shadow_pulse": {
    "sellValue": 280,
    "rarity": "Uncommon",
    "type": "Data",
    "category": "Loot"
  },
  "entropy_coil": {
    "sellValue": 750,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "null_point": {
    "sellValue": 950,
    "rarity": "Rare",
    "type": "Energy",
    "category": "Loot"
  },
  "void_membrane": {
    "sellValue": 180,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "black_hole_shard": {
    "sellValue": 15000,
    "rarity": "Legendary",
    "type": "Artifact",
    "category": "Loot"
  },
  "time_drift": {
    "sellValue": 3500,
    "rarity": "Epic",
    "type": "Relic",
    "category": "Loot"
  },
  "phase_module": {
    "sellValue": 820,
    "rarity": "Rare",
    "type": "Component",
    "category": "Loot"
  },
  "void_beacon": {
    "sellValue": 680,
    "rarity": "Rare",
    "type": "Tool",
    "category": "Loot"
  },
  "dark_energy_cell": {
    "sellValue": 520,
    "rarity": "Uncommon",
    "type": "Energy",
    "category": "Loot"
  },
  "void_fang": {
    "sellValue": 220,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "magma_core": {
    "sellValue": 1500,
    "rarity": "Epic",
    "type": "Material",
    "category": "Loot"
  },
  "fire_essence": {
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Material",
    "category": "Loot"
  },
  "scorched_bone": {
    "sellValue": 150,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "ember_shard": {
    "sellValue": 50,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "quake_stone": {
    "sellValue": 1500,
    "rarity": "Epic",
    "type": "Material",
    "category": "Loot"
  },
  "earth_essence": {
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Material",
    "category": "Loot"
  },
  "petrified_wood": {
    "sellValue": 150,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "granite_fragment": {
    "sellValue": 50,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "ocean_pearl": {
    "sellValue": 1500,
    "rarity": "Epic",
    "type": "Material",
    "category": "Loot"
  },
  "water_essence": {
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Material",
    "category": "Loot"
  },
  "coral_spine": {
    "sellValue": 150,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "sea_salt": {
    "sellValue": 50,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "gale_feather": {
    "sellValue": 1500,
    "rarity": "Epic",
    "type": "Material",
    "category": "Loot"
  },
  "storm_essence": {
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Material",
    "category": "Loot"
  },
  "cloud_silk": {
    "sellValue": 150,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "mist_vial": {
    "sellValue": 50,
    "rarity": "Common",
    "type": "Material",
    "category": "Loot"
  },
  "dragon_apple": {
    "cost": 2000,
    "sellValue": 50,
    "rarity": "Common",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 1,
    "exp": 1
  },
  "ember_grapes": {
    "cost": 2000,
    "sellValue": 50,
    "rarity": "Common",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 1,
    "exp": 1
  },
  "sky_berry": {
    "cost": 5000,
    "sellValue": 100,
    "rarity": "Uncommon",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 10,
    "exp": 2
  },
  "void_cherry": {
    "cost": 5000,
    "sellValue": 100,
    "rarity": "Uncommon",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 10,
    "exp": 2
  },
  "golden_peach": {
    "cost": 20000,
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 20,
    "exp": 5
  },
  "plasma_lemon": {
    "cost": 20000,
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 20,
    "exp": 5
  },
  "neon_orange": {
    "cost": 50000,
    "sellValue": 1200,
    "rarity": "Epic",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 30,
    "exp": 10
  },
  "crystle_pear": {
    "cost": 250000,
    "sellValue": 5000,
    "rarity": "Legendary",
    "type": "Fruit",
    "category": "Fruit",
    "reqLvl": 40,
    "exp": 25
  },
  "grilled_steak": {
    "cost": 5000,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 20
  },
  "techno_ramen": {
    "cost": 4500,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 18
  },
  "canyon_jerky": {
    "cost": 6000,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 25
  },
  "focus_brew": {
    "cost": 5000,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 20
  },
  "neon_bubble_tea": {
    "cost": 4500,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 18
  },
  "precision_bento": {
    "cost": 6000,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 25
  },
  "energy_shot": {
    "cost": 5000,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 20
  },
  "turbo_smoothie": {
    "cost": 4500,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 18
  },
  "street_taco": {
    "cost": 6000,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 25
  },
  "power_curry": {
    "cost": 8500,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 30
  },
  "hearty_gruel": {
    "cost": 8500,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 30
  },
  "void_sushi": {
    "cost": 8500,
    "type": "Consumable",
    "category": "Food",
    "reqLvl": 30
  },
  "taming_hydro": {
    "cost": 2500,
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Tool",
    "category": "Consumable",
    "reqLvl": 25
  },
  "taming_pyro": {
    "cost": 2500,
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Tool",
    "category": "Consumable",
    "reqLvl": 25
  },
  "taming_gale": {
    "cost": 2500,
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Tool",
    "category": "Consumable",
    "reqLvl": 25
  },
  "taming_earthen": {
    "cost": 2500,
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Tool",
    "category": "Consumable",
    "reqLvl": 25
  },
  "taming_cosmic": {
    "cost": 2500,
    "sellValue": 500,
    "rarity": "Rare",
    "type": "Tool",
    "category": "Consumable",
    "reqLvl": 25
  },
  "magma_blade": {
    "sellValue": 5000,
    "rarity": "Legendary",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 35
  },
  "tidal_plate": {
    "sellValue": 5000,
    "rarity": "Legendary",
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 35
  },
  "storm_boots": {
    "sellValue": 5000,
    "rarity": "Legendary",
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 35
  },
  "quake_helm": {
    "sellValue": 5000,
    "rarity": "Legendary",
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 35
  },
  "void_relic": {
    "sellValue": 8000,
    "rarity": "Legendary",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 45
  },
  "schema_neon_plate": {
    "sellValue": 500,
    "rarity": "Uncommon",
    "type": "Schematic",
    "category": "Loot"
  },
  "schema_tech_visor": {
    "sellValue": 300,
    "rarity": "Common",
    "type": "Schematic",
    "category": "Loot"
  },
  "schema_kinetic_boots": {
    "sellValue": 450,
    "rarity": "Uncommon",
    "type": "Schematic",
    "category": "Loot"
  },
  "schema_void_edge": {
    "sellValue": 2500,
    "rarity": "Epic",
    "type": "Schematic",
    "category": "Loot"
  },
  "scrap_saber": {
    "sellValue": 150,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 10
  },
  "riveted_plate": {
    "sellValue": 200,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 10
  },
  "welder_mask": {
    "sellValue": 120,
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 10
  },
  "heavy_clogs": {
    "sellValue": 120,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 10
  },
  "sludge_slicer": {
    "sellValue": 350,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 15
  },
  "hazmat_vest": {
    "sellValue": 400,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 15
  },
  "filter_helm": {
    "sellValue": 280,
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 15
  },
  "rubber_treaders": {
    "sellValue": 280,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 15
  },
  "pulse_blade": {
    "sellValue": 800,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 20
  },
  "data_mesh": {
    "sellValue": 900,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 20
  },
  "hud_goggles": {
    "sellValue": 650,
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 20
  },
  "static_runners": {
    "sellValue": 650,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 20
  },
  "scrap_spear": {
    "sellValue": 180,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 12
  },
  "sand_cloak": {
    "sellValue": 220,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 12
  },
  "dust_hood": {
    "sellValue": 150,
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 12
  },
  "dune_wraps": {
    "sellValue": 150,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 12
  },
  "flux_core_r": {
    "sellValue": 1200,
    "rarity": "Uncommon",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 22
  },
  "signal_jammer": {
    "sellValue": 1250,
    "rarity": "Uncommon",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 22
  },
  "capacitor_cuff": {
    "sellValue": 1100,
    "rarity": "Uncommon",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 22
  },
  "neural_link": {
    "sellValue": 1500,
    "rarity": "Rare",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 22
  },
  "titan_impact": {
    "sellValue": 1800,
    "rarity": "Rare",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 28
  },
  "void_plating": {
    "sellValue": 2000,
    "rarity": "Rare",
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 28
  },
  "chrono_helm": {
    "sellValue": 1600,
    "rarity": "Rare",
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 28
  },
  "warp_boots": {
    "sellValue": 1600,
    "rarity": "Rare",
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 28
  },
  "bio_saber": {
    "sellValue": 900,
    "rarity": "Rare",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 24
  },
  "recycled_core": {
    "sellValue": 2500,
    "rarity": "Epic",
    "type": "Relic",
    "category": "Equipment",
    "reqLvl": 30
  },
  "scrap_cannon": {
    "sellValue": 1400,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 26
  },
  "neon_shield": {
    "sellValue": 1200,
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 22
  },
  "hazmat_claws": {
    "sellValue": 1300,
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 24
  },
  "void_wraps": {
    "sellValue": 1350,
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 25
  },
  "enforcer_blade": {
    "cost": 3000,
    "sellValue": 1200,
    "rarity": "Uncommon",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 35
  },
  "enforcer_plate": {
    "cost": 3200,
    "sellValue": 1280,
    "rarity": "Uncommon",
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 35
  },
  "enforcer_helm": {
    "cost": 2800,
    "sellValue": 1120,
    "rarity": "Uncommon",
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 35
  },
  "enforcer_boots": {
    "cost": 2800,
    "sellValue": 1120,
    "rarity": "Uncommon",
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 35
  },
  "vanguard_halberd": {
    "cost": 8000,
    "sellValue": 3200,
    "rarity": "Rare",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 50
  },
  "vanguard_suit": {
    "cost": 8500,
    "sellValue": 3400,
    "rarity": "Rare",
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 50
  },
  "vanguard_visor": {
    "cost": 7500,
    "sellValue": 3000,
    "rarity": "Rare",
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 50
  },
  "vanguard_treads": {
    "cost": 7500,
    "sellValue": 3000,
    "rarity": "Rare",
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 50
  },
  "apex_striker": {
    "cost": 20000,
    "sellValue": 8000,
    "rarity": "Epic",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 75
  },
  "apex_carapace": {
    "cost": 22000,
    "sellValue": 8800,
    "rarity": "Epic",
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 75
  },
  "apex_crown": {
    "cost": 18000,
    "sellValue": 7200,
    "rarity": "Epic",
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 75
  },
  "apex_striders": {
    "cost": 18000,
    "sellValue": 7200,
    "rarity": "Epic",
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 75
  },
  "genesis_edge": {
    "cost": 50000,
    "sellValue": 20000,
    "rarity": "Legendary",
    "type": "Weapon",
    "category": "Equipment",
    "reqLvl": 100
  },
  "genesis_core_armor": {
    "cost": 55000,
    "sellValue": 22000,
    "rarity": "Legendary",
    "type": "Armor",
    "category": "Equipment",
    "reqLvl": 100
  },
  "genesis_halo": {
    "cost": 45000,
    "sellValue": 18000,
    "rarity": "Legendary",
    "type": "Headgear",
    "category": "Equipment",
    "reqLvl": 100
  },
  "genesis_gravity_boots": {
    "cost": 45000,
    "sellValue": 18000,
    "rarity": "Legendary",
    "type": "Footwear",
    "category": "Equipment",
    "reqLvl": 100
  },
  "magnetic_coil": {
    "sellValue": 85,
    "rarity": "Uncommon",
    "type": "Material",
    "category": "Loot"
  },
  "aether_spark": {
    "sellValue": 1000,
    "rarity": "Legendary",
    "type": "Artifact",
    "category": "Loot"
  },
  "hunt_spark": {
    "sellValue": 250,
    "rarity": "Rare",
    "type": "Artifact",
    "category": "Loot"
  }
};

// Robust base ID extractor: strips `_<timestamp>_<any_suffix>` or `_<timestamp>` patterns.
// Handles short suffixes (1–3 chars) that the old {4,} regex missed.
const extractBaseId = (itemId: string): string => {
  // Strip everything from the first underscore followed by 10+ digits (a 13-digit ms timestamp)
  const tsStripped = itemId.replace(/_\d{10,}.*$/, '');
  const baseId = tsStripped !== itemId ? tsStripped : itemId.replace(/_[a-z0-9]{4}$/i, '').replace(/_\d+$/, '');
  return baseId.replace(/_RET$/, '');
};

// Helper: look up sell value by extracting the canonical base ID.
// Falls back to the inventory item's own sellValue if not in the catalog —
// items placed by the server (loot drops, purchases, quest rewards) are trustworthy.
const getSellValue = (itemId: string, itemData?: any): number => {
  const baseId = extractBaseId(itemId);
  console.log(`[getSellValue] itemId: "${itemId}", baseId: "${baseId}"`);
  const entry = ITEM_CATALOG[baseId] ?? ITEM_CATALOG[itemId];
  console.log(`[getSellValue] entry found:`, !!entry, entry ? JSON.stringify(entry) : 'null');
  if (entry) {
    if (entry.sellValue !== undefined) {
      console.log(`[getSellValue] returning catalog sellValue: ${entry.sellValue}`);
      return entry.sellValue;
    }
    if (entry.cost !== undefined) {
      console.log(`[getSellValue] returning catalog cost fallback: ${Math.floor(entry.cost * 0.4)}`);
      return Math.floor(entry.cost * 0.4);
    }
  }
  // Fallback: use the inventory item's own data (server-written, trustworthy)
  if (itemData) {
    if (itemData.sellValue !== undefined) {
      console.log(`[getSellValue] falling back to inventory item sellValue: ${itemData.sellValue}`);
      return itemData.sellValue;
    }
    if (itemData.cost !== undefined) {
      console.log(`[getSellValue] falling back to inventory item cost: ${Math.floor(itemData.cost * 0.4)}`);
      return Math.floor(itemData.cost * 0.4);
    }
  }
  console.log(`[getSellValue] no value found, returning 0`);
  return 0;
};

const getCatalogEntry = (itemId: string) => {
  const baseId = extractBaseId(itemId);
  return ITEM_CATALOG[baseId] ?? ITEM_CATALOG[itemId] ?? null;
};

// Rate limit helper: max 1 kill reward per 3 seconds
const MIN_KILL_INTERVAL_MS = 500;

export const handleSecureGameAction = async (request: any, db: admin.firestore.Firestore) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Security Clearance Denied.');
  }

  const { action, payload } = request.data;
  const uid = request.auth.uid;
  const userRef = db.collection('players').doc(uid);

  return await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new HttpsError('not-found', 'Player Node Missing.');
    const userData = userSnap.data() as any;

    if (action === 'ALLOCATE_STAT') {
      const { statName } = payload;
      const currentAP = userData.abilityPoints || 0;
      if (currentAP <= 0) throw new HttpsError('failed-precondition', 'Insufficient AP.');

      const currentStat = (userData.baseStats?.[statName] || 10);
      transaction.update(userRef, {
        [`baseStats.${statName}`]: currentStat + 1,
        abilityPoints: currentAP - 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: `Upgraded ${statName}!` };
    }

    if (action === 'BUY_ITEM') {
      const { item, qty } = payload;
      // SECURITY PATCH: Never trust client-supplied 'cost'. Look up from server catalog.
      const catalogEntry = getCatalogEntry(item.id);
      if (!catalogEntry) throw new HttpsError('not-found', 'Item not available for purchase.');

      let cost = catalogEntry.cost;
      if (cost === undefined) {
        // Calculate dynamic cost if it's an Industrial Scrap item (Loot/Material/Component with sellValue > 0)
        if ((catalogEntry.category === 'Loot' || catalogEntry.type === 'Material' || catalogEntry.type === 'Component') && catalogEntry.sellValue > 0) {
          const rarity = catalogEntry.rarity?.toLowerCase() || 'common';
          let mult = 10;
          if (rarity === 'uncommon') mult = 20;
          if (rarity === 'rare') mult = 40;
          if (rarity === 'epic') mult = 80;
          if (rarity === 'legendary') mult = 150;
          const baseValue = catalogEntry.scrapValue ?? catalogEntry.sellValue;
          cost = baseValue * mult;
        }
      }

      if (cost === undefined) throw new HttpsError('not-found', 'Item not available for purchase.');
      if (!Number.isInteger(qty) || qty <= 0 || qty > 99) throw new HttpsError('invalid-argument', 'Invalid quantity.');
      const totalCost = cost * qty;
      const currentTokens = userData.tokens || 0;
      if (currentTokens < totalCost) throw new HttpsError('failed-precondition', 'Insufficient GX.');
      if (userData.level < (catalogEntry.reqLvl || 1)) throw new HttpsError('failed-precondition', 'Level too low.');

      // SECURITY: Enforce inventory slot capacity before allowing purchase
      const maxSlots = userData.maxInventorySlots || 50;
      const currentSlots = Object.keys(userData.inventory || {}).length;
      const isCounterItem = (item.id === 'hp_potion' || item.id === 'auto_scroll');
      if (!isCounterItem && (currentSlots + qty) > maxSlots) {
        throw new HttpsError('failed-precondition', `Bag full! You have ${currentSlots}/${maxSlots} slots used. Sell items or upgrade your storage.`);
      }

      const updates: any = {
        tokens: currentTokens - totalCost,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (item.id === 'hp_potion') {
        updates.potions = (userData.potions || 0) + qty;
      } else if (item.id === 'auto_scroll') {
        updates.autoScrolls = (userData.autoScrolls || 0) + qty;
      } else {
        const inventory = userData.inventory || {};
        for (let i = 0; i < qty; i++) {
          const suffix = Math.random().toString(36).slice(2, 6);
          const uniqueId = `${item.id}_${Date.now()}_${suffix}`;
          inventory[uniqueId] = { ...item, id: uniqueId };
        }
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true, message: `Acquired ${item.name}!` };
    }

    if (action === 'MIX_ITEM') {
      const { recipe, itemsToConsumeKeys } = payload;
      // SECURITY PATCH: Validate recipe cost from server; reject empty material arrays (Free Forge exploit).
      if (!recipe?.id || typeof recipe.id !== 'string') throw new HttpsError('invalid-argument', 'Invalid recipe.');
      if (!Array.isArray(itemsToConsumeKeys) || itemsToConsumeKeys.length === 0)
        throw new HttpsError('invalid-argument', 'No materials provided for fusion.');
      const recipeCost = typeof recipe.cost === 'number' && Number.isInteger(recipe.cost) && recipe.cost >= 0
        ? recipe.cost : 0; // cost is allowed to be 0 for material-only recipes, but NEVER negative
      if (recipe.cost < 0) throw new HttpsError('invalid-argument', 'Invalid recipe cost.');

      const currentTokens = userData.tokens || 0;
      if (currentTokens < recipeCost) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      const inventory = userData.inventory || {};
      itemsToConsumeKeys.forEach((key: string) => {
        if (typeof key !== 'string') throw new HttpsError('invalid-argument', 'Invalid material key.');
        if (!inventory[key]) throw new HttpsError('not-found', `Missing material: ${key}`);
        delete inventory[key];
      });

      const updates: any = {
        tokens: currentTokens - recipeCost,
        inventory: inventory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (recipe.id === 'hp_potion') {
        updates.potions = (userData.potions || 0) + 1;
      } else if (recipe.id === 'auto_scroll') {
        updates.autoScrolls = (userData.autoScrolls || 0) + 1;
      } else {
        const suffix = Math.random().toString(36).slice(2, 6);
        const uniqueId = `${recipe.id}_${Date.now()}_${suffix}`;
        inventory[uniqueId] = { ...recipe, id: uniqueId };
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true, message: `Fusion Successful!` };
    }

    if (action === 'PROCESS_KILL_REWARDS') {
      const { earnedLoot, earnedXp, nextXp, nextLvl, nextMaxHp, loots } = payload;
      
      // SECURITY PATCH: Validate all numeric inputs are positive integers within bounds.
      if (!Number.isInteger(earnedLoot) || earnedLoot < 0 || earnedLoot > 49999)
        throw new HttpsError('out-of-range', 'Invalid loot payload.');
      if (!Number.isInteger(earnedXp) || earnedXp < 0 || earnedXp > 99999)
        throw new HttpsError('out-of-range', 'Invalid XP payload.');
      
      // SECURITY PATCH: Rate limiting - enforce minimum 3s between kill reward claims.
      const lastKillReward = userData.lastKillRewardAt || 0;
      if (Date.now() - lastKillReward < MIN_KILL_INTERVAL_MS)
        throw new HttpsError('resource-exhausted', 'Kill reward rate limit exceeded.');

      const updates: any = {
        tokens: (userData.tokens || 0) + earnedLoot,
        xp: nextXp,
        level: nextLvl,
        maxHp: nextMaxHp,
        hp: Math.min(nextMaxHp, (userData.hp || 0) + 25),
        lastKillRewardAt: Date.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Algorithmic AP Auto-Heal: Enforce strict AP calculation
      const safeStr = Number(userData.baseStats?.str ?? 10);
      const safeAgi = Number(userData.baseStats?.agi ?? 10);
      const safeDex = Number(userData.baseStats?.dex ?? 10);
      const spentAP = (Math.max(10, safeStr) - 10) + (Math.max(10, safeAgi) - 10) + (Math.max(10, safeDex) - 10);
      const earnedAP = (Number(nextLvl) || 1) * 5;
      const trueAP = isNaN(earnedAP - spentAP) ? 0 : Math.max(0, earnedAP - spentAP);
      updates.abilityPoints = trueAP;

      if (loots && loots.length > 0) {
        const inventory = userData.inventory || {};
        const maxSlots = userData.maxInventorySlots || 50;
        loots.forEach((loot: any) => {
          if (loot.id?.includes('_pool_')) return;
          // SERVER CAPACITY LOCK: Skip adding items if capacity is exceeded
          if (Object.keys(inventory).length >= maxSlots) return;
          inventory[loot.id] = loot;
        });
        updates.inventory = inventory;
        
        const potCount = loots.filter((l: any) => l.id?.startsWith('hp_potion')).length;
        if (potCount > 0) updates.potions = (userData.potions || 0) + potCount;
        
        const scrollCount = loots.filter((l: any) => l.id?.startsWith('auto_scroll_pool')).length;
        if (scrollCount > 0) updates.autoScrolls = (userData.autoScrolls || 0) + scrollCount;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'COMPLETE_QUIZ') {
      const { quizId, earnedLoot, earnedXp, nextXp, nextLvl, nextMaxHp, apGained, loots } = payload;

      // Validate inputs
      if (!quizId) throw new HttpsError('invalid-argument', 'Missing quizId.');
      if (!Number.isInteger(earnedLoot) || earnedLoot < 0 || earnedLoot > 49999)
        throw new HttpsError('out-of-range', 'Invalid loot payload.');
      if (!Number.isInteger(earnedXp) || earnedXp < 0 || earnedXp > 99999)
        throw new HttpsError('out-of-range', 'Invalid XP payload.');

      // Prevent completing the same quiz multiple times
      const completedQuizzes = userData.completedQuizzes || {};
      if (completedQuizzes[quizId]) {
        throw new HttpsError('already-exists', 'Quiz already completed.');
      }

      const updates: any = {
        tokens: (userData.tokens || 0) + earnedLoot,
        xp: nextXp,
        level: nextLvl,
        maxHp: nextMaxHp,
        hp: Math.min(nextMaxHp, (userData.hp || 0) + (apGained > 0 ? 50 : 0)),
        [`completedQuizzes.${quizId}`]: Date.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (userData.quizSlots) {
        updates.quizSlots = userData.quizSlots.filter((id: string) => id !== quizId);
      }

      // Algorithmic AP Auto-Heal: Enforce strict AP calculation
      const safeStr = Number(userData.baseStats?.str ?? 10);
      const safeAgi = Number(userData.baseStats?.agi ?? 10);
      const safeDex = Number(userData.baseStats?.dex ?? 10);
      const spentAP = (Math.max(10, safeStr) - 10) + (Math.max(10, safeAgi) - 10) + (Math.max(10, safeDex) - 10);
      const earnedAP = (Number(nextLvl) || 1) * 5;
      const trueAP = isNaN(earnedAP - spentAP) ? 0 : Math.max(0, earnedAP - spentAP);
      updates.abilityPoints = trueAP;

      if (loots && loots.length > 0) {
        const inventory = userData.inventory || {};
        const maxSlots = userData.maxInventorySlots || 50;
        loots.forEach((loot: any) => {
          if (loot.id?.includes('_pool_')) return;
          if (Object.keys(inventory).length >= maxSlots) return;
          inventory[loot.id] = loot;
        });
        updates.inventory = inventory;
        
        const potCount = loots.filter((l: any) => l.id?.startsWith('hp_potion')).length;
        if (potCount > 0) updates.potions = (userData.potions || 0) + potCount;
        
        const scrollCount = loots.filter((l: any) => l.id?.startsWith('auto_scroll_pool')).length;
        if (scrollCount > 0) updates.autoScrolls = (userData.autoScrolls || 0) + scrollCount;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'SELL_ITEM') {
      const { itemId, qty } = payload;
      console.log(`[SELL_ITEM] Payload itemId: "${itemId}", qty: ${qty}`);
      // SECURITY PATCH: 'value' is NEVER accepted from client — looked up server-side.
      if (!Number.isInteger(qty) || qty <= 0 || qty > 99) throw new HttpsError('invalid-argument', 'Invalid quantity.');
      const inventory = userData.inventory || {};
      const targetItem = inventory[itemId];
      console.log(`[SELL_ITEM] targetItem found:`, !!targetItem, targetItem ? JSON.stringify(targetItem) : 'null');
      if (!targetItem) throw new HttpsError('not-found', 'Item not in inventory.');

      // Look up canonical sell value from server catalog (with inventory item fallback)
      const trueSellValue = getSellValue((targetItem as any).id || itemId, targetItem);
      console.log(`[SELL_ITEM] trueSellValue resolved: ${trueSellValue}`);
      if (trueSellValue <= 0) throw new HttpsError('failed-precondition', 'This item cannot be sold.');

      const baseId = extractBaseId((targetItem as any).id || itemId);

      // Hunt Sparks and Aether Sparks are exchange-only — block server-side.
      if (baseId === 'hunt_spark' || baseId === 'aether_spark') {
        throw new HttpsError('failed-precondition', 'Exchange artifacts cannot be sold for GX. Visit the Crystle Town Exchange Terminal.');
      }
      const sellQty = qty;
      let removed = 0;

      // 1. Delete targetItem first to prevent other same-baseId items from being sold instead
      if (inventory[itemId]) {
        const targetBaseId = extractBaseId((inventory[itemId] as any).id || itemId);
        if (targetBaseId === baseId) {
          delete inventory[itemId];
          removed++;
        }
      }

      // 2. Fallback to delete other items with the same baseId if qty > 1 (e.g. stackable loots)
      if (removed < sellQty) {
        const entries = Object.entries(inventory);
        for (const [key, invItem] of entries) {
          if (removed >= sellQty) break;
          if (!invItem) continue;
          const invBaseId = extractBaseId((invItem as any).id || key);
          if (invBaseId === baseId) {
            delete inventory[key];
            removed++;
          }
        }
      }

      if (removed === 0) throw new HttpsError('not-found', 'No matching items found.');

      transaction.update(userRef, {
        tokens: (userData.tokens || 0) + (trueSellValue * removed),
        inventory: inventory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: `Sold ${removed} item(s) for ${trueSellValue * removed} GX.` };
    }

    if (action === 'COMPLETE_TOWN_QUEST') {
      const { quest, rewardFood } = payload;
      const inventory = userData.inventory || {};
      
      // Verify and remove required items
      quest.requires.forEach((req: any) => {
        let removed = 0;
        const entries = Object.entries(inventory);
        for (const [key, val] of entries) {
          if (removed >= req.qty) break;
          if ((val as any)?.id?.startsWith(req.itemId)) {
            delete inventory[key];
            removed++;
          }
        }
        if (removed < req.qty) {
          throw new HttpsError('failed-precondition', `Missing required material: ${req.itemId}`);
        }
      });

      // Add food reward
      if (rewardFood) {
        const rewardKey = `${rewardFood.id}_TOWN_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        inventory[rewardKey] = { ...rewardFood, id: rewardKey };
      }

      // Add scroll reward (auto-hunt)
      const rewardScroll = payload.rewardScroll;
      if (rewardScroll) {
        const qty = rewardScroll.qty || 1;
        for (let i = 0; i < qty; i++) {
          const key = `${rewardScroll.id}_TOWN_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          inventory[key] = { ...rewardScroll, id: key };
        }
      }

      // Add potion reward
      const rewardPotion = payload.rewardPotion;
      if (rewardPotion) {
        const qty = rewardPotion.qty || 1;
        for (let i = 0; i < qty; i++) {
          const key = `${rewardPotion.id}_TOWN_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          inventory[key] = { ...rewardPotion, id: key };
        }
      }

      // Mark quest slot as completed and rotate
      const currentSlots = [...(userData.townQuestSlots || [])].filter((id: string) => id !== quest.id);
      const completedTownQuests = userData.completedTownQuests || {};
      completedTownQuests[quest.id] = Date.now();

      // Progression
      let nextXp = (userData.crystleTownInfluenceXP || 0) + 5;
      let nextLvl = userData.crystleTownLevel || 1;
      let leveledUp = false;

      while (nextXp >= 25) {
         nextXp -= 25;
         nextLvl++;
         leveledUp = true;
      }

      transaction.update(userRef, {
        inventory,
        townQuestSlots: currentSlots,
        completedTownQuests,
        crystleTownInfluenceXP: nextXp,
        crystleTownLevel: nextLvl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, leveledUp, nextLvl, item: rewardFood ? { ...rewardFood, qty: 1 } : null };
    }

    if (action === 'EQUIP_ITEM') {
      const { itemId, slot } = payload;
      const inventory = userData.inventory || {};
      const equipped = userData.equipped || {};
      const item = inventory[itemId];

      if (!item) throw new HttpsError('not-found', 'Item not in inventory.');

      if (equipped[slot]) {
        const oldItem = equipped[slot];
        inventory[oldItem.id || `OLD_${slot}`] = oldItem;
      }

      equipped[slot] = item;
      delete inventory[itemId];

      transaction.update(userRef, {
        inventory: inventory,
        equipped: equipped,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'UNEQUIP_ITEM') {
      const { slot } = payload;
      const equipped = userData.equipped || {};
      const inventory = userData.inventory || {};
      const item = equipped[slot];

      if (!item) throw new HttpsError('failed-precondition', 'Slot is empty.');

      // SECURITY PATCH: Always generate a guaranteed-unique key to prevent key collision
      // duplication (the 'RET_slot' fallback could be overwritten on rapid concurrent calls).
      const returnKey = `${(item.id || slot).replace(/(_[a-z0-9]{4,})+$/i, '')}_RET_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      inventory[returnKey] = { ...item, id: returnKey };
      delete equipped[slot];

      transaction.update(userRef, {
        inventory: inventory,
        equipped: equipped,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'HIRE_MATE') {
      const { mateId, cost } = payload;
      // SECURITY PATCH: Validate cost is a positive integer; cap at a sane maximum.
      if (!Number.isInteger(cost) || cost <= 0 || cost > 999999)
        throw new HttpsError('invalid-argument', 'Invalid hire cost.');
      const currentTokens = userData.tokens || 0;
      if (currentTokens < cost) throw new HttpsError('failed-precondition', 'Insufficient GX.');
      if (typeof mateId !== 'string' || mateId.length > 64)
        throw new HttpsError('invalid-argument', 'Invalid mate selection.');

      transaction.update(userRef, {
        tokens: currentTokens - cost,
        hiredMate: mateId,
        buffUntil: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'SUMMON_DRAGON') {
      const { cost, summonUntil } = payload;
      // SECURITY PATCH: Validate inputs; prevent client from passing cost: 0 or negative.
      if (!Number.isInteger(cost) || cost <= 0 || cost > 999999)
        throw new HttpsError('invalid-argument', 'Invalid summon cost.');
      if (typeof summonUntil !== 'number' || summonUntil <= Date.now() || summonUntil > Date.now() + 86400000)
        throw new HttpsError('invalid-argument', 'Invalid summon duration.');
      const currentTokens = userData.tokens || 0;
      if (currentTokens < cost) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      transaction.update(userRef, {
        tokens: currentTokens - cost,
        'dragon.summonUntil': summonUntil,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'PROCESS_BOSS_HIT') {
      const { dmg, lootUpdates } = payload;
      const newTotal = (userData.totalBossDamage || 0) + dmg;
      
      const updates: any = {
        totalBossDamage: newTotal,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (lootUpdates && Object.keys(lootUpdates).length > 0) {
        const inventory = userData.inventory || {};
        Object.entries(lootUpdates).forEach(([key, val]: [string, any]) => {
          inventory[key] = val;
        });
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'PROCESS_NAGA_HIT') {
      const { warId, mySide, myUid, enemyUid, newMyHp, newEnemyHp, perfectTiming } = payload;
      
      // Basic integrity check to prevent insta-kill payloads (-99999 HP)
      if (newMyHp < 0 || newEnemyHp < 0) {
         throw new HttpsError('out-of-range', 'Negative HP values are unauthorized.');
      }
      
      const oppSide = mySide === 'defendersA' ? 'defendersB' : 'defendersA';
      const warRef = admin.firestore().collection('guild_wars').doc(warId);
      
      const momentumKey = mySide === 'defendersA' ? 'momentumA' : 'momentumB';

      transaction.update(warRef, {
        [`${mySide}.${myUid}.currentHp`]: newMyHp,
        [`${oppSide}.${enemyUid}.currentHp`]: newEnemyHp,
        [momentumKey]: admin.firestore.FieldValue.increment(perfectTiming ? 5 : 1)
      });
      
      return { success: true };
    }

    if (action === 'CLAIM_TREASURY_REWARDS') {
      const { rewards, autoTimeLeftSaved } = payload;
      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (autoTimeLeftSaved !== undefined) {
        updates.autoTimeLeftSaved = autoTimeLeftSaved;
        updates.autoUntil = 0;
      }

      if (rewards && rewards.length > 0) {
        const inventory = userData.inventory || {};
        rewards.forEach((r: any) => {
          inventory[r.id] = r;
        });
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'MARKET_LIST') {
      const { item, totalPrice, quantity } = payload;
      const baseId = item.id?.replace(/(_\d+)+$/, '');
      const inventory = userData.inventory || {};
      
      const itemsToConsume = [];
      const invEntries = Object.entries(inventory);
      for (const [key, invItem] of invEntries) {
        if ((invItem as any).id?.replace(/(_\d+)+$/, '') === baseId && itemsToConsume.length < quantity) {
          itemsToConsume.push(key);
        }
      }

      let counterDeduction = 0;
      if (itemsToConsume.length < quantity) {
        const needed = quantity - itemsToConsume.length;
        let available = 0;
        if (baseId === 'hp_potion') available = userData.potions || 0;
        else if (baseId === 'auto_scroll') available = userData.autoScrolls || 0;

        if (available >= needed) counterDeduction = needed;
        else throw new HttpsError('failed-precondition', 'Insufficient stock.');
      }

      const updates: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      itemsToConsume.forEach(key => delete inventory[key]);
      updates.inventory = inventory;

      if (counterDeduction > 0) {
        if (baseId === 'hp_potion') updates.potions = (userData.potions || 0) - counterDeduction;
        else if (baseId === 'auto_scroll') updates.autoScrolls = (userData.autoScrolls || 0) - counterDeduction;
      }

      transaction.update(userRef, updates);

      const marketRef = db.collection('marketplace').doc();
      transaction.set(marketRef, {
        sellerUid: uid,
        sellerName: userData.name,
        item: item,
        quantity: quantity,
        price: Math.max(1, Math.floor(totalPrice / quantity)),
        createdAt: Date.now()
      });
      return { success: true };
    }

    if (action === 'MARKET_PURCHASE') {
      const { listingId, qty } = payload;
      // SECURITY PATCH: Ensure qty is a positive integer. Negative qty = infinite GX exploit.
      if (!Number.isInteger(qty) || qty <= 0 || qty > 9999)
        throw new HttpsError('invalid-argument', 'Invalid purchase quantity.');
      const marketRef = db.collection('marketplace').doc(listingId);
      const marketSnap = await transaction.get(marketRef);
      if (!marketSnap.exists) throw new HttpsError('not-found', 'Item sold.');

      const listing = marketSnap.data() as any;
      if (listing.quantity < qty) throw new HttpsError('failed-precondition', 'Insufficient quantity.');

      const totalCost = listing.price * qty;
      if (totalCost < 0) throw new HttpsError('invalid-argument', 'Corrupt listing data.');
      if ((userData.tokens || 0) < totalCost) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      const payoutRef = db.collection('payouts').doc();
      transaction.set(payoutRef, {
        recipientUid: listing.sellerUid,
        amount: Math.floor(totalCost * 0.95),
        itemName: `${qty}x ${listing.item.name}`,
        buyerName: userData.name,
        createdAt: Date.now()
      });

      if (listing.quantity === qty) transaction.delete(marketRef);
      else transaction.update(marketRef, { quantity: listing.quantity - qty });

      const updates: any = {
        tokens: (userData.tokens || 0) - totalCost,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (listing.item.id?.startsWith('hp_potion')) {
        updates.potions = (userData.potions || 0) + qty;
      } else {
        const inventory = userData.inventory || {};
        for (let i = 0; i < qty; i++) {
          const uniqueId = `${listing.item.id?.replace(/(_\d+)+$/, '')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`;
          inventory[uniqueId] = { ...listing.item, id: uniqueId };
        }
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'MARKET_CANCEL') {
      const { listingId } = payload;
      const marketRef = db.collection('marketplace').doc(listingId);
      const marketSnap = await transaction.get(marketRef);
      if (!marketSnap.exists) throw new HttpsError('not-found', 'Listing missing.');

      const listing = marketSnap.data() as any;
      if (listing.sellerUid !== uid) throw new HttpsError('permission-denied', 'Not your listing.');

      transaction.delete(marketRef);

      const qty = listing.quantity || 1;
      const baseId = listing.item.id?.replace(/(_\d+)+$/, '');
      const updates: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

      if (baseId === 'hp_potion') {
        updates.potions = (userData.potions || 0) + qty;
      } else {
        const inventory = userData.inventory || {};
        for (let i = 0; i < qty; i++) {
          const uniqueId = `${baseId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`;
          inventory[uniqueId] = { ...listing.item, id: uniqueId };
        }
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'CLAIM_PAYOUTS') {
      const payoutsQuery = db.collection('payouts').where('recipientUid', '==', uid);
      const payoutsSnap = await transaction.get(payoutsQuery);
      if (payoutsSnap.empty) return { success: true, total: 0 };

      let total = 0;
      payoutsSnap.forEach(d => {
        total += d.data().amount || 0;
        transaction.delete(d.ref);
      });

      transaction.update(userRef, {
        tokens: (userData.tokens || 0) + total,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, total };
    }

    if (action === 'UPGRADE_INVENTORY_SLOTS') {
      const { method, txHash } = payload;
      const currentMax = userData.maxInventorySlots || 50;

      if (currentMax >= 120) {
        throw new HttpsError('failed-precondition', 'Maximum storage capacity of 120 slots has already been reached.');
      }

      const updates: any = {};
      const inventory = userData.inventory || {};

      // --- 1. THE F2P GRIND PATH (GX Gold) ---
      if (method === 'GX') {
        let cost = 5000;
        if (currentMax >= 100) cost = 30000;
        else if (currentMax >= 70) cost = 15000;

        if ((userData.tokens || 0) < cost) {
          throw new HttpsError('failed-precondition', 'Insufficient GX Gold. Keep grinding!');
        }
        updates.tokens = userData.tokens - cost;
      }

      // --- 2. THE WEB3 FAST-TRACK (On-Chain Tokens) ---
      else if (method === 'DWGX' || method === 'HUNT') {
        if (!txHash) {
          throw new HttpsError('invalid-argument', 'Missing blockchain transaction hash.');
        }

        const txRef = db.collection('usedTransactions').doc(txHash);
        const txSnap = await transaction.get(txRef);
        if (txSnap.exists) {
          throw new HttpsError('already-exists', 'This transaction has already been claimed.');
        }

        const isDevEnv = process.env.FUNCTIONS_EMULATOR === 'true';

        if (!isDevEnv) {
          const { ethers } = require("ethers");
          const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
          const txReceipt = await provider.getTransactionReceipt(txHash);

          if (!txReceipt || txReceipt.status !== 1) {
            throw new HttpsError('failed-precondition', 'Transaction failed or is not yet mined on Base.');
          }

          const txData = await provider.getTransaction(txHash);
          const playerAddress = userData.walletAddress?.toLowerCase();

          if (txData.from.toLowerCase() !== playerAddress) {
            throw new HttpsError('permission-denied', 'Transaction was not initiated by your connected wallet.');
          }

          const faucetAddress = "0x8dca8d7B35004630F460B85F70d1189795CDe6Fc".toLowerCase();
          
          // Verify contract matches the method token
          const expectedContract = method === 'DWGX' 
            ? "0x3038aFBd4Bde3898C3972A8E0F45de7CB7300A3A".toLowerCase() 
            : "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C".toLowerCase();
          
          if (txData.to?.toLowerCase() !== expectedContract) {
            throw new HttpsError('failed-precondition', `Invalid target contract address. Expected token contract: ${expectedContract}`);
          }

          // Parse ERC20 Transfer Input Data
          try {
            const erc20Interface = new ethers.Interface([
              "function transfer(address to, uint256 amount) public returns (bool)"
            ]);
            const parsedTx = erc20Interface.parseTransaction({ data: txData.data });
            if (!parsedTx) throw new Error("Invalid transaction input data.");
            
            const toAddress = parsedTx.args[0].toLowerCase();
            const rawAmount = parsedTx.args[1];

            // Verify receiver is the Faucet
            if (toAddress !== faucetAddress) {
              throw new HttpsError('failed-precondition', `Incorrect payment recipient. Expected faucet address: ${faucetAddress}`);
            }

            // Verify minimum required amount is transferred
            // DWGX required = 25.0, HUNT required = 10.0
            const requiredDecimals = 18; // Both use 18 decimals
            const requiredAmount = method === 'DWGX' 
              ? ethers.parseUnits("25.0", requiredDecimals) 
              : ethers.parseUnits("10.0", requiredDecimals);

            if (rawAmount < requiredAmount) {
              const formattedSent = ethers.formatUnits(rawAmount, requiredDecimals);
              const formattedReq = ethers.formatUnits(requiredAmount, requiredDecimals);
              throw new HttpsError('failed-precondition', `Insufficient payment. Sent ${formattedSent} ${method}, but requires at least ${formattedReq} ${method}.`);
            }
          } catch (err: any) {
            throw new HttpsError('failed-precondition', err.message || 'Failed to decode ERC20 transfer payload.');
          }
        }

        // T3 check (requires burning 2 Hunt Sparks if paying with HUNT)
        if (method === 'HUNT' && currentMax >= 100) {
          const sparkKeys = Object.keys(inventory).filter(k => {
            const item = inventory[k];
            return item && typeof item.id === 'string' && item.id.startsWith('hunt_spark');
          });
          if (sparkKeys.length < 2) {
            throw new HttpsError('failed-precondition', 'Requires at least 2 Hunt Sparks in your bag.');
          }
          delete inventory[sparkKeys[0]];
          delete inventory[sparkKeys[1]];
          updates.inventory = inventory;
        }

        // Mark the transaction hash as claimed
        transaction.set(txRef, { claimedBy: uid, timestamp: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        throw new HttpsError('invalid-argument', 'Invalid upgrade currency method.');
      }

      updates.maxInventorySlots = currentMax + 10;
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      transaction.update(userRef, updates);
      return { success: true, newMax: currentMax + 10 };
    }

    if (action === 'ACTIVATE_SCROLL') {
      const { selection, ms, val, view } = payload;
      const inventory = userData.inventory || {};
      const updates: any = {
        autoUntil: Date.now() + ms,
        autoMode: view || 'dungeon',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const possibleScrollIds = ['auto_scroll_12m', 'auto_scroll_9m', 'auto_scroll_6m', 'auto_scroll_3m', 'auto_scroll'];
      const targetKey = Object.keys(inventory).find(key => {
        const item = inventory[key];
        if (!item || typeof item.id !== 'string') return false;
        const itemBaseId = possibleScrollIds.find(baseId => item.id.startsWith(baseId));
        return itemBaseId === selection;
      });

      if (targetKey) {
        delete inventory[targetKey];
        updates.inventory = inventory;
      } else if ((userData.autoScrolls || 0) >= val) {
        updates.autoScrolls = (userData.autoScrolls || 0) - val;
      } else {
        throw new HttpsError('failed-precondition', 'Insufficient scrolls.');
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'USE_POTION') {
      const { selection, maxHp } = payload;
      const currentHp = userData.hp || 0;
      const resolvedMaxHp = Number(maxHp) || userData.maxHp || 150;

      if (currentHp >= resolvedMaxHp) {
        throw new HttpsError('failed-precondition', 'Already at full HP!');
      }

      const potionSpecs: Record<string, { mult: number }> = {
        'hp_potion': { mult: 0.1 },
        'mega_hp_potion': { mult: 0.5 },
        'ultra_hp_potion': { mult: 1.0 }
      };

      const spec = potionSpecs[selection];
      if (!spec) {
        throw new HttpsError('invalid-argument', 'Invalid potion selection.');
      }

      const inventory = userData.inventory || {};
      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      let hasPotion = false;
      let usedItemId: string | null = null;

      if (selection === 'hp_potion') {
        // Prefer physical inventory items (quest rewards, daily gifts) over the abstract counter.
        // This MUST match the frontend's priority to prevent phantom-slot desync.
        const targetKey = Object.keys(inventory).find(key => {
          const item = inventory[key];
          return item && typeof item.id === 'string' && item.id.startsWith('hp_potion');
        });
        if (targetKey) {
          hasPotion = true;
          usedItemId = targetKey;
        } else {
          const count = userData.potions || 0;
          if (count > 0) {
            hasPotion = true;
            updates.potions = count - 1;
          }
        }
      } else {
        const targetKey = Object.keys(inventory).find(key => {
          const item = inventory[key];
          return item && typeof item.id === 'string' && item.id.startsWith(selection);
        });
        if (targetKey) {
          hasPotion = true;
          usedItemId = targetKey;
        }
      }

      if (!hasPotion) {
        throw new HttpsError('failed-precondition', `No ${selection.replace(/_/g, ' ')}'s found in bag.`);
      }

      if (usedItemId) {
        delete inventory[usedItemId];
        updates.inventory = inventory;
      }

      const healAmt = Math.floor(resolvedMaxHp * spec.mult);
      updates.hp = Math.min(resolvedMaxHp, currentHp + healAmt);

      transaction.update(userRef, updates);
      return { success: true, hp: updates.hp };
    }

    if (action === 'CLAIM_DAILY_GIFT') {
      const now = Date.now();
      const todayKey = new Date(now).toISOString().slice(0, 10);

      // Determine last claim date key (handles Firestore Timestamp and millis)
      let lastClaimKey: string | null = null;
      if (userData.dailyGiftClaimedAt) {
        if (userData.dailyGiftClaimedAt._seconds) {
          lastClaimKey = new Date(userData.dailyGiftClaimedAt._seconds * 1000).toISOString().slice(0, 10);
        } else if (typeof userData.dailyGiftClaimedAt === 'number') {
          lastClaimKey = new Date(userData.dailyGiftClaimedAt).toISOString().slice(0, 10);
        }
      }

      if (lastClaimKey === todayKey) {
        throw new HttpsError('already-exists', 'Daily gift already claimed today. Come back at UTC midnight!');
      }

      // Award gifts atomically within the existing transaction

      transaction.update(userRef, {
        tokens: (userData.tokens || 0) + 100,
        potions: (userData.potions || 0) + 10,
        autoScrolls: (userData.autoScrolls || 0) + 10,
        dailyGiftClaimedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, message: 'Daily supply delivered!', tokens: 100, potions: 10, scrolls: 10 };
    }

    throw new HttpsError('unimplemented', 'Action Not Recognized.');
  });
};
