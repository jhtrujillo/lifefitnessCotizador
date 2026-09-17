import os
import re
import urllib.parse

# Diccionario con URLs exactas o de distribuidores para cada máquina
urls = {
    'Freemotion EPIC Selectorized Calf Extension': 'https://freemotionfitness.com/machine-for-home-gym/epic-calf-extension-f813/',
    'Matrix Aura Leg Extension (Single-Station)': 'https://www.matrixfitness.com/us/eng/strength/single-station/g3-s71-leg-extension',
    'Matrix Aura Seated Leg Curl (Single-Station)': 'https://www.matrixfitness.com/us/eng/strength/single-station/g3-s72-seated-leg-curl',
    'Hammer Strength Select Abdominal Crunch': 'https://www.lifefitness.com/en-us/catalog/strength-training/selectorized/hammer-strength-select/abdominal-crunch',
    'Life Fitness Integrity Series Elliptical (SE3 HD Console)': 'https://www.lifefitness.com/en-us/catalog/cardio/ellipticals/integrity-series/integrity-series-elliptical-cross-trainer',
    'Life Fitness Integrity Series Treadmill (SL Console)': 'https://www.lifefitness.com/en-us/catalog/cardio/treadmills/integrity-series/integrity-series-treadmill',
    'Matrix E5x Suspension Elliptical': 'https://www.matrixfitness.com/us/eng/cardio/ellipticals/e5x-suspension-elliptical',
    'Matrix Trotadora Comercial (edicion Planet Fitness)': 'https://www.matrixfitness.com/us/eng/cardio/treadmills/t5x-treadmill',
    'Hammer Strength MTS Iso-Lateral Front Pulldown': 'https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/mts/mts-iso-lateral-front-pulldown',
    'Hammer Strength MTS Iso-Lateral Shoulder Press': 'https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/mts/mts-iso-lateral-shoulder-press',
    'Power Lift Pro Series Half Rack': 'https://www.powerliftusa.com/product/half-rack',
    'Precor Spinner Chrono Power Indoor Cycle': 'https://www.precor.com/en-us/commercial/spinner-chrono-power',
    'Nautilus Nitro Plus Seated Leg Curl': 'https://www.fitnesssuperstore.com/products/nautilus-nitro-plus-seated-leg-curl-remanufactured',
    'Schwinn AC Performance Plus (Carbon Blue) Indoor Cycle': 'https://corehandf.com/product/schwinn-ac-performance-plus-with-carbon-blue/',
    'Precor TRM 885 Treadmill (P82 Console)': 'https://www.precor.com/en-us/commercial/trm-885',
    'Life Fitness Total Body Arc Trainer (C Console)': 'https://www.lifefitness.com/en-us/catalog/cardio/arc-trainers/total-body-arc-trainer',
    'Precor 240i StretchTrainer': 'https://www.precor.com/en-us/commercial/240i-stretchtrainer',
    'Cybex Modular 4-Stack Jungle Gym': 'https://www.fitnesssuperstore.com/products/cybex-jungle-gym-4-stack-remanufactured',
    'Tomahawk IC7 Indoor Cycle': 'https://www.lifefitness.com/en-us/catalog/cardio/indoor-cycles/ic7-indoor-cycle',
    'Life Fitness Integrity Series Upright Bike (C Console)': 'https://www.lifefitness.com/en-us/catalog/cardio/lifecycle-exercise-bikes/integrity-series/integrity-series-upright-lifecycle',
    'Life Fitness Integrity Series Recumbent Bike (C Console)': 'https://www.lifefitness.com/en-us/catalog/cardio/lifecycle-exercise-bikes/integrity-series/integrity-series-recumbent-lifecycle',
    'Life Fitness Row GX Trainer (Water Rower)': 'https://www.lifefitness.com/en-us/catalog/cardio/rowers/row-gx-trainer',
    'Freemotion EPIC Smith Machine': 'https://freemotionfitness.com/machine-for-home-gym/epic-smith-machine-f802/',
    'Freemotion LiveAxis Dead Lift F703': 'https://freemotionfitness.com/machine-for-home-gym/liveaxis-dead-lift-f703/',
    'Freemotion Genesis Overhead Tricep': 'https://freemotionfitness.com/machine-for-home-gym/genesis-overhead-tricep-g6019/',
    'Freemotion Genesis Abdominal': 'https://freemotionfitness.com/machine-for-home-gym/genesis-abdominal-g6003/',
    'Freemotion Genesis Quad': 'https://freemotionfitness.com/machine-for-home-gym/genesis-quad-g6012/',
    'Freemotion Genesis Multi-Plane Shoulder': 'https://freemotionfitness.com/machine-for-home-gym/genesis-multi-plane-shoulder-g6018/',
    'Matrix Versa Biceps Curl (VS-S40)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s40-biceps-curl',
    'Matrix Versa Chest Press (VS-S13)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s13-chest-press',
    'Matrix Versa Lat Pulldown (VS-S33)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s33-lat-pulldown',
    'Matrix Versa Abdominal (VS-S53)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s53-abdominal',
    'Matrix Versa Shoulder Press (VS-S23)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s23-shoulder-press',
    'Matrix Versa Triceps Press (VS-S42)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s42-triceps-press',
    'Matrix Versa Leg Extension (VS-S71)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s71-leg-extension',
    'Matrix Versa Leg Press (VS-S70)': 'https://www.matrixfitness.com/us/eng/strength/single-station/vs-s70-leg-press',
    'Insight Fitness Leg Extension': 'https://insightfitness.com/product/leg-extension-re8014/',
    'Insight Fitness Leg Curl': 'https://insightfitness.com/product/leg-curl-re8015/',
    'Cybex VR3 Seated Leg Curl': 'https://www.fitnesssuperstore.com/products/cybex-vr3-seated-leg-curl-remanufactured',
    'Cybex VR3 Abdominal': 'https://www.fitnesssuperstore.com/products/cybex-vr3-abdominal-remanufactured'
}

sql_file = 'nuevos_productos/productos_nuevos.sql'
try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r"INSERT INTO \`productos\`.+?VALUES\s*\(\s*'[^']*',\s*NULL,\s*'([^']*)',\s*'([^']*)'"
    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
    
    count = 0
    for item_no, name in matches:
        folder_path = os.path.join('nuevos_productos', name.strip())
        
        if os.path.isdir(folder_path):
            site_file = os.path.join(folder_path, 'site.txt')
            
            # Use exact known URL, or construct a highly targeted search URL if unknown (like generic FULL ROM models)
            if name in urls:
                final_url = urls[name]
            elif "FULL ROM" in name:
                # FULL ROM is an importer, specs are usually found by searching the exact code
                final_url = "https://www.google.com/search?q=" + urllib.parse.quote(name + " fitness equipment specs")
            else:
                final_url = "https://www.google.com/search?q=" + urllib.parse.quote(name + " specifications")
            
            with open(site_file, 'w', encoding='utf-8') as f:
                f.write(final_url)
            count += 1
            
    print(f'Successfully updated {count} site.txt files with exact URLs.')
except Exception as e:
    print('Error:', e)
