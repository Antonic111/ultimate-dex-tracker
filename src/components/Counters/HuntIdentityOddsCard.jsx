import React from "react";
import { Info } from "lucide-react";
import { getCurrentHuntOdds } from "../../utils/huntSystem";
import { getSpriteUrl } from "../../utils/spriteUtils";
import { GAME_OPTIONS } from "../../Constants";

const getGameImage = (gameName) => {
  if (!gameName) return "";
  const match = GAME_OPTIONS.find(g => g.name.toLowerCase() === gameName.toLowerCase() || g.value?.toLowerCase() === gameName.toLowerCase());
  return match?.image || "";
};

const formatPokemonName = (name) => {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function getBestPossibleOdds(game, method) {
  if (!game) return "1 / 4,096";

  if (game === "Red" || game === "Blue" || game === "Green" || game === "Yellow") {
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Gold" || game === "Silver" || game === "Crystal") {
    if (method === "Breeding") return "1 / 64 (Shiny Parent)";
    if (method === "Odd Egg") return "1 / 10 (Odd Egg)";
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Ruby" || game === "Sapphire" || game === "Emerald" || game === "Fire Red" || game === "Leaf Green") {
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Diamond" || game === "Pearl" || game === "Platinum" || game === "Heart Gold" || game === "Soul Silver") {
    if (method === "Poke Radar" || method === "Poké Radar") return "1 / 200 (40+ Chain)";
    if (method === "Masuda Method") return "1 / 1,638 (Foreign Parent)";
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Black" || game === "White") {
    if (method === "Masuda Method") return "1 / 1,365 (Foreign Parent)";
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Black 2" || game === "White 2") {
    if (method === "Masuda Method") return "1 / 1,024 (Charm + Masuda)";
    return "1 / 2,731 (Shiny Charm)";
  }
  if (game === "X" || game === "Y") {
    if (method === "Chain Fishing") return "1 / 96 (20+ Streak + Charm)";
    if (method === "Poke Radar" || method === "Poké Radar") return "1 / 99 (40+ Chain + Charm)";
    if (method === "Friend Safari") return "1 / 585 (Flat Safari Rate + Charm)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Omega Ruby" || game === "Alpha Sapphire") {
    if (method === "Chain Fishing") return "1 / 96 (20+ Streak + Charm)";
    if (method === "DexNav") return "1 / 181 (901-999 Search + Charm)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Sun" || game === "Moon" || game.startsWith("Ultra Sun") || game.startsWith("Ultra Moon")) {
    if (method === "Ultra Wormhole" || method === "Ultra Wormholes") return "Up to 36% (~1 / 3)";
    if (method === "SOS" || method === "SOS Chaining") return "1 / 274 (31+ Chain + Charm)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game.startsWith("Let's Go") || game.startsWith("Lets GO")) {
    if (method === "Catch Combo") return "1 / 273 (31+ Streak + Lure + Charm)";
    if (method === "Random Encounters") return "1 / 1,024 (Lure + Charm)";
    if (method === "Soft Resets") return "1 / 1,365 (Shiny Charm)";
    if (method === "Fossil Revivals" || method === "Gift Pokemon") return "1 / 4,096 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Sword" || game === "Shield") {
    if (method === "Dynamax Adventures") return "1 / 100 (Shiny Charm)";
    if (method === "Masuda Method") return "1 / 512 (Foreign Parent + Charm)";
    if (method === "KO Method" || method === "Number Battled") return "1 / 456 (500+ Battled + Charm)";
    if (method === "Dynamax Raids" || method === "Fossil Revivals" || method === "Gift Pokemon") return "1 / 4,096 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Brilliant Diamond" || game === "Shining Pearl") {
    if (method === "Poke Radar" || method === "Poké Radar") return "1 / 99 (40+ Chain)";
    if (method === "Grand Underground" || method === "Underground Diglett Hunt") return "1 / 2,048 (40/40 Diglett)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    if (method === "Breeding") return "1 / 2,048 (Shiny Charm)";
    return "1 / 4,096 (Base Rate)";
  }
  if (game === "Legends Arceus") {
    if (method === "Mass Outbreaks") return "1 / 128 (Perfect + Charm + Outbreak)";
    if (method === "Massive Mass Outbreaks" || method === "Permutations") return "1 / 216 (Perfect + Charm + MMO)";
    return "1 / 585 (Perfect Research + Charm)";
  }
  if (game === "Legends Z-A") {
    if (method === "Hyperspaces") return "1 / 683 (Charm + Spark 3)";
    if (method === "Fossil Revivals") return "1 / 4,096 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Scarlet" || game === "Violet") {
    if (method === "Mass Outbreaks") return "1 / 512 (60+ KOs + Charm + Spark 3)";
    if (method === "Masuda Method") return "1 / 512 (Foreign Ditto + Charm)";
    if (method === "Sandwich / Sparkling" || method === "Sandwich") return "1 / 683 (Charm + Spark 3)";
    if (method === "Tera Raids") return "1 / 4,103 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Pokemon GO" || game === "Pokémon GO" || game === "GO") {
    if (method === "Community Day") return "1 / 25 (Active Event)";
    if (method === "Raid Day") return "1 / 10 (Event Boost)";
    return "1 / 512 (Base GO Rate)";
  }

  return "1 / 4,096";
}

function getModifierSubtext(game, method, modifiers = {}, checks = 0) {
  const parts = [];
  if (modifiers.shinyCharm) parts.push("Shiny Charm");
  if (modifiers.sparklingLv3) parts.push("Sparkling Lv 3");
  else if (modifiers.sparklingLv2) parts.push("Sparkling Lv 2");
  else if (modifiers.sparklingLv1) parts.push("Sparkling Lv 1");
  if (modifiers.eventBoosted) parts.push("Event Boosted");
  if (modifiers.lureActive) parts.push("Lure");
  if (modifiers.perfectResearch) parts.push("Perfect Research");
  else if (modifiers.researchLv10) parts.push("Research Lv 10");
  if (modifiers.shinyParents) parts.push("Shiny Parent");
  if (modifiers.communityDay) parts.push("Community Day");
  if (modifiers.raidDay) parts.push("Raid Day");
  if (parts.length === 0) return "";
  return `Active: ${parts.join(" • ")}`;
}

export default function HuntIdentityOddsCard({
  pokemon,
  game,
  method,
  modifiers = {},
  checks = 0,
  customImage = null,
  useHomeSprites = false
}) {
  const isUltraWormhole = (game === "Ultra Sun" || game === "Ultra Moon") && (method === "Ultra Wormholes" || method === "Ultra Wormhole");
  const currentOdds = getCurrentHuntOdds(game, method, modifiers, checks);
  const bestOdds = getBestPossibleOdds(game, method);
  const subtext = getModifierSubtext(game, method, modifiers, checks);

  const bestOddsNumMatch = bestOdds?.match(/1\s*\/\s*([\d,]+)/);
  const bestOddsNumber = bestOddsNumMatch ? parseInt(bestOddsNumMatch[1].replace(/,/g, ""), 10) : null;
  const isCurrentBest = isUltraWormhole || (bestOddsNumber !== null && currentOdds <= bestOddsNumber);

  return (
    <div className="hunt-odds-identity-card">
      <div className="hunt-odds-identity-left">
        <div className="hunt-odds-sprite-box">
          <img
            src={customImage || (pokemon ? getSpriteUrl(pokemon, true, useHomeSprites) : "/fallback.png")}
            alt={pokemon?.name || "Pokémon"}
            className={!useHomeSprites ? "pixelated" : ""}
            style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
            onError={(e) => { e.currentTarget.src = "/fallback.png"; }}
          />
        </div>
        <div className="hunt-odds-title-wrap">
          <h4 className="hunt-odds-pokemon-name">
            {formatPokemonName(pokemon?.name)}
          </h4>
          <div className="flex flex-col items-start gap-1.5 mt-0.5">
            <span className="hunt-odds-badge">
              {getGameImage(game) && <img src={getGameImage(game)} alt="" />}
              <span>{game || "Scarlet"}</span>
            </span>
            <span className="hunt-odds-badge">
              <span>{method || "Random Encounters"}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="hunt-odds-divider" />

      <div className="hunt-odds-identity-right">
        <span className="hunt-odds-label-top">
          Current Odds <Info size={12} className="text-gray-400" />
        </span>
        <span className="hunt-odds-large-number">
          {isUltraWormhole ? "1% – 36%" : `1 / ${currentOdds.toLocaleString()}`}
        </span>
        {subtext ? (
          <span className="hunt-odds-subtext-bottom">
            {subtext}
          </span>
        ) : null}
        {!isCurrentBest && bestOdds && (
          <span className="hunt-odds-best-subtext">
            Best Possible: {bestOdds}
          </span>
        )}
      </div>
    </div>
  );
}
