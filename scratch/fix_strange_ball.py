import os

def fix_strange_ball():
    # 1. MMOTool.jsx
    path_mmo = r'c:\Users\anton\Desktop\ultimate-dex-tracker\src\pages\MMOTool.jsx'
    with open(path_mmo, 'r', encoding='utf-8') as f:
        mmo_code = f.read()
    
    mmo_code = mmo_code.replace('"Great Ball (Hisui)","Ultra Ball (Hisui)","Origin Ball","Strange Ball"', 
                                '"Great Ball (Hisui)","Ultra Ball (Hisui)","Origin Ball"')
    mmo_code = mmo_code.replace('ball.value === "" || isHisuianBall(ball.value)',
                                'ball.value === "" || ball.value === "Strange Ball" || isHisuianBall(ball.value)')
    mmo_code = mmo_code.replace('b => b.value === "" || HISUIAN_BALLS.includes(b.value)',
                                'b => b.value === "" || b.value === "Strange Ball" || HISUIAN_BALLS.includes(b.value)')
    
    with open(path_mmo, 'w', encoding='utf-8') as f:
        f.write(mmo_code)
        
    # 2. Counters.jsx
    path_counters = r'c:\Users\anton\Desktop\ultimate-dex-tracker\src\pages\Counters.jsx'
    with open(path_counters, 'r', encoding='utf-8') as f:
        counters_code = f.read()
    
    counters_code = counters_code.replace('"Great Ball (Hisui)", "Ultra Ball (Hisui)", "Origin Ball", "Strange Ball"',
                                          '"Great Ball (Hisui)", "Ultra Ball (Hisui)", "Origin Ball"')
    counters_code = counters_code.replace('ball.value === "" || isHisuianBall(ball.value)',
                                          'ball.value === "" || ball.value === "Strange Ball" || isHisuianBall(ball.value)')
                                          
    with open(path_counters, 'w', encoding='utf-8') as f:
        f.write(counters_code)
        
    # 3. PokemonSidebar.jsx
    path_sidebar = r'c:\Users\anton\Desktop\ultimate-dex-tracker\src\components\Dex\PokemonSidebar.jsx'
    with open(path_sidebar, 'r', encoding='utf-8') as f:
        sidebar_code = f.read()
        
    sidebar_code = sidebar_code.replace('"Great Ball (Hisui)", "Ultra Ball (Hisui)", "Origin Ball", "Strange Ball"',
                                        '"Great Ball (Hisui)", "Ultra Ball (Hisui)", "Origin Ball"')
    sidebar_code = sidebar_code.replace('ball.value === "" || isHisuianBall(ball.value)',
                                        'ball.value === "" || ball.value === "Strange Ball" || isHisuianBall(ball.value)')
                                        
    with open(path_sidebar, 'w', encoding='utf-8') as f:
        f.write(sidebar_code)
        
    print("Strange ball fixes applied to all 3 files!")

fix_strange_ball()
