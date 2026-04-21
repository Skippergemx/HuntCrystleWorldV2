const fs = require('fs');
const path = require('path');

const MAPS = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/maps.json'), 'utf8'));
const FOODS = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/foods.json'), 'utf8'));

const CITIZENS = [
  { name: "Viktor Kael", personality: "Merchant", personalityTag: "Smug Trader" },
  { name: "Riz", personality: "Street Kid", personalityTag: "Slum Runner" },
  { name: "Zephara", personality: "Mystic", personalityTag: "Veil Seer" },
  { name: "Gran Moros", personality: "Elder", personalityTag: "Cranky Veteran" },
  { name: "Pix-7", personality: "Tinkerer", personalityTag: "Overexcited Engineer" },
  { name: "Sgt. Vale", personality: "Soldier", personalityTag: "No-Nonsense Officer" },
  { name: "Lune", personality: "Wanderer", personalityTag: "Drifting Soul" },
  { name: "Mira Voss", personality: "Merchant", personalityTag: "Sharp Dealer" },
  { name: "Grit", personality: "Street Kid", personalityTag: "Slum Hustler" },
  { name: "Orvaan", personality: "Mystic", personalityTag: "The Hollow Reader" },
  { name: "Old Crag", personality: "Elder", personalityTag: "Grizzled Survivor" },
  { name: "Dex-9", personality: "Tinkerer", personalityTag: "Lab Escapee" },
  { name: "Commander Ash", personality: "Soldier", personalityTag: "Tactical Lead" },
  { name: "Celeste", personality: "Wanderer", personalityTag: "Quiet Nomad" },
  { name: "Corso Bane", personality: "Merchant", personalityTag: "Market King" },
  { name: "Blink", personality: "Street Kid", personalityTag: "The Fixer" },
  { name: "The Veilkeeper", personality: "Mystic", personalityTag: "Between-Walker" },
  { name: "Madame Rux", personality: "Elder", personalityTag: "Town Matriarch" },
  { name: "Sparks", personality: "Tinkerer", personalityTag: "Caffeinated Inventor" },
  { name: "Holt", personality: "Soldier", personalityTag: "Frontline Veteran" },
  { name: "Sable", personality: "Wanderer", personalityTag: "Ash-Road Drifter" },
  { name: "Lena Grey", personality: "Merchant", personalityTag: "Cold Negotiator" },
  { name: "Loco", personality: "Street Kid", personalityTag: "Chaos Agent" },
  { name: "Naavi", personality: "Mystic", personalityTag: "The Still One" },
  { name: "Iron Kam", personality: "Elder", personalityTag: "The Unmoved" },
  { name: "Bolt", personality: "Tinkerer", personalityTag: "Gear Witch" },
  { name: "Major Krix", personality: "Soldier", personalityTag: "Iron Discipline" },
  { name: "Myst", personality: "Wanderer", personalityTag: "Fog Walker" },
  { name: "Tanaka", personality: "Merchant", personalityTag: "Premium Broker" },
  { name: "Jinx", personality: "Street Kid", personalityTag: "Chaos Gremlin" }
];

const DIALOGUE_TEMPLATES = {
  Merchant: [
    "Opportunity is knocking in the {location}. If you can secure the right materials, I'll make it worth your while with a gourmet reward.",
    "The market in the {location} is highly volatile. I need specific assets to stabilize my position. Are you interested in a trade?",
    "Supply chains for the {location} are failing. Secure these goods for the town, and I'll grant you a premium food voucher."
  ],
  'Street Kid': [
    "Yo! My crew's planning something big in the {location}, but we're short on gear. Help us out and I'll hook you up with some top-tier grub.",
    "Heard you're the one who can handle the {location}. We need some items for our rooftop fort. You in or what?",
    "The elders say the {location} is off-limits, but that's where the best stuff is. Swap me these items for a real meal."
  ],
  Mystic: [
    "The energy of the {location} is shifting. I require these materials to anchor a ritual of protection for our streets.",
    "A vision came to me of the {location}. These relics are ties to a future we must secure. Will you aid the town's spirit?",
    "The veil is thin near the {location}. Bring me these resonators so I may preserve our town's memory."
  ],
  Elder: [
    "I've seen the {location} swallow many hunters. This community needs these materials to reinforce our history. Can you help?",
    "Wisdom tells me that the {location} holds many secrets. We need these supplies for the town library. For the next generation.",
    "In my youth, we respected the {location}. Today, we just need its resources to survive. Please, help an old soul."
  ],
  Tinkerer: [
    "EXCITING NEWS! I've designed a kinetic relay for the {location}, but I'm missing the core components! Help me build it!",
    "The grid is failing near the {location}. If you grab these parts, I can overclock the whole district's power! Think of the gainz!",
    "I'm working on a proto-engine that uses materials from the {location}. It's 40% safe, which is a record! Need components!"
  ],
  Soldier: [
    "Intelligence reports suggest a surge of activity in the {location}. We need materials to establish a forward observation post.",
    "Standard protocol dictates we reinforce the {location} perimeter. Secure these logistics to ensure town safety.",
    "The frontline in the {location} is shifting. We're low on supplies. Help the defense and get prioritized rations."
  ],
  Wanderer: [
    "The wind from the {location} carries a lonely tune. I want to build a shelter there for fellow travelers. Will you contribute?",
    "I've seen many towns fall, but Crystle Town has heart. Help me gather these from the {location} to keep that heart beating.",
    "The path through the {location} is treacherous. I'm leaving markers for those who follow. I need these materials to finish."
  ]
};

const quests = [];
let questId = 1;

MAPS.forEach(map => {
  const mapQuests = 20;
  for (let i = 0; i < mapQuests; i++) {
    const npcIdx = Math.floor(Math.random() * CITIZENS.length);
    const npc = CITIZENS[npcIdx];
    const template = DIALOGUE_TEMPLATES[npc.personality][Math.floor(Math.random() * DIALOGUE_TEMPLATES[npc.personality].length)];
    const dialogue = template.replace('{location}', map.name);
    
    // Pick 2-3 random items from the map's loot table
    const numReqs = 2 + Math.floor(Math.random() * 2);
    const requires = [];
    const availableLoot = [...map.lootTable];
    for (let j = 0; j < numReqs; j++) {
      if (availableLoot.length === 0) break;
      const lootIdx = Math.floor(Math.random() * availableLoot.length);
      const itemId = availableLoot.splice(lootIdx, 1)[0];
      requires.push({ itemId, qty: 2 + Math.floor(Math.random() * 4) });
    }
    
    const rewardFood = FOODS[Math.floor(Math.random() * FOODS.length)];
    
    quests.push({
      id: `quest_${String(questId++).padStart(3, '0')}`,
      npcIndex: npcIdx + 1,
      npcName: npc.name,
      personality: npc.personality,
      personalityTag: npc.personalityTag,
      dialogue,
      requires,
      reward: { foodId: rewardFood.id, qty: 1 }
    });
  }
});

fs.writeFileSync(path.join(__dirname, '../src/data/town_quests.json'), JSON.stringify(quests, null, 2), 'utf8');
console.log(`Successfully forged ${quests.length} quests across ${MAPS.length} maps!`);
