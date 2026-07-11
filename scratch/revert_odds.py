import re

sidebar_path = r'c:\Users\anton\Desktop\ultimate-dex-tracker\src\components\Dex\PokemonSidebar.jsx'

with open(sidebar_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the import if it exists
content = content.replace('import { getPokemonCategory } from "../../utils/pokemonCategories";\n', '')

# Replace the mangled logic back to the simple string
old_logic_pattern = r'''if \(editData\.method === "Ultra Wormholes" && \(editData\.game === "Ultra Sun" \|\| editData\.game === "Ultra Moon"\)\) \{
.*?effectiveModifiers\.isLegendary = true;
                    \}'''
new_logic = '''if (editData.method === "Ultra Wormholes" && (editData.game === "Ultra Sun" || editData.game === "Ultra Moon")) {
                      return "1% → 36%";
                    }'''

content = re.sub(old_logic_pattern, new_logic, content, flags=re.DOTALL)

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted PokemonSidebar.jsx successfully.")
