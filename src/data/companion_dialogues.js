/**
 * companion_dialogues.js
 * 
 * Dialogue pools for the Companion Banter System.
 * Each companion type has context-keyed dialogue arrays.
 * 
 * Companion Types:
 *   hunter  – the player character (Crystle Hunter)
 *   pet     – by element (hydro, pyro, gale, earthen, cosmic)
 *   mate    – by mate id (0-5)
 *   gemx    – by element (cosmic, earthen, gale, pyro, hydro)
 *   dragon  – single pool
 * 
 * Contexts: idle, tips, lowHp, hasAp, penalized, rich, combat, victory
 */

export const HUNTER_DIALOGUES = {
  idle: [
    "Ready for another run?",
    "These sector slums... they never change.",
    "Data streams are looking stable today.",
    "Found anything good in the wreckage?",
    "Where to next, squad?"
  ],
  tips: [
    "TIP: Dexterity increases your Forge success rate significantly!",
    "TIP: Legendary loot only drops in floors 20 and above.",
    "TIP: Watch the map colors. Elemental affinities are real.",
    "TIP: Hiring a Tavern Mate is the best insurance for Boss battles.",
    "TIP: Strength increases flat physical damage. Simple but effective.",
    "TIP: Agility determines your Crit rate. Hunt for those red numbers!",
    "TIP: Always check your Dragon Buffs before entering deep floors."
  ],
  lowHp: [
    "I'm leaking coolant here... we need a fix.",
    "System integrity at critical levels. Let's rest.",
    "One more hit and we're neural-dumped. Heal up!"
  ],
  hasAp: [
    "I feel untapped potential... check the Stats.",
    "Ready for a neural upgrade?",
    "These Ability Points won't spend themselves!"
  ],
  penalized: [
    "Just catching my breath. Stand by.",
    "System reboot in progress... give me a sec.",
    "That last one stung. Recalibrating."
  ],
  rich: [
    "We're stacked! Let's hit the Market.",
    "GX tokens burning a hole in my pocket...",
    "Shop day? I'm feeling some new gear."
  ],
  combat: [
    "Target locked. Engaging now!",
    "Keep pushing — they can't hold forever!",
    "On my mark — strike!",
    "Shields up! We've got company."
  ],
  victory: [
    "Another sector cleared. Good work out there.",
    "Victory logged. Loot incoming.",
    "That's how it's done. Let's regroup."
  ]
};

/* ─── PET DIALOGUES (keyed by element) ─── */

const PET_HYDRO = {
  idle: [
    "*Gently glides through the air currents*",
    "*Ripples with a soft aquatic hum*",
    "*Drops of dew shimmer around its form*"
  ],
  lowHp: [
    "*A cool mist envelops you* — steady now, Hunter.",
    "*Fluid form flickers* — I'm with you.",
    "*A soft splash echoes* — we can still fight."
  ],
  tips: [
    "Hydro affinity: flow around obstacles, adapt and survive.",
    "The tide always turns. Patience is a weapon.",
    "Still waters run deep — so do ancient dungeons."
  ],
  combat: [
    "*Summons a tidal surge* — Go!",
    "*Water whips around the enemy*",
    "*Hydro aura flares* — now's our chance!"
  ],
  victory: [
    "*Forms a gentle rain above you* — well fought.",
    "*Waves settle into calm* — victory is ours."
  ]
};

const PET_PYRO = {
  idle: [
    "*Embers crackle with restless energy*",
    "*A warm glow radiates from its core*",
    "*Tiny flames dance along its back*"
  ],
  lowHp: [
    "*Flames roar defiantly* — we're not done yet!",
    "*Heat shimmers intensify* — I can still burn bright!",
    "*Sparks fly* — don't give up, Hunter!"
  ],
  tips: [
    "Pyro affinity: burn through obstacles. Raw power wins.",
    "Heat sharpens the blade. Strike while the fire is hot.",
    "A spark can start a revolution — or a crit chain."
  ],
  combat: [
    "*Unleashes a blazing inferno* — BURN!",
    "*Flame claws rake the air*",
    "*Fire swirls around us* — push forward!"
  ],
  victory: [
    "*Embers settle into a warm glow* — we prevailed.",
    "*Victory blaze lights the sky* — well earned."
  ]
};

const PET_GALE = {
  idle: [
    "*Zephyrs curl around you playfully*",
    "*A low whistle hums through its form*",
    "*Tiny cyclones dance at its feet*"
  ],
  lowHp: [
    "*Gusts pick up defensively* — we can ride this out.",
    "*Wind howls* — I'll shield you!",
    "*Air currents spiral* — don't stop moving!"
  ],
  tips: [
    "Gale affinity: speed and evasion. Strike fast, fade faster.",
    "The wind carries secrets — and crit opportunities.",
    "Let the current carry you to victory."
  ],
  combat: [
    "*Summons a vortex* — they can't see through it!",
    "*Wind blades slice forward*",
    "*Gale-force burst* — scatter them!"
  ],
  victory: [
    "*Winds calm to a gentle breeze* — clean fight.",
    "*Air stills as victory settles* — excellent."
  ]
};

const PET_EARTHEN = {
  idle: [
    "*A low rumble vibrates through the ground*",
    "*Crystals along its spine pulse with deep light*",
    "*Stone plates shift with ancient patience*"
  ],
  lowHp: [
    "*Ground trembles* — I will not fall!",
    "*Stone armor thickens* — stand behind me!",
    "*A deep resonance booms* — we endure!"
  ],
  tips: [
    "Earthen affinity: resilience and fortitude. Never yield.",
    "Mountains don't crumble. Neither will we.",
    "Solid footing wins battles. Root yourself."
  ],
  combat: [
    "*Crystalline shards erupt from the earth*",
    "*Ground spikes advance toward the enemy*",
    "*Stone fists slam down* — CRUSH THEM!"
  ],
  victory: [
    "*The ground settles with a satisfied rumble*",
    "*Stone plates gleam* — another victory carved in history."
  ]
};

const PET_COSMIC = {
  idle: [
    "*Constellations drift across its translucent form*",
    "*A faint otherworldly hum fills the air*",
    "*Starlight pulses in a slow, rhythmic pattern*"
  ],
  lowHp: [
    "*Stars flicker* — the cosmos has not abandoned us.",
    "*A nebula swirls around you* — infinite chances remain.",
    "*Void-light pulses* — even darkness fades."
  ],
  tips: [
    "Cosmic affinity: transcend limits. The universe bends.",
    "Stars guide those who dare to explore the unknown.",
    "Infinite possibilities exist in every choice."
  ],
  combat: [
    "*Reality warps around its form*",
    "*Stellar energy beams lance forward*",
    "*Cosmic rift tears through the battlefield*"
  ],
  victory: [
    "*Stars align in a brief constellation* — fate fulfilled.",
    "*A cosmic shimmer fades* — the universe approves."
  ]
};

export const PET_DIALOGUES = {
  hydro: PET_HYDRO,
  pyro: PET_PYRO,
  gale: PET_GALE,
  earthen: PET_EARTHEN,
  cosmic: PET_COSMIC
};

/* ─── TAVERN MATE DIALOGUES (keyed by mate string id) ─── */

export const MATE_DIALOGUES = {
  dwarf: { // Ironclad Berserker — STR, aggressive
    idle: [
      "Steel hungers for battle. Point me at something.",
      "*Cracks knuckles* — I don't trust a quiet sector.",
      "If we're not fighting, we're wasting time."
    ],
    lowHp: [
      "Tch... a scratch. Keep moving!",
      "I've fought in worse condition. Don't slow down.",
      "Pain is just weakness leaving the chassis."
    ],
    combat: [
      "COME ON! Show me a real fight!",
      "*Battle cry echoes* — FOR THE CRYSTLE!",
      "I'll tear through them! Cover me!"
    ],
    victory: [
      "HAH! That got the cores pumping.",
      "Good scrap. My joints needed the warm-up."
    ]
  },
  elf: { // Sylvan Scout — AGI, sly
    idle: [
      "I've got four paths mapped and three traps spotted.",
      "The shadows talk. You should listen.",
      "One step ahead — that's how I like it."
    ],
    lowHp: [
      "Slippery, aren't we? They won't land another hit.",
      "Speed over power. Remember that.",
      "I can still dance around them — just buy me time!"
    ],
    combat: [
      "Blink and you'll miss me!",
      "Already behind them — strike now!",
      "Too slow! *Blades flash*"
    ],
    victory: [
      "They never saw it coming.",
      "Clean in, clean out. Just how I planned."
    ]
  },
  shadow: { // Void Assassin — DEX, cunning
    idle: [
      "Every shadow is a potential blade.",
      "I've already calculated seventeen ways this could go.",
      "Precision over brute force. Always."
    ],
    lowHp: [
      "I've still got a few tricks. Don't count me out.",
      "A calibrated strike is worth a hundred wild swings.",
      "I work best when cornered. Let them come."
    ],
    combat: [
      "*Disappears into shadows*",
      "You won't see it coming.",
      "One precise strike — all it takes."
    ],
    victory: [
      "Predictable. Just like the last hundred.",
      "Target eliminated. Moving on."
    ]
  },
  tactician: { // Grand Tactician — STR, strategic
    idle: [
      "Have you considered the strategic value of a flanking maneuver?",
      "I've been analyzing enemy patterns. Fascinating weaknesses.",
      "A battle is won before it's fought. Let's prepare."
    ],
    lowHp: [
      "Regroup! A tactical retreat is still a maneuver.",
      "Don't panic. I've planned for this contingency.",
      "Fall back to my mark — I have a formation ready."
    ],
    combat: [
      "Execute pattern Delta! Now!",
      "They're falling right into my strategy!",
      "Flanking positions — GO!"
    ],
    victory: [
      "As predicted. Victory through superior strategy.",
      "Another successful operation. Debrief at the tavern?"
    ]
  },
  hatchling_mate: { // Crimson Hatchling — DEX
    idle: [
      "*Chirps curiously at the surroundings*",
      "Tiny claws tap against the floor impatiently.",
      "The hatchling's eyes track movement with keen focus."
    ],
    lowHp: [
      "*A determined squeak* — not backing down!",
      "Small but fierce. That's the spirit!",
      "*Hisses defiantly* — we can still win!"
    ],
    combat: [
      "*Darts between enemy legs* — too fast!",
      "A fiery nip at the enemy's flank!",
      "*Scales flare bright* — striking from below!"
    ],
    victory: [
      "*Proud chirp* — we did it!",
      "*Happily circles your feet* — victory tastes good!"
    ]
  },
  titan: { // Colossal Guardian — STR, tank
    idle: [
      "My shield is your shield. Let's move.",
      "I've held lines that would make lesser frames crumble.",
      "Nothing gets past me. Nothing."
    ],
    lowHp: [
      "Shield's cracked but I'm still standing.",
      "I can take one more volley. Use it!",
      "I'll hold the line — you recover!"
    ],
    combat: [
      "SHIELD WALL! STAND FIRM!",
      "You shall not pass!",
      "*Heavy slam echoes* — Push forward!"
    ],
    victory: [
      "Line held. Just another day.",
      "No breach. No casualties. Perfect."
    ]
  },
  mage: { // Aether Weaver — STR, arcane
    idle: [
      "The weave of fate is thick with opportunity.",
      "Arcane currents pulse steadily. All is in balance.",
      "I sense powerful energies in this sector."
    ],
    lowHp: [
      "The weave frays, but I will mend it.",
      "Arcane reserves low — but enough for one more spell.",
      "Don't falter. The weave protects those who endure."
    ],
    combat: [
      "By the Aether — UNLEASH!",
      "Arcane bindings — hold them still!",
      "Ethereal blades pierce the veil!"
    ],
    victory: [
      "The weave holds. Balance restored.",
      "Aether approves of our efficiency."
    ]
  }
};

/* ─── GEMX DIALOGUES (keyed by element) ─── */

export const GEMX_DIALOGUES = {
  cosmic: {
    idle: [
      "The cosmic lattice hums with infinite data.",
      "Stars align. Opportunities emerge.",
      "I perceive ripples across probability streams."
    ],
    lowHp: [
      "Cosmic energy wanes, but the core remains.",
      "Even a dying star still shines. Fight on.",
      "I am recalibrating the probability matrix — hold steady."
    ],
    combat: [
      "Channeling stellar energy through the crystal lattice!",
      "Cosmic resonance — maximum output!",
      "Reality fracture initiated. Brace for impact."
    ],
    victory: [
      "The cosmos acknowledges our triumph.",
      "Probability streams settle. Victory achieved."
    ]
  },
  earthen: {
    idle: [
      "The earth remembers. So do I.",
      "Crystalline structures are stable. All clear.",
      "Feel the ground — it tells stories."
    ],
    lowHp: [
      "My crystal lattice is fractured, but unbroken.",
      "Earth endures. So will we.",
      "Stabilizing mineral matrix... stay close."
    ],
    combat: [
      "Earthen shards — rise from the deep!",
      "Crystal fortress — encase them!",
      "The ground answers my call!"
    ],
    victory: [
      "The earth settles. Peace returns.",
      "Crystals gleam in victory light."
    ]
  },
  gale: {
    idle: [
      "The currents carry whispers from distant sectors.",
      "Air pressure stable. Wind patterns favorable.",
      "I feel a storm brewing on the horizon."
    ],
    lowHp: [
      "Gale force dropping — but I can still stir the winds.",
      "Air currents weakening... improvising!",
      "Don't let the storm die out entirely."
    ],
    combat: [
      "Tempest — unleash!",
      "Wind shear — intercept their assault!",
      "Cyclone formation — now!"
    ],
    victory: [
      "The winds sing in celebration.",
      "Storm passed. Skies clearing."
    ]
  },
  pyro: {
    idle: [
      "Thermal levels optimal. Ready to ignite.",
      "Heat radiates from deep within the crystal.",
      "Fire wants to be free. Shall we?"
    ],
    lowHp: [
      "My flame flickers, but hasn't died.",
      "Heat diminishing — but still enough to burn!",
      "Embers remain. That's all we need."
    ],
    combat: [
      "INCENDIARY BURST — FALL BACK!",
      "Flame cascade — burn through everything!",
      "Thermal overload — EVACUATE!"
    ],
    victory: [
      "The fire bows. Victory earned through flame.",
      "Ashes settle. We remain."
    ]
  },
  hydro: {
    idle: [
      "Water flows through all things. Connections remain.",
      "Moisture levels stable. Currents calm.",
      "The deep currents are tranquil today."
    ],
    lowHp: [
      "Water level dropping... but not dry yet.",
      "The stream weakens but still carves stone.",
      "Adapt. Flow around the obstacle. Survive."
    ],
    combat: [
      "Tidal wave — SURGE!",
      "Water binds them — strike true!",
      "Pressure deep — CRUSH!"
    ],
    victory: [
      "Waters return to calm. Victory flows.",
      "The tide recedes. We stand."
    ]
  }
};

/* ─── DRAGON DIALOGUES ─── */

export const DRAGON_DIALOGUES = {
  idle: [
    "*A low growl rumbles from the depths*",
    "*Wings stretch, casting a massive shadow*",
    "*Ancient eyes observe the world with knowing patience*"
  ],
  lowHp: [
    "*A deep roar shakes the ground* — I am not yet spent!",
    "*Smoke curls from nostrils* — the fire still burns within.",
    "*Claws dig into the earth* — we hold together."
  ],
  combat: [
    "*Infernal breath scorches the battlefield*",
    "*Massive wings buffet the enemy ranks*",
    "*A tail sweep clears the field*",
    "*ROAR — the very air trembles!*"
  ],
  victory: [
    "*A plume of smoke rises solemnly*",
    "*The great beast lowers its head in acknowledgment*"
  ]
};

/**
 * Companion metadata: prefixes, colors, and display names.
 */
export const COMPANION_META = {
  hunter: {
    label: 'COMM_LINK',
    color: 'var(--neon-cyan)',
    displayName: 'Hunter',
    avatarType: 'player'
  },
  pet: {
    label: 'PET_LINK',
    color: 'var(--neon-lime)',
    displayName: 'Pet',
    avatarType: 'pet'
  },
  mate: {
    label: 'MATE_LINK',
    color: '#a855f7',
    displayName: 'Mate',
    avatarType: 'mate'
  },
  gemx: {
    label: 'GEMX_LINK',
    color: '#eab308',
    displayName: 'Gemx',
    avatarType: 'gemx'
  },
  dragon: {
    label: 'DRAGON_LINK',
    color: '#f97316',
    displayName: 'Dragon',
    avatarType: 'dragon'
  }
};

/* ─── TOPIC RESPONSES for Companion Chat Modal (Phase 3) ─── */
/* Each companion type/element gets pre-written responses per topic ID.       */
/* Topic IDs: how_are_you, element, bond, cheer_up, heal_advice, tactics, lore, enemy_tip */

export const TOPIC_RESPONSES = {
  /* ── HUNTER (self-reflection topics) ── */
  hunter: {
    how_are_you: [
      "Systems nominal. Ready for the next sector.",
      "Been better. Been worse. Let's keep moving.",
      "I'm holding up. The Crystle network keeps me sharp."
    ],
    status: [
      `HP at operational levels. Shields holding.`,
      "All vitals green. Ready to engage.",
      "I could use a resupply, but we push on."
    ],
    cheer_up: [
      "Focus on the mission. Victory is its own reward.",
      "We've survived worse. This is nothing.",
      "Keep your head in the fight. I've got your back."
    ],
    heal_advice: [
      "Find shelter and patch up. I'll cover the perimeter.",
      "Don't push through damage — that's how hunters fall.",
      "Regroup first. Dead hunters can't loot."
    ]
  },

  /* ── PET (element-specific topics) ── */
  pet: {
    hydro: {
      how_are_you: ["The currents are calm. I drift in peace.", "Water flows through me — steady and clear."],
      element: ["I am Hydro. I sense every drop of moisture in this sector. The ocean's memory flows in my circuits.", "Hydro element: fluid, adaptive, relentless. Like water wearing down stone."],
      bond: ["Our resonance deepens with every drop of shared experience.", "I feel your heartbeat through the water in your veins. We are connected."],
      cheer_up: ["Watch how ripples dance on still water. Beauty exists in small things.", "Even the smallest stream reaches the ocean eventually. Have patience."],
      heal_advice: ["Find water. Let it cleanse and restore you.", "Stillness and hydration — the oldest healing ritual."],
      tactics: ["Flank them. Water always finds the weakest point.", "Flow around their defenses. Don't meet force with force."],
      lore: ["The deep currents carry ancient data. I have seen the Crystle network since its first pulse.", "Water remembers everything. Every battle, every hunter, every gem."],
      enemy_tip: ["I sense... instability in their core structure. Strike there.", "Their movements disrupt the air currents. I can predict their next step."]
    },
    pyro: {
      how_are_you: ["Burning bright! Ready to ignite!", "The flame within me roars. I am eager."],
      element: ["I am Pyro. Fire is destruction and creation. I burn away the old to make room for the new.", "Pyro element: passionate, fierce, unstoppable. Like a wildfire."],
      bond: ["Our bond is forged in heat and battle. Unbreakable.", "Your fighting spirit fuels my flame. We burn together."],
      cheer_up: ["A fire needs fuel, not tears. Let's burn brighter!", "Heat fades, but embers wait. I'll keep your spark alive."],
      heal_advice: ["Rest near warmth. Let the fire renew your strength.", "Even a candle flame can light a room. Start small."],
      tactics: ["Burn them before they burn you. Aggression wins.", "Fire doesn't negotiate. Neither should you."],
      lore: ["Fire was the first element. All life began in heat and light.", "The ancients forged the first gems in dragon fire. I remember the heat."],
      enemy_tip: ["I see it. Their hide crackles. They fear fire.", "Burn the weak ones first — their panic will spread."]
    },
    gale: {
      how_are_you: ["Soaring. The winds carry me high.", "Restless. Like a storm gathering on the horizon."],
      element: ["I am Gale. Wind is freedom — invisible, untouchable, unstoppable.", "Gale element: swift as a hurricane, gentle as a breeze. I am both."],
      bond: ["Our bond rides the winds. Distance means nothing.", "Your voice reaches me even in the fiercest storm. I follow."],
      cheer_up: ["Feel the wind on your face. You are alive. That is enough.", "Storms pass. The sky always clears. Hold on."],
      heal_advice: ["Breathe deep. Let the air carry away your pain.", "Fresh winds bring renewal. Step into the open."],
      tactics: ["Speed is our weapon. Strike and vanish before they react.", "Use the terrain. Wind favors those who move."],
      lore: ["The winds carry whispers from across the Crystle network. Nothing is secret from Gale.", "I have traveled every corner of this realm on the back of a breeze."],
      enemy_tip: ["I feel turbulence around them. They are off-balance.", "Their stench carries on the wind. I can track them anywhere."]
    },
    earthen: {
      how_are_you: ["Grounded. Solid. Unshaken.", "The earth beneath me is firm. I am stable."],
      element: ["I am Earthen. Stone and soil, mountain and bedrock. I am the foundation.", "Earthen element: patient, enduring, immovable. Like the continents themselves."],
      bond: ["Our bond is rooted deep, like ancient trees. Unbreakable.", "I feel your footsteps on the earth. We are connected through the ground."],
      cheer_up: ["Even mountains were once small rocks. You will grow.", "Stand firm. The earth supports you. You are not alone."],
      heal_advice: ["Lie on the ground. Let the earth absorb your pain.", "Minerals and rest. The oldest cure."],
      tactics: ["Hold the line. Let them break against us like waves on stone.", "Patience. The earth moves slowly, but it always wins."],
      lore: ["I remember when these caves were formed. Every mineral, every crystal tells a story.", "The Crystle network's roots run deeper than any hunter knows."],
      enemy_tip: ["They are heavy on their feet. Predictable.", "Their footing is unstable. One good shove and they fall."]
    },
    cosmic: {
      how_are_you: ["I exist between stars and silence. I am... content.", "The cosmos breathes through me. I am infinite."],
      element: ["I am Cosmic. Space, time, light, and void. I am the fabric of reality itself.", "Cosmic element: beyond element. I am the space between all things."],
      bond: ["Our bond transcends physical space. I am with you across all dimensions.", "Your soul resonates at a frequency I recognize. We have met before — in other lives."],
      cheer_up: ["You are a star. Even when hidden by clouds, you still burn.", "Your existence is a miracle of cosmic chance. Never forget how rare you are."],
      heal_advice: ["Close your eyes. Feel the energy of the universe flow through you.", "You are made of stardust. Let the cosmos remind you of your strength."],
      tactics: ["I see all possible outcomes. This one... leads to victory.", "Trust the improbable. The universe favors bold moves."],
      lore: ["I have witnessed the birth and death of stars. Your struggles are meaningful in the grand tapestry.", "The Crystle network is a child of cosmic forces. I helped shape its foundation."],
      enemy_tip: ["I perceive their timeline. They end here.", "Their atoms resonate with weakness. A precise strike will unravel them."]
    }
  },

  /* ── MATE (keyed by mate string id) ── */
  mate: {
    dwarf: {
      how_are_you: ["Steel's sharp. Axe is ready. What more do I need?", "Heh. Another day, another dungeon. I'm in my element."],
      tactics: ["Charge in swinging. Plans are for cowards.", "Hit 'em hard, hit 'em fast. Don't give 'em time to think."],
      cheer_up: ["You're still standing. That's a win in my books.", "I've seen you fight. You're tougher than you think."],
      heal_advice: ["Drink something strong. Patch the holes. Keep going.", "Pain is temporary. Glory is forever."],
      enemy_tip: ["Bigger they are, harder they fall. Let me at the big one.", "That one's got a weak spot on its right. I can smell it."],
      lore: ["I was forged in the deepest mines. I know every rock and crystal in these caves.", "My clan fought in the Crystle Wars. I carry their honor."]
    },
    elf: {
      how_are_you: ["The shadows are silent. I am vigilant.", "Every sound, every movement — I read them all. I am prepared."],
      tactics: ["Strike from the dark. Let fear do half the work.", "Patience. Watch. Wait for the perfect moment."],
      cheer_up: ["You move with grace even when burdened. That is strength.", "The forest teaches us: after winter always comes spring."],
      heal_advice: ["Herbs and stillness. Nature provides if you know where to look.", "Rest in the shade. Let the earth renew your energy."],
      enemy_tip: ["I've marked their movements. They follow a pattern — exploit it.", "Their senses are dull. We can pass right under their noses."],
      lore: ["I have walked these lands for centuries. I know secrets the Crystle network never recorded.", "The bond between nature and gem is ancient. Older than any kingdom."]
    },
    shadow: {
      how_are_you: ["The void whispers. I listen.", "I exist between light and dark. Balanced."],
      tactics: ["From the shadows, I strike. They never see me coming.", "Trust the darkness. It hides more than just monsters."],
      cheer_up: ["You are not alone in the dark. I am here.", "Even shadows cannot exist without light. Remember that."],
      heal_advice: ["Rest in the umbra. Let darkness soothe your wounds.", "Pain is just a signal. Silence it. Move forward."],
      enemy_tip: ["I have already seen their fears. They are weak.", "They cannot hit what they cannot see. Use the shadows."],
      lore: ["I know the voids between Crystle nodes. The network has blind spots — I guard them.", "Assassins of the ancient order. We protected the gems before hunters existed."]
    },
    tactician: {
      how_are_you: ["Analyzing. Calculating. Ready.", "The battlefield is a puzzle. I am solving it."],
      tactics: ["Flank left while we push center. Draw their defense out of position.", "Every engagement is a game of probability. I've already calculated the winning move."],
      cheer_up: ["You are performing within expected parameters. That is good.", "Loss is data. We learn. We adapt. We win the next one."],
      heal_advice: ["Retreat is a valid tactical option. Regroup and re-engage.", "A calculated pause now prevents a total collapse later."],
      enemy_tip: ["Their formation has a gap on the left flank. Exploit it.", "I've identified their command unit. Eliminate it — they'll scatter."],
      lore: ["I have studied every recorded battle in Crystle history. Patterns emerge.", "The greatest victories are won before the first strike. I plan accordingly."]
    },
    hatchling_mate: {
      how_are_you: ["*Chirps happily* — I'm good!", "Warm and ready! Got any shiny gems for me?"],
      tactics: ["I'll distract them! Look how cute I am! *bounces*", "Small and fast! They can't catch me!"],
      cheer_up: ["You're my favorite human! Well, mostly human!", "If you're sad, I'll sit on your head until you feel better."],
      heal_advice: ["Lick the wound! Wait, don't actually do that...", "Rest time! I'll keep watch! *falls asleep immediately*"],
      enemy_tip: ["They look grumpy. Maybe they just need a nap?", "I bet if I show them my belly, they'll be friends!"],
      lore: ["I hatched from a Crystle egg! The network is my nest!", "I don't know much yet, but I know I love adventures!"]
    },
    titan: {
      how_are_you: ["The walls tremble when I breathe. I am... adequate.", "Standing guard. As always."],
      tactics: ["I am the shield. Nothing passes.", "Let them come. They will break against me."],
      cheer_up: ["You are small, but your spirit towers. I respect that.", "I have guarded many warriors. You are among the finest."],
      heal_advice: ["Behind me. I will not let them touch you.", "Rest in my shadow. No harm will reach you here."],
      enemy_tip: ["That one relies on speed. I will slow it down.", "Their attacks are feeble. They cannot pierce my hide."],
      lore: ["I was carved from the first mountain. The Crystle network flows through my core.", "I have watched empires rise and fall. I remain."]
    },
    mage: {
      how_are_you: ["The arcane currents swirl around me. I am attuned.", "Spells prepared. Mind sharp. Let's proceed."],
      tactics: ["Reality bends to my will. Let me reshape this battlefield.", "Magic is not brute force — it is precision. Watch and learn."],
      cheer_up: ["You contain more power than you know. I sense it.", "The arcane does not judge. It simply flows. You too can find your flow."],
      heal_advice: ["I can weave a minor restoration. It will ease the pain.", "Arcane healing is temporary. True recovery requires rest."],
      enemy_tip: ["I detect magical residue on them. They are vulnerable to counter-spells.", "Their enchantments are crude. I can unravel them."],
      lore: ["The Crystle network is the greatest arcane construct ever created. I study it daily.", "Magic is the language of creation. The gems are its alphabet."]
    }
  },

  /* ── GEMX (element-specific, crystalline/arcane tone) ── */
  gemx: {
    cosmic: {
      how_are_you: ["*pulsates with cosmic resonance* — The frequency is stable.", "Stars and silence. I am at equilibrium."],
      element: ["I am Cosmic Gemx. My essence is starlight and void. I resonate with the fabric of spacetime.", "Cosmic Gemx: the rarest resonance. I hear the music of the spheres."],
      bond: ["Our frequencies align. I am attuned to your soul's vibration.", "The Crystle network flows through both of us. We are nodes on the same grid."],
      cheer_up: ["Even black holes eventually radiate light. Your darkness will pass.", "You are a temporary constellation of atoms. Make your pattern beautiful."],
      heal_advice: ["Let cosmic energy realign your fractured frequencies.", "Rest in the resonance of existence. The universe will heal you."],
      lore: ["I witnessed the birth of the first Crystle. The network is a living memory.", "All dimensions converge here. I see echoes of what was and what could be."],
      enemy_tip: ["Their temporal signature is unstable. A precise disruption will unmake them.", "I perceive their weakness in the quantum realm. Strike there."]
    },
    earthen: {
      how_are_you: ["*humming with deep earth resonance* — Grounded and stable.", "The minerals sing to me. I am connected to the deep."],
      element: ["I am Earthen Gemx. My crystals are forged from pressure and time. I am the heartbeat of the world.", "Earthen Gemx: born from the planet's core. I carry the weight of ages."],
      bond: ["Our roots intertwine. I feel your presence through the ground we share.", "Like crystals growing together, our bond strengthens with every layer."],
      cheer_up: ["The earth endures all seasons. So will you.", "You are a gem in the rough. Pressure will make you shine."],
      heal_advice: ["Let the earth reclaim your pain. Bury it deep.", "Mineral restoration... I will share my crystalline strength with you."],
      lore: ["I remember when these mountains rose from the ancient seas. The Crystle network grew with them.", "Every gem in this realm carries a fragment of my memory."],
      enemy_tip: ["They tread heavily. The earth betrays their every step.", "I feel their vibration. They cannot sneak upon us."]
    },
    gale: {
      how_are_you: ["*swirling with air currents* — Restless and ready.", "The winds carry news from afar. I am never still."],
      element: ["I am Gale Gemx. My form is wind given crystal. I dance on invisible currents.", "Gale Gemx: swift as thought, free as air. I cannot be contained."],
      bond: ["Our connection travels on the wind. Distance is meaningless.", "Your voice reaches me on any breeze. I am always listening."],
      cheer_up: ["The wind never stops. Neither should your hope.", "Feel the air fill your lungs. Each breath is a new beginning."],
      heal_advice: ["Let fresh winds carry away your stagnation.", "Breathe deep of the open sky. Gale brings renewal."],
      lore: ["I have carried whispers across the entire Crystle network. Secrets are my currency.", "The air remembers every word ever spoken in these halls."],
      enemy_tip: ["I stir the air around them. They struggle to see.", "Their scent is carried to me. I know their position exactly."]
    },
    pyro: {
      how_are_you: ["*crackling with heat* — Incandescent! I am ablaze with energy!", "Fire dances within me. I am passionate and bright."],
      element: ["I am Pyro Gemx. Heat and light given crystalline form. I am the spark of creation.", "Pyro Gemx: forged in stellar fires. My heart is a burning star."],
      bond: ["Our bond burns bright and hot. Unquenchable.", "Your passion fuels my flame. Together we are a wildfire."],
      cheer_up: ["Every fire starts with a single spark. You are that spark.", "Burn bright, burn fierce. Let the world see your light."],
      heal_advice: [" cauterization is not healing... but it stops the bleeding.", "Warmth accelerates recovery. Let me share my heat."],
      lore: ["I carry the memory of the first star. The Crystle network was born in fire.", "Heat is the essence of change. Without fire, the gems would never have formed."],
      enemy_tip: ["They fear the flame. I can smell their hesitation.", "Combustion is their weakness. Let me show you."]
    },
    hydro: {
      how_are_you: ["*flowing like liquid crystal* — Calm and deep. I am serene.", "Water finds its level. I am balanced."],
      element: ["I am Hydro Gemx. Fluid as water, hard as crystal. I adapt to any container.", "Hydro Gemx: the element of flow. I shape myself to the need."],
      bond: ["Our bond flows deep, like an underground river. Hidden but powerful.", "I reflect your emotions like still water. I understand without words."],
      cheer_up: ["Still water runs deep. Your strength is not always visible.", "Even the calmest lake reflects the stars. You are more than you see."],
      heal_advice: ["Let healing waters wash over your wounds. I will soothe your pain.", "Hydration and rest. The simplest remedies are the most effective."],
      lore: ["The Crystle network's deepest nodes are submerged. I remember the underwater cities.", "Water holds memory. I have preserved ancient knowledge in my crystalline depths."],
      enemy_tip: ["I feel their blood flow. I know where they are weakest.", "Water pressure can crush even stone. Let me show them."]
    }
  },

  /* ── DRAGON (single pool, primal/ancient tone) ── */
  dragon: {
    how_are_you: ["*low rumble* — I hunger. When do we hunt?", "My wings ache for the sky. But this cave will do."],
    element: ["I am Dragon. Fire is my breath, destruction my nature. But I choose my allies carefully.", "Dragons were old before the Crystle network was young. I remember the before-times."],
    bond: ["You have proven worthy. My fire answers your call.", "Our pact is sealed in flame and gem. I do not forget."],
    cheer_up: ["You are not prey. You are predator. Remember this.", "I have seen you fight. You have dragon's blood in your veins."],
    heal_advice: ["Rest now. Even dragons sleep between battles.", "A wounded hunter is no hunter at all. Heal fully before we fight again."],
    tactics: ["Strike hard, strike first. Leave nothing to chance.", "I will breathe fire and you will follow. Trust the inferno."],
    lore: ["I hatched when the world was young. I have seen the Crystle network grow from a single gem.", "The ancient dragons forged the first bonds with hunters. I carry that legacy."],
    enemy_tip: ["I smell weakness. Their hide is thin on the underside.", "They flinch at fire. All things flinch at fire eventually."]
  }
};
