// Hunt System - Game-specific methods and odds
// This will be built gradually as data is provided
export const HUNT_SYSTEM = {
  "Red": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 1
    }
  },
  "Blue": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 1
    }
  },
  "Green": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 1
    }
  },
  "Yellow": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 1
    }
  },
  "Gold": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 8192, description: "Egg hatching" }
    ],
    modifiers: {
      "Shiny Charm": 0, // Not available in Gen 2
      "Shiny Parents": 128 // Changes breeding odds from 1/8192 to 1/64
    }
  },
  "Silver": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 8192, description: "Egg hatching" }
    ],
    modifiers: {
      "Shiny Charm": 0, // Not available in Gen 2
      "Shiny Parents": 128 // Changes breeding odds from 1/8192 to 1/64
    }
  },
  "Crystal": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 8192, description: "Egg hatching" },
      { name: "Odd Egg", baseOdds: 10, description: "Special egg from Day Care" }
    ],
    modifiers: {
      "Shiny Charm": 0, // Not available in Gen 2
      "Shiny Parents": 128 // Changes breeding odds from 1/8192 to 1/64
    }
  },
  "Ruby": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 3
    }
  },
  "Sapphire": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 3
    }
  },
  "Fire Red": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 3
    }
  },
  "Leaf Green": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 3
    }
  },
  "Emerald": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 3
    }
  },
  "Diamond": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 8192, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 1638, description: "Breeding with foreign Pokemon" },
      { name: "Poke Radar", baseOdds: 8192, description: "Chain encounters with radar" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 4
      // Note: Poke Radar chains have different odds based on chain length
    }
  },
  "Pearl": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 8192, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 1638, description: "Breeding with foreign Pokemon" },
      { name: "Poke Radar", baseOdds: 8192, description: "Chain encounters with radar" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 4
      // Note: Poke Radar chains have different odds based on chain length
    }
  },
  "Platinum": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 8192, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 1365, description: "Breeding with foreign Pokemon" },
      { name: "Poke Radar", baseOdds: 8192, description: "Chain encounters with radar" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 4
      // Note: Poke Radar chains have different odds based on chain length
    }
  },
  "Heart Gold": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Masuda Method", baseOdds: 1365, description: "Breeding with foreign Pokemon" },
      { name: "Headbutt Encounters", baseOdds: 8192, description: "Shaking trees for encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 4
    }
  },
  "Soul Silver": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Masuda Method", baseOdds: 1365, description: "Breeding with foreign Pokemon" },
      { name: "Headbutt Encounters", baseOdds: 8192, description: "Shaking trees for encounters" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 4
    }
  },
  "Black": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Masuda Method", baseOdds: 1365, description: "Breeding with foreign Pokemon" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 5
    }
  },
  "White": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Masuda Method", baseOdds: 1365, description: "Breeding with foreign Pokemon" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 0 // Not available in Gen 5
    }
  },
  "Black 2": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Masuda Method", baseOdds: 1365, description: "Breeding with foreign Pokemon" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 5 sequels - improves odds to 1/2731 for most methods, 1/1024 for Masuda
    }
  },
  "White 2": {
    methods: [
      { name: "Random Encounters", baseOdds: 8192, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 8192, description: "Reset at legendary encounters" },
      { name: "Masuda Method", baseOdds: 1365, description: "Breeding with foreign Pokemon" },
      { name: "Gift Pokemon", baseOdds: 8192, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 8192, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 5 sequels - improves odds to 1/2731 for most methods, 1/1024 for Masuda
    }
  },
  "X": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Poke Radar", baseOdds: 4096, description: "Chain encounters with radar" },
      { name: "Chain Fishing", baseOdds: 4096, description: "Fishing chain encounters" },
      { name: "Horde Encounters", baseOdds: 819, description: "Multiple Pokemon encounters" },
      { name: "Friend Safari", baseOdds: 819, description: "Safari zone encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 6 - triples odds, Masuda becomes 1/512, Friend Safari becomes 1/585, Horde becomes 1/273
    }
  },
  "Y": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Poke Radar", baseOdds: 4096, description: "Chain encounters with radar" },
      { name: "Chain Fishing", baseOdds: 4096, description: "Fishing chain encounters" },
      { name: "Horde Encounters", baseOdds: 819, description: "Multiple Pokemon encounters" },
      { name: "Friend Safari", baseOdds: 819, description: "Safari zone encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 6 - triples odds, Masuda becomes 1/512, Friend Safari becomes 1/585, Horde becomes 1/273
    }
  },
  "Omega Ruby": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "DexNav", baseOdds: 4096, description: "Search encounters with DexNav" },
      { name: "Chain Fishing", baseOdds: 4096, description: "Fishing chain encounters" },
      { name: "Horde Encounters", baseOdds: 819, description: "Multiple Pokemon encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 6 - triples odds
    }
  },
  "Alpha Sapphire": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "DexNav", baseOdds: 4096, description: "Search encounters with DexNav" },
      { name: "Chain Fishing", baseOdds: 4096, description: "Fishing chain encounters" },
      { name: "Horde Encounters", baseOdds: 819, description: "Multiple Pokemon encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 6 - triples odds
    }
  },
  "Sun": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "SOS", baseOdds: 4096, description: "SOS chain encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Poke Pelago", baseOdds: 4096, description: "Island exploration encounters" },
      { name: "Island Scan", baseOdds: 4096, description: "QR code scan encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 7 - triples odds
    }
  },
  "Moon": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "SOS", baseOdds: 4096, description: "SOS chain encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Poke Pelago", baseOdds: 4096, description: "Island exploration encounters" },
      { name: "Island Scan", baseOdds: 4096, description: "QR code scan encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 7 - triples odds
    }
  },
  "Ultra Sun": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "SOS", baseOdds: 4096, description: "SOS chain encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Poke Pelago", baseOdds: 4096, description: "Island exploration encounters" },
      { name: "Island Scan", baseOdds: 4096, description: "QR code scan encounters" },
      { name: "Ultra Wormholes", baseOdds: 4096, description: "Ultra Space encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 7 - triples odds
    }
  },
  "Ultra Moon": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "SOS", baseOdds: 4096, description: "SOS chain encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Poke Pelago", baseOdds: 4096, description: "Island exploration encounters" },
      { name: "Island Scan", baseOdds: 4096, description: "QR code scan encounters" },
      { name: "Ultra Wormholes", baseOdds: 4096, description: "Ultra Space encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 7 - triples odds
    }
  },
  "Let's Go Pikachu": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Catch Combo", baseOdds: 4096, description: "Chain catching encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3, // Available in Let's Go - triples odds for most methods
      "Lure Active": 2 // Doubles odds for Catch Combo and Random Encounters
    }
  },
  "Let's Go Eevee": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Catch Combo", baseOdds: 4096, description: "Chain catching encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3, // Available in Let's Go - triples odds for most methods
      "Lure Active": 2 // Doubles odds for Catch Combo and Random Encounters
    }
  },
  "Sword": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Dynamax Raids", baseOdds: 4096, description: "Max Raid Battles" },
      { name: "Dynamax Adventures", baseOdds: 300, description: "Crown Tundra adventures" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "KO Method", baseOdds: 4096, description: "Knockout chain encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 8 - triples odds
    }
  },
  "Shield": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Dynamax Raids", baseOdds: 4096, description: "Max Raid Battles" },
      { name: "Dynamax Adventures", baseOdds: 300, description: "Crown Tundra adventures" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "KO Method", baseOdds: 4096, description: "Knockout chain encounters" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 8 - triples odds
    }
  },
  "Brilliant Diamond": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Underground Diglett Hunt", baseOdds: 2048, description: "Diglett hunting in Grand Underground" },
      { name: "Poke Radar", baseOdds: 4096, description: "Chain encounters with Poke Radar" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 8 remakes - triples odds
    }
  },
  "Shining Pearl": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Underground Diglett Hunt", baseOdds: 2048, description: "Diglett hunting in Grand Underground" },
      { name: "Poke Radar", baseOdds: 4096, description: "Chain encounters with Poke Radar" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils at museums" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 3 // Available in Gen 8 remakes - triples odds
    }
  },
  "Legends Arceus": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Mass Outbreaks", baseOdds: 158, description: "Mass outbreak encounters" },
      { name: "Massive Mass Outbreaks", baseOdds: 316, description: "Massive mass outbreak encounters" },
      { name: "Space-Time Distortions", baseOdds: 4096, description: "Space-time distortion encounters" },
      { name: "Permutations", baseOdds: 4096, description: "Permutation encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" }
    ],
    modifiers: {
      "Shiny Charm": 1, // Special calculation for Legends Arceus
      "Research Lv 10": 1, // Special calculation for Legends Arceus
      "Perfect Research": 1 // Special calculation for Legends Arceus
    }
  },
  "Legends Z-A": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Soft Resets", baseOdds: 4096, description: "Reset at legendary encounters" },
      { name: "Bench Resets", baseOdds: 4096, description: "Resetting at bench encounters" },
      { name: "Fast Travels", baseOdds: 4096, description: "Fast travel encounters" },
      { name: "Hyperspaces", baseOdds: 4096, description: "Hyperspace encounters" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" },
      { name: "Fossil Revivals", baseOdds: 4096, description: "Reviving fossils" }
    ],
    modifiers: {
      "Shiny Charm": 3, // Available in Legends Z-A - triples odds (same as Scarlet/Violet)
      "Sparkling Lv 1": 2, // 2x shiny rolls (1/2048 without charm, 1/1024 with charm)
      "Sparkling Lv 2": 3, // 3x shiny rolls (1/1365 without charm, 1/819 with charm)
      "Sparkling Lv 3": 4 // 4x shiny rolls (1/1024 without charm, 1/683 with charm)
    }
  },
  "Scarlet": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Tera Raids", baseOdds: 4103, description: "Tera Raid Battles" },
      { name: "Mass Outbreaks", baseOdds: 4096, description: "Mass outbreak encounters" },
      { name: "Picnic Resets", baseOdds: 4096, description: "Resetting at picnic encounters" },
      { name: "Sandwich", baseOdds: 4096, description: "Sandwich encounter power" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 3, // Available in Gen 9 - triples odds
      "Sparkling Lv 1": 2, // 2x shiny rolls (1/2048 without charm, 1/1024 with charm)
      "Sparkling Lv 2": 3, // 3x shiny rolls (1/1365 without charm, 1/819 with charm)
      "Sparkling Lv 3": 4, // 4x shiny rolls (1/1024 without charm, 1/683 with charm)
      "Event Boosted": 1 // Special calculation for Event Outbreaks in Scarlet/Violet
    }
  },
  "Violet": {
    methods: [
      { name: "Random Encounters", baseOdds: 4096, description: "Random wild encounters" },
      { name: "Breeding", baseOdds: 4096, description: "Egg hatching" },
      { name: "Masuda Method", baseOdds: 683, description: "Breeding with foreign Pokemon" },
      { name: "Tera Raids", baseOdds: 4103, description: "Tera Raid Battles" },
      { name: "Mass Outbreaks", baseOdds: 4096, description: "Mass outbreak encounters" },
      { name: "Picnic Resets", baseOdds: 4096, description: "Resetting at picnic encounters" },
      { name: "Sandwich", baseOdds: 4096, description: "Sandwich encounter power" },
      { name: "Gift Pokemon", baseOdds: 4096, description: "Received as gifts from NPCs" }
    ],
    modifiers: {
      "Shiny Charm": 3, // Available in Gen 9 - triples odds
      "Sparkling Lv 1": 2, // 2x shiny rolls (1/2048 without charm, 1/1024 with charm)
      "Sparkling Lv 2": 3, // 3x shiny rolls (1/1365 without charm, 1/819 with charm)
      "Sparkling Lv 3": 4, // 4x shiny rolls (1/1024 without charm, 1/683 with charm)
      "Event Boosted": 1 // Special calculation for Event Outbreaks in Scarlet/Violet
    }
  },
  "GO": {
    methods: [
      { name: "Random Encounters", baseOdds: 512, description: "Wild Pokemon encounters" },
      { name: "Raid Battles", baseOdds: 20, description: "Raid battle encounters" },
      { name: "Field Research", baseOdds: 20, description: "Field research task rewards" },
      { name: "Daily Adventure Incense", baseOdds: 512, description: "Daily Adventure Incense encounters" },
      { name: "Breeding", baseOdds: 512, description: "Pokemon breeding encounters" }
    ],
    modifiers: {
      "Shiny Charm": 0, // Not available in Pokemon Go
      "Community Day": 1, // Special calculation for Community Day events
      "Raid Day": 1, // Special calculation for Raid Day events
      "Research Day": 1, // Special calculation for Research Day events
      "Galar Birds": 1, // Special calculation for Galar Birds in Daily Adventure Incense
      "Hatch Day": 1 // Special calculation for Hatch Day events
    }
  }
};

// Function to get methods for a specific game
export const getMethodsForGame = (gameName) => {
  if (!gameName || !HUNT_SYSTEM[gameName]) {
    return [];
  }
  return HUNT_SYSTEM[gameName].methods;
};

// Function to get modifiers for a specific game
export const getModifiersForGame = (gameName) => {
  if (!gameName || !HUNT_SYSTEM[gameName]) {
    return {};
  }
  return HUNT_SYSTEM[gameName].modifiers;
};

// Function to calculate final odds based on method and modifiers
export const calculateOdds = (gameName, methodName, modifiers = {}) => {
  const game = HUNT_SYSTEM[gameName];
  if (!game) return 4096;

  const method = game.methods.find(m => m.name === methodName);
  if (!method) return 4096;

  let finalOdds = method.baseOdds;

  // Apply Shiny Charm modifier
  if (modifiers.shinyCharm && game.modifiers["Shiny Charm"] > 0) {
    // Special case for Fossil Revivals - no Shiny Charm effect in Let's Go
    if (methodName === "Fossil Revivals" && (gameName === "Let's Go Pikachu" || gameName === "Let's Go Eevee")) {
      // Fossil Revivals are not affected by Shiny Charm in Let's Go
    } else if (methodName === "Gift Pokemon" && (gameName === "Let's Go Eevee" || gameName === "Let's Go Pikachu")) {
      // Gift Pokemon are not affected by Shiny Charm in Let's Go games
    } else if (methodName === "Masuda Method") {
      if (gameName === "Black 2" || gameName === "White 2") {
        finalOdds = 1024; // Masuda + Shiny Charm = 1/1024 in Black 2 and White 2
      } else if (gameName === "X" || gameName === "Y" || gameName === "Omega Ruby" || gameName === "Alpha Sapphire" || gameName === "Sun" || gameName === "Moon" || gameName === "Ultra Sun" || gameName === "Ultra Moon" || gameName === "Sword" || gameName === "Shield" || gameName === "Brilliant Diamond" || gameName === "Shining Pearl" || gameName === "Scarlet" || gameName === "Violet") {
        finalOdds = 512; // Masuda + Shiny Charm = 1/512 in Gen 6, Gen 7, Gen 8, Gen 8 remakes, and Gen 9
      } else {
        finalOdds = Math.round(finalOdds / game.modifiers["Shiny Charm"]);
      }
    } else if (methodName === "Breeding" && (gameName === "Sword" || gameName === "Shield" || gameName === "Brilliant Diamond" || gameName === "Shining Pearl" || gameName === "Scarlet" || gameName === "Violet")) {
      finalOdds = 2048; // Breeding + Shiny Charm = 1/2048 in Gen 8, Gen 8 remakes, and Gen 9
    } else if (methodName === "Underground Diglett Hunt" && (gameName === "Brilliant Diamond" || gameName === "Shining Pearl")) {
      // Underground Diglett Hunt is not affected by Shiny Charm in BD/SP
    } else if (methodName === "Dynamax Raids" && (gameName === "Sword" || gameName === "Shield")) {
      // Dynamax Raids are not affected by Shiny Charm in Gen 8
    } else if (methodName === "Dynamax Adventures" && (gameName === "Sword" || gameName === "Shield")) {
      finalOdds = 100; // Dynamax Adventures + Shiny Charm = 1/100 in Gen 8
    } else if (methodName === "Gift Pokemon" && (gameName === "Sword" || gameName === "Shield")) {
      // Gift Pokemon are not affected by Shiny Charm in Gen 8
    } else if (methodName === "Fossil Revivals" && (gameName === "Sword" || gameName === "Shield")) {
      // Fossil Revivals are not affected by Shiny Charm in Gen 8
    } else if (methodName === "Tera Raids" && (gameName === "Scarlet" || gameName === "Violet")) {
      // Tera Raids are not affected by Shiny Charm in Gen 9
    } else if (methodName === "Ultra Wormholes" && (gameName === "Ultra Sun" || gameName === "Ultra Moon")) {
      // Ultra Wormholes are not affected by Shiny Charm in Ultra Sun/Ultra Moon
    } else if ((methodName === "Random Encounters" || methodName === "Poke Radar" || methodName === "Soft Resets" || methodName === "Fossil Revivals" || methodName === "Gift Pokemon") && (gameName === "Brilliant Diamond" || gameName === "Shining Pearl")) {
      // These methods are not affected by Shiny Charm in BD/SP
    } else if (methodName === "Friend Safari" && (gameName === "X" || gameName === "Y")) {
      finalOdds = 585; // Friend Safari + Shiny Charm = 1/585 in X/Y
    } else if (methodName === "Horde Encounters" && (gameName === "X" || gameName === "Y")) {
      finalOdds = 273; // Horde Encounters + Shiny Charm = 1/273 in X/Y
    } else {
      finalOdds = Math.round(finalOdds / game.modifiers["Shiny Charm"]);
    }
  }

  // Special case for Catch Combo with both Shiny Charm and Lure Active in Let's Go
  if (methodName === "Catch Combo" && (gameName === "Let's Go Pikachu" || gameName === "Let's Go Eevee") && modifiers.shinyCharm && modifiers.lureActive) {
    finalOdds = 1024; // Catch Combo + Shiny Charm + Lure Active = 1/1024 in Let's Go
  } else if (methodName === "Random Encounters" && (gameName === "Let's Go Pikachu" || gameName === "Let's Go Eevee") && modifiers.shinyCharm && modifiers.lureActive) {
    finalOdds = 1024; // Random Encounters + Shiny Charm + Lure Active = 1/1024 in Let's Go
  } else {
    // Apply Shiny Parents modifier (for breeding)
    if (modifiers.shinyParents && game.modifiers["Shiny Parents"] > 0 && methodName === "Breeding") {
      finalOdds = Math.floor(finalOdds / game.modifiers["Shiny Parents"]);
    }

  // Apply Lure Active modifier (for Catch Combo, Random Encounters, and Soft Resets in Let's Go)
  if (modifiers.lureActive && game.modifiers["Lure Active"] > 0 && (methodName === "Catch Combo" || methodName === "Random Encounters" || methodName === "Soft Resets")) {
    finalOdds = Math.floor(finalOdds / game.modifiers["Lure Active"]);
  }

  // Special calculation for Legends Arceus based on the chart
  if (gameName === "Legends Arceus") {
    let rolls = 1; // Base rolls
    
    // Calculate rolls based on method and modifiers
    if (methodName === "Mass Outbreaks") {
      rolls = 26; // Base MO rolls
      if (modifiers.researchLv10) rolls += 1; // +1 for Research Lv 10
      if (modifiers.perfectResearch) rolls += 2; // +2 for Perfect Research
      if (modifiers.shinyCharm) {
        if (modifiers.researchLv10 && modifiers.perfectResearch) {
          rolls += 3; // +3 for Shiny Charm when both Research Lv 10 and Perfect Research are active
        } else if (modifiers.researchLv10) {
          rolls += 3; // +3 for Shiny Charm when only Research Lv 10 is active
        } else {
          rolls += 4; // +4 for Shiny Charm alone
        }
      }
    } else if (methodName === "Massive Mass Outbreaks" || methodName === "Permutations") {
      rolls = 13; // Base MMO/Permutations rolls
      if (modifiers.researchLv10) rolls += 1; // +1 for Research Lv 10
      if (modifiers.perfectResearch) rolls += 2; // +2 for Perfect Research
      if (modifiers.shinyCharm) {
        if (modifiers.researchLv10 && modifiers.perfectResearch) {
          rolls += 3; // +3 for Shiny Charm when both Research Lv 10 and Perfect Research are active
        } else if (modifiers.researchLv10) {
          rolls += 3; // +3 for Shiny Charm when only Research Lv 10 is active
        } else {
          rolls += 4; // +4 for Shiny Charm alone
        }
      }
    } else {
      // Base shiny rate methods (Random Encounters, Space-Time Distortions, Soft Resets)
      rolls = 1; // Base rolls
      if (modifiers.researchLv10) rolls += 1; // +1 for Research Lv 10
      if (modifiers.perfectResearch) rolls += 2; // +2 for Perfect Research
      if (modifiers.shinyCharm) {
        if (modifiers.researchLv10) {
          rolls += 3; // +3 for Shiny Charm when Research Lv 10 is active
        } else {
          rolls += 2; // +2 for Shiny Charm alone
        }
      }
    }
    
    // Convert rolls to odds (4096 / rolls)
    finalOdds = Math.round(4096 / rolls);
  } else if (gameName === "Legends Z-A") {
    // Special calculation for Legends Z-A
    // Fossil Revivals are always full odds (4096) regardless of Shiny Charm
    const legendsZAMethodsWithCharm = [
      "Random Encounters",
      "Soft Resets",
      "Bench Resets",
      "Fast Travels",
      "Gift Pokemon"
    ];
    
    // Hyperspaces uses Legends Z-A specific odds (different from Scarlet/Violet)
    if (methodName === "Hyperspaces") {
      // Legends Z-A specific odds
      if (modifiers.sparklingLv1) {
        finalOdds = modifiers.shinyCharm ? 820 : 2048; // 1/819.60 with charm, 1/2048.25 without
      } else if (modifiers.sparklingLv2) {
        finalOdds = modifiers.shinyCharm ? 683 : 1366; // 1/683.08 with charm, 1/1365.67 without
      } else if (modifiers.sparklingLv3) {
        finalOdds = modifiers.shinyCharm ? 586 : 1024; // 1/585.57 with charm, 1/1024.38 without
    } else {
        // No sparkling power - Shiny Charm only gives 1/1024.38 (not tripling base odds like Scarlet/Violet)
        finalOdds = modifiers.shinyCharm ? 1024 : 4096; // 1/1024.38 with charm, 1/4096 without
      }
    } else if (modifiers.shinyCharm && legendsZAMethodsWithCharm.includes(methodName)) {
      // Standard methods use simple charm calculation (reduces from 4096 to 1024)
      finalOdds = 1024;
    } else {
      finalOdds = 4096; // Base odds without Shiny Charm (or Fossil Revivals which are always full odds)
    }
  } else {
    // Apply Research Level 10 modifier (for other games if needed)
    if (modifiers.researchLv10 && game.modifiers["Research Lv 10"] > 0) {
      finalOdds = Math.floor(finalOdds / game.modifiers["Research Lv 10"]);
    }

  // Apply Perfect Research modifier (for other games if needed)
  if (modifiers.perfectResearch && game.modifiers["Perfect Research"] > 0) {
    finalOdds = Math.floor(finalOdds / game.modifiers["Perfect Research"]);
  }

  // Special calculation for Sparkling modifiers in Scarlet/Violet (for Random Encounters, Mass Outbreaks, and Sandwich)
  if ((gameName === "Scarlet" || gameName === "Violet") && (modifiers.sparklingLv1 || modifiers.sparklingLv2 || modifiers.sparklingLv3) && (methodName === "Random Encounters" || methodName === "Mass Outbreaks" || methodName === "Sandwich")) {
    if (modifiers.sparklingLv1) {
      finalOdds = modifiers.shinyCharm ? 1024 : 2048; // 1/1024 with charm, 1/2048 without
    } else if (modifiers.sparklingLv2) {
      finalOdds = modifiers.shinyCharm ? 819 : 1365; // 1/819 with charm, 1/1365 without
    } else if (modifiers.sparklingLv3) {
      finalOdds = modifiers.shinyCharm ? 683 : 1024; // 1/683 with charm, 1/1024 without
    }
  }
  }
  }

  // Special calculation for Pokemon Go event modifiers
  if (gameName === "GO") {
    if (modifiers.communityDay) {
      if (methodName === "Random Encounters") {
        finalOdds = 25; // Community Day wild encounters: 1/25
      } else if (methodName === "Raid Battles") {
        finalOdds = 10; // Community Day raids: 1/10
      } else if (methodName === "Field Research") {
        finalOdds = 10; // Community Day research: 1/10
      } else if (methodName === "Daily Adventure Incense") {
        finalOdds = 25; // Community Day Daily Adventure Incense encounters: 1/25
      }
      // Community Day does not affect Breeding (removed)
    } else if (modifiers.raidDay) {
      if (methodName === "Raid Battles") {
        finalOdds = 10; // Raid Day raids: 1/10
      }
      // Raid Day doesn't affect Random Encounters or Field Research
    } else if (modifiers.researchDay) {
      if (methodName === "Field Research") {
        finalOdds = 10; // Research Day research: 1/10
      }
      // Research Day doesn't affect Random Encounters or Raid Battles
    } else if (modifiers.galarBirds) {
      if (methodName === "Daily Adventure Incense") {
        finalOdds = 10; // Galar Birds in Daily Adventure Incense: 1/10
      }
      // Galar Birds only affects Daily Adventure Incense
    } else if (modifiers.hatchDay) {
      if (methodName === "Breeding") {
        finalOdds = 10; // Hatch Day breeding encounters: 1/10
      }
      // Hatch Day only affects Breeding
  }
  }

  return finalOdds;
};

// Function to get all available games
export const getAllGames = () => {
  return Object.keys(HUNT_SYSTEM);
};

// Function to calculate Poke Radar odds based on chain length for Diamond/Pearl/Platinum
export const calculatePokeRadarOdds = (chainLength) => {
  // Cap at chain length 40 as per Bulbapedia
  const cappedChainLength = Math.min(chainLength, 40);
  
  // Formula: [65535 / (8200 - ChainLength * 200) / 65536]
  // This gives the probability of a shiny patch appearing
  // Using the official game formula with 8200 as the base constant
  const shinyPatchProbability = (65535 / (8200 - cappedChainLength * 200)) / 65536;
  
  // Convert probability to odds (1 in X format)
  const odds = Math.round(1 / shinyPatchProbability);
  
  return odds;
};

// Function to calculate Poke Radar odds for X and Y
export const calculatePokeRadarXYOdds = (chainLength) => {
  // Cap at chain length 40
  const cappedChainLength = Math.min(chainLength, 40);
  
  // X and Y Poke Radar: starts at 1/4096, improves to 1/99 at chain 40+
  // Linear interpolation between 4096 and 99
  if (cappedChainLength === 0) {
    return 4096;
  } else if (cappedChainLength >= 40) {
    return 99;
  } else {
    // Linear interpolation: 4096 - (4096-99) * (chainLength/40)
    const improvement = (4096 - 99) * (cappedChainLength / 40);
    return Math.round(4096 - improvement);
  }
};

// Function to calculate Chain Fishing odds for X and Y
export const calculateChainFishingXYOdds = (streakLength, hasShinyCharm = false) => {
  // Cap at streak length 20
  const cappedStreakLength = Math.min(streakLength, 20);
  
  // Chain Fishing: 1 + 2 * streak_size attempts, capped at 41 attempts at streak 20+
  const attempts = Math.min(1 + 2 * cappedStreakLength, 41);
  
  // Add 2 extra attempts if Shiny Charm is active
  const totalAttempts = hasShinyCharm ? attempts + 2 : attempts;
  
  // Special case for streak 0 with Shiny Charm to get exactly 1/1365
  if (streakLength === 0 && hasShinyCharm) {
    return 1365;
  }
  
  // Calculate probability: 1 - (4095/4096)^totalAttempts
  const probability = 1 - Math.pow(4095/4096, totalAttempts);
  
  // Convert to odds (1 in X format)
  const odds = Math.round(1 / probability);
  
  return odds;
};

// Function to calculate KO method odds for Sword/Shield
export const calculateKOOdds = (koCount, hasShinyCharm = false) => {
  // KO method odds table for Sword/Shield
  const koOddsTable = [
    { kos: 1, noCharm: 2048, withCharm: 1024 },
    { kos: 50, noCharm: 1366, withCharm: 820 },
    { kos: 100, noCharm: 1025, withCharm: 683 },
    { kos: 200, noCharm: 820, withCharm: 586 },
    { kos: 300, noCharm: 683, withCharm: 512 },
    { kos: 500, noCharm: 586, withCharm: 456 }
  ];
  
  // Find the appropriate odds based on KO count
  let selectedOdds = koOddsTable[0]; // Default to first entry
  
  for (let i = koOddsTable.length - 1; i >= 0; i--) {
    if (koCount >= koOddsTable[i].kos) {
      selectedOdds = koOddsTable[i];
      break;
    }
  }
  
  return hasShinyCharm ? selectedOdds.withCharm : selectedOdds.noCharm;
};

// Function to calculate DexNav odds for Omega Ruby/Alpha Sapphire
export const calculateDexNavOdds = (searchLevel, hasShinyCharm = false) => {
  // DexNav odds table based on search level ranges
  const dexNavOddsTable = [
    { minLevel: 0, maxLevel: 0, noCharm: 4096, withCharm: 1366, multipleOf5NoCharm: 4096, multipleOf5WithCharm: 1366 },
    { minLevel: 1, maxLevel: 16, noCharm: 2906, withCharm: 969, multipleOf5NoCharm: 1344, multipleOf5WithCharm: 699 },
    { minLevel: 17, maxLevel: 33, noCharm: 2252, withCharm: 751, multipleOf5NoCharm: 804, multipleOf5WithCharm: 469 },
    { minLevel: 34, maxLevel: 50, noCharm: 1838, withCharm: 613, multipleOf5NoCharm: 574, multipleOf5WithCharm: 354 },
    { minLevel: 51, maxLevel: 66, noCharm: 1553, withCharm: 518, multipleOf5NoCharm: 446, multipleOf5WithCharm: 284 },
    { minLevel: 67, maxLevel: 83, noCharm: 1344, withCharm: 448, multipleOf5NoCharm: 365, multipleOf5WithCharm: 237 },
    { minLevel: 84, maxLevel: 100, noCharm: 1185, withCharm: 395, multipleOf5NoCharm: 309, multipleOf5WithCharm: 203 },
    { minLevel: 101, maxLevel: 150, noCharm: 1059, withCharm: 353, multipleOf5NoCharm: 267, multipleOf5WithCharm: 178 },
    { minLevel: 151, maxLevel: 200, noCharm: 958, withCharm: 320, multipleOf5NoCharm: 236, multipleOf5WithCharm: 158 },
    { minLevel: 201, maxLevel: 300, noCharm: 874, withCharm: 292, multipleOf5NoCharm: 211, multipleOf5WithCharm: 143 },
    { minLevel: 301, maxLevel: 400, noCharm: 804, withCharm: 268, multipleOf5NoCharm: 191, multipleOf5WithCharm: 130 },
    { minLevel: 401, maxLevel: 500, noCharm: 744, withCharm: 248, multipleOf5NoCharm: 175, multipleOf5WithCharm: 119 },
    { minLevel: 501, maxLevel: 600, noCharm: 693, withCharm: 231, multipleOf5NoCharm: 161, multipleOf5WithCharm: 110 },
    { minLevel: 601, maxLevel: 700, noCharm: 648, withCharm: 216, multipleOf5NoCharm: 149, multipleOf5WithCharm: 102 },
    { minLevel: 701, maxLevel: 800, noCharm: 608, withCharm: 203, multipleOf5NoCharm: 138, multipleOf5WithCharm: 95 },
    { minLevel: 801, maxLevel: 900, noCharm: 573, withCharm: 191, multipleOf5NoCharm: 130, multipleOf5WithCharm: 89 },
    { minLevel: 901, maxLevel: 999, noCharm: 542, withCharm: 181, multipleOf5NoCharm: 122, multipleOf5WithCharm: 84 }
  ];
  
  // Find the appropriate odds range for the search level
  let selectedOdds = dexNavOddsTable[0]; // Default to level 0
  
  for (let i = 0; i < dexNavOddsTable.length; i++) {
    if (searchLevel >= dexNavOddsTable[i].minLevel && searchLevel <= dexNavOddsTable[i].maxLevel) {
      selectedOdds = dexNavOddsTable[i];
      break;
    }
  }
  
  // Cap at maximum level (999)
  if (searchLevel >= 999) {
    selectedOdds = dexNavOddsTable[dexNavOddsTable.length - 1];
  }
  
  // Check if this is a multiple of 5 (excluding 0, 50, 100) and use special odds
  if (searchLevel % 5 === 0 && searchLevel !== 0 && searchLevel !== 50 && searchLevel !== 100) {
    if (!hasShinyCharm) {
      return selectedOdds.multipleOf5NoCharm;
    } else {
      return selectedOdds.multipleOf5WithCharm;
    }
  }
  
  // Use regular odds for non-multiples of 5
  return hasShinyCharm ? selectedOdds.withCharm : selectedOdds.noCharm;
};

// Function to calculate SOS method odds for Sun/Moon and Ultra Sun/Ultra Moon
export const calculateSOSOdds = (chainLength, hasShinyCharm = false) => {
  // SOS odds table based on chain length ranges
  const sosOddsTable = [
    { minChain: 0, maxChain: 10, noCharm: 4096, withCharm: 1366 },
    { minChain: 11, maxChain: 20, noCharm: 820, withCharm: 586 },
    { minChain: 21, maxChain: 30, noCharm: 456, withCharm: 373 },
    { minChain: 31, maxChain: 999, noCharm: 316, withCharm: 274 }
  ];
  
  // Find the appropriate odds range for the chain length
  let selectedOdds = sosOddsTable[0]; // Default to first range
  
  for (let i = 0; i < sosOddsTable.length; i++) {
    if (chainLength >= sosOddsTable[i].minChain && chainLength <= sosOddsTable[i].maxChain) {
      selectedOdds = sosOddsTable[i];
      break;
    }
  }
  
  // Cap at maximum chain (999)
  if (chainLength >= 999) {
    selectedOdds = sosOddsTable[sosOddsTable.length - 1];
  }
  
  return hasShinyCharm ? selectedOdds.withCharm : selectedOdds.noCharm;
};

// Function to calculate Catch Combo odds for Let's Go games
export const calculateCatchComboOdds = (comboCount, hasShinyCharm = false, hasLure = false) => {
  const catchComboOddsTable = [
    { minCombo: 0, maxCombo: 10, noCharm: 4096, withCharm: 1365, withLure: 2048, withCharmAndLure: 1024 },
    { minCombo: 11, maxCombo: 20, noCharm: 1024, withCharm: 683, withLure: 819, withCharmAndLure: 585 },
    { minCombo: 21, maxCombo: 30, noCharm: 512, withCharm: 410, withLure: 455, withCharmAndLure: 372 },
    { minCombo: 31, maxCombo: 999, noCharm: 341, withCharm: 293, withLure: 315, withCharmAndLure: 273 }
  ];
  
  let selectedOdds = catchComboOddsTable[0];
  for (let i = 0; i < catchComboOddsTable.length; i++) {
    if (comboCount >= catchComboOddsTable[i].minCombo && comboCount <= catchComboOddsTable[i].maxCombo) {
      selectedOdds = catchComboOddsTable[i];
      break;
    }
  }
  
  // Cap at maximum combo (999)
  if (comboCount >= 999) {
    selectedOdds = catchComboOddsTable[catchComboOddsTable.length - 1];
  }
  
  // Return appropriate odds based on modifiers
  if (hasShinyCharm && hasLure) {
    return selectedOdds.withCharmAndLure;
  } else if (hasShinyCharm) {
    return selectedOdds.withCharm;
  } else if (hasLure) {
    return selectedOdds.withLure;
  } else {
    return selectedOdds.noCharm;
  }
};

// Function to calculate Poke Radar odds for Brilliant Diamond/Shining Pearl
export const calculatePokeRadarBDSPOdds = (chainLength) => {
  const pokeradarBDSPOddsTable = [
    { chain: 0, odds: 4096 },
    { chain: 1, odds: 3855 },
    { chain: 2, odds: 3640 },
    { chain: 3, odds: 3449 },
    { chain: 4, odds: 3277 },
    { chain: 5, odds: 3121 },
    { chain: 6, odds: 2979 },
    { chain: 7, odds: 2849 },
    { chain: 8, odds: 2731 },
    { chain: 9, odds: 2621 },
    { chain: 10, odds: 2521 },
    { chain: 11, odds: 2427 },
    { chain: 12, odds: 2341 },
    { chain: 13, odds: 2259 },
    { chain: 14, odds: 2185 },
    { chain: 15, odds: 2114 },
    { chain: 16, odds: 2048 },
    { chain: 17, odds: 1986 },
    { chain: 18, odds: 1927 },
    { chain: 19, odds: 1872 },
    { chain: 20, odds: 1820 },
    { chain: 21, odds: 1771 },
    { chain: 22, odds: 1724 },
    { chain: 23, odds: 1680 },
    { chain: 24, odds: 1638 },
    { chain: 25, odds: 1598 },
    { chain: 26, odds: 1560 },
    { chain: 27, odds: 1524 },
    { chain: 28, odds: 1489 },
    { chain: 29, odds: 1456 },
    { chain: 30, odds: 1310 },
    { chain: 31, odds: 1285 },
    { chain: 32, odds: 1260 },
    { chain: 33, odds: 1236 },
    { chain: 34, odds: 1213 },
    { chain: 35, odds: 1192 },
    { chain: 36, odds: 993 },
    { chain: 37, odds: 799 },
    { chain: 38, odds: 400 },
    { chain: 39, odds: 200 },
    { chain: 40, odds: 99 }
  ];
  
  // Find the exact chain length or use the highest available
  let selectedOdds = pokeradarBDSPOddsTable[0]; // Default to chain 0
  
  for (let i = 0; i < pokeradarBDSPOddsTable.length; i++) {
    if (chainLength === pokeradarBDSPOddsTable[i].chain) {
      selectedOdds = pokeradarBDSPOddsTable[i];
      break;
    }
  }
  
  // For chains 40+, use the 40 chain odds
  if (chainLength >= 40) {
    selectedOdds = pokeradarBDSPOddsTable[pokeradarBDSPOddsTable.length - 1];
  }
  
  return selectedOdds.odds;
};

// Function to calculate Mass Outbreak odds for Scarlet/Violet
export const calculateMassOutbreakOdds = (checksCleared, sparklingPowerLevel = 0, hasShinyCharm = false, isEventBoosted = false) => {
  // Event Boosted odds table (from the image)
  const eventOutbreakOddsTable = [
    // No Sparkling Power (Level 0) - Event Boosted
    { sparklingLevel: 0, checksRange: "0-29", baseRolls: 1, noCharm: 191, withCharm: 175 },
    { sparklingLevel: 0, checksRange: "30-59", baseRolls: 2, noCharm: 182, withCharm: 167 },
    { sparklingLevel: 0, checksRange: "60+", baseRolls: 3, noCharm: 175, withCharm: 161 },
    
    // Sparkling Power Level 1 - Event Boosted
    { sparklingLevel: 1, checksRange: "0-29", baseRolls: 2, noCharm: 182, withCharm: 167 },
    { sparklingLevel: 1, checksRange: "30-59", baseRolls: 3, noCharm: 175, withCharm: 161 },
    { sparklingLevel: 1, checksRange: "60+", baseRolls: 4, noCharm: 167, withCharm: 155 },
    
    // Sparkling Power Level 2 - Event Boosted
    { sparklingLevel: 2, checksRange: "0-29", baseRolls: 3, noCharm: 175, withCharm: 161 },
    { sparklingLevel: 2, checksRange: "30-59", baseRolls: 4, noCharm: 167, withCharm: 155 },
    { sparklingLevel: 2, checksRange: "60+", baseRolls: 5, noCharm: 161, withCharm: 149 },
    
    // Sparkling Power Level 3 - Event Boosted
    { sparklingLevel: 3, checksRange: "0-29", baseRolls: 4, noCharm: 167, withCharm: 155 },
    { sparklingLevel: 3, checksRange: "30-59", baseRolls: 5, noCharm: 161, withCharm: 149 },
    { sparklingLevel: 3, checksRange: "60+", baseRolls: 6, noCharm: 155, withCharm: 144 }
  ];

  // Regular Mass Outbreak odds table
  const massOutbreakOddsTable = [
    // No Sparkling Power (Level 0)
    { sparklingLevel: 0, checksRange: "0-29", baseRolls: 1, noCharm: 4096, withCharm: 1366 },
    { sparklingLevel: 0, checksRange: "30-59", baseRolls: 2, noCharm: 2048, withCharm: 1024 },
    { sparklingLevel: 0, checksRange: "60+", baseRolls: 3, noCharm: 1366, withCharm: 820 },
    
    // Sparkling Power Level 1
    { sparklingLevel: 1, checksRange: "0-29", baseRolls: 2, noCharm: 2048, withCharm: 1024 },
    { sparklingLevel: 1, checksRange: "30-59", baseRolls: 3, noCharm: 1366, withCharm: 820 },
    { sparklingLevel: 1, checksRange: "60+", baseRolls: 4, noCharm: 1024, withCharm: 683 },
    
    // Sparkling Power Level 2
    { sparklingLevel: 2, checksRange: "0-29", baseRolls: 3, noCharm: 1366, withCharm: 820 },
    { sparklingLevel: 2, checksRange: "30-59", baseRolls: 4, noCharm: 1024, withCharm: 683 },
    { sparklingLevel: 2, checksRange: "60+", baseRolls: 5, noCharm: 820, withCharm: 586 },
    
    // Sparkling Power Level 3
    { sparklingLevel: 3, checksRange: "0-29", baseRolls: 4, noCharm: 1024, withCharm: 683 },
    { sparklingLevel: 3, checksRange: "30-59", baseRolls: 5, noCharm: 820, withCharm: 586 },
    { sparklingLevel: 3, checksRange: "60+", baseRolls: 6, noCharm: 683, withCharm: 512 }
  ];

  // Choose the appropriate odds table
  const oddsTable = isEventBoosted ? eventOutbreakOddsTable : massOutbreakOddsTable;
  
  // Determine checks range
  let checksRange;
  if (checksCleared >= 0 && checksCleared <= 29) {
    checksRange = "0-29";
  } else if (checksCleared >= 30 && checksCleared <= 59) {
    checksRange = "30-59";
  } else {
    checksRange = "60+";
  }
  
  // Find the matching entry
  const selectedOdds = oddsTable.find(entry => 
    entry.sparklingLevel === sparklingPowerLevel && entry.checksRange === checksRange
  );
  
  if (!selectedOdds) {
    // Fallback to no sparkling power, 0-29 range
    return hasShinyCharm ? 1366 : 4096;
  }
  
  return hasShinyCharm ? selectedOdds.withCharm : selectedOdds.noCharm;
};

// Function to get current odds for a hunt (supports dynamic odds for Poke Radar, Chain Fishing, KO method, DexNav, SOS, Catch Combo, and Mass Outbreaks)
export const getCurrentHuntOdds = (gameName, methodName, modifiers = {}, chainLength = 0) => {
  // For Poke Radar in Diamond/Pearl/Platinum, use dynamic calculation
  if (methodName === "Poke Radar" && (gameName === "Diamond" || gameName === "Pearl" || gameName === "Platinum")) {
    return calculatePokeRadarOdds(chainLength);
  }
  
  // For Poke Radar in X/Y, use dynamic calculation
  if (methodName === "Poke Radar" && (gameName === "X" || gameName === "Y")) {
    return calculatePokeRadarXYOdds(chainLength);
  }
  
  // For Poke Radar in Brilliant Diamond/Shining Pearl, use dynamic calculation
  if (methodName === "Poke Radar" && (gameName === "Brilliant Diamond" || gameName === "Shining Pearl")) {
    return calculatePokeRadarBDSPOdds(chainLength);
  }
  
  // For Chain Fishing in X/Y, use dynamic calculation
  if (methodName === "Chain Fishing" && (gameName === "X" || gameName === "Y")) {
    return calculateChainFishingXYOdds(chainLength, modifiers.shinyCharm);
  }
  
  // For Chain Fishing in Omega Ruby/Alpha Sapphire, use dynamic calculation (same as X/Y)
  if (methodName === "Chain Fishing" && (gameName === "Omega Ruby" || gameName === "Alpha Sapphire")) {
    return calculateChainFishingXYOdds(chainLength, modifiers.shinyCharm);
  }
  
  // For KO method in Sword/Shield, use dynamic calculation
  if (methodName === "KO Method" && (gameName === "Sword" || gameName === "Shield")) {
    return calculateKOOdds(chainLength, modifiers.shinyCharm);
  }
  
  // For DexNav in Omega Ruby/Alpha Sapphire, use dynamic calculation
  if (methodName === "DexNav" && (gameName === "Omega Ruby" || gameName === "Alpha Sapphire")) {
    return calculateDexNavOdds(chainLength, modifiers.shinyCharm);
  }
  
  // For SOS method in Sun/Moon and Ultra Sun/Ultra Moon, use dynamic calculation
  if (methodName === "SOS" && (gameName === "Sun" || gameName === "Moon" || gameName === "Ultra Sun" || gameName === "Ultra Moon")) {
    return calculateSOSOdds(chainLength, modifiers.shinyCharm);
  }
  
  // For Catch Combo in Let's Go games, use dynamic calculation
  if (methodName === "Catch Combo" && (gameName === "Let's Go Pikachu" || gameName === "Let's Go Eevee")) {
    return calculateCatchComboOdds(chainLength, modifiers.shinyCharm, modifiers.lureActive);
  }
  
  // For Mass Outbreaks in Scarlet/Violet, use dynamic calculation
  if (methodName === "Mass Outbreaks" && (gameName === "Scarlet" || gameName === "Violet")) {
    const sparklingLevel = modifiers.sparklingLv1 ? 1 : modifiers.sparklingLv2 ? 2 : modifiers.sparklingLv3 ? 3 : 0;
    return calculateMassOutbreakOdds(chainLength, sparklingLevel, modifiers.shinyCharm, modifiers.eventBoosted);
  }
  
  // For all other methods, use the standard calculation
  return calculateOdds(gameName, methodName, modifiers);
};

// Function to add hunt data for a game (for when you provide data)
export const addGameHuntData = (gameName, huntData) => {
  HUNT_SYSTEM[gameName] = huntData;
};