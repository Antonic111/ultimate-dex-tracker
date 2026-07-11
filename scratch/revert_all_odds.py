import re

sidebar_path = r'c:\Users\anton\Desktop\ultimate-dex-tracker\src\components\Dex\PokemonSidebar.jsx'
counters_path = r'c:\Users\anton\Desktop\ultimate-dex-tracker\src\pages\Counters.jsx'

# --- Fix PokemonSidebar.jsx ---
with open(sidebar_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the import if it's there
content = content.replace('import { getPokemonCategory } from "../../utils/pokemonCategories";\n', '')

# Revert the checkbox checks
old_check = r" && !\['legendary', 'sub-legendary', 'ultra-beast'\]\.includes\(getPokemonCategory\(pokemon\)\)"
content = re.sub(old_check, "", content)

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted PokemonSidebar.jsx checkboxes.")

# --- Fix Counters.jsx ---
with open(counters_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the import
content = content.replace('\nimport { getPokemonCategory } from "../utils/pokemonCategories";', '')
content = content.replace('import { getPokemonCategory } from "../utils/pokemonCategories";\n', '')

# Revert the return string check
old_rt = '''if (huntDetails.method === "Ultra Wormholes" && (huntDetails.game === "Ultra Sun" || huntDetails.game === "Ultra Moon")) {
      if (!['legendary', 'sub-legendary', 'ultra-beast'].includes(getPokemonCategory(huntDetails.pokemon))) {
        return "ultraWormholes";
      }'''
new_rt = '''if (huntDetails.method === "Ultra Wormholes" && (huntDetails.game === "Ultra Sun" || huntDetails.game === "Ultra Moon")) {
      return "ultraWormholes";'''
content = content.replace(old_rt, new_rt)

# Revert the checkbox checks for huntDetails
old_hd = r" && !\['legendary', 'sub-legendary', 'ultra-beast'\]\.includes\(getPokemonCategory\(huntDetails\.pokemon\)\)"
content = re.sub(old_hd, "", content)

# Revert the checkbox checks for editForm
old_ef = r" && !\['legendary', 'sub-legendary', 'ultra-beast'\]\.includes\(getPokemonCategory\(editForm\.pokemon\)\)"
content = re.sub(old_ef, "", content)

# Revert getCurrentHuntOdds call
old_get_odds = '''getCurrentHuntOdds(huntDetails.game, huntDetails.method, { ...modifiers, isLegendary: ['legendary', 'sub-legendary', 'ultra-beast'].includes(getPokemonCategory(huntDetails.pokemon)) }, checkCount)'''
new_get_odds = '''getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, checkCount)'''
content = content.replace(old_get_odds, new_get_odds)

with open(counters_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted Counters.jsx successfully.")
