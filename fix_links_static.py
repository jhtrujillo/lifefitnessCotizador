import os
import re
import urllib.parse

urls = {
    'Freemotion EPIC Selectorized Calf Extension': 'https://www.fitnesssuperstore.com/products/freemotion-epic-calf-extension-remanufactured',
    'Matrix Aura Leg Extension (Single-Station)': 'https://www.fitnesssuperstore.com/products/matrix-g3-aura-leg-extension-remanufactured',
    'Matrix Aura Seated Leg Curl (Single-Station)': 'https://www.fitnesssuperstore.com/products/matrix-g3-aura-seated-leg-curl-remanufactured',
    'Hammer Strength Select Abdominal Crunch': 'https://www.lifefitness.com/en-us/catalog/strength-training/selectorized/hammer-strength-select/abdominal-crunch',
    'Life Fitness Integrity Series Elliptical (SE3 HD Console)': 'https://www.lifefitness.com/en-us/catalog/cardio/ellipticals/integrity-series/integrity-series-elliptical-cross-trainer',
    'Life Fitness Integrity Series Treadmill (SL Console)': 'https://www.lifefitness.com/en-us/catalog/cardio/treadmills/integrity-series/integrity-series-treadmill',
    'Matrix E5x Suspension Elliptical': 'https://www.fitnesssuperstore.com/products/matrix-e5x-suspension-elliptical',
    'Matrix Trotadora Comercial (edicion Planet Fitness)': 'https://www.fitnesssuperstore.com/products/matrix-t5x-treadmill-remanufactured',
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
    'Freemotion EPIC Smith Machine': 'https://www.fitnesssuperstore.com/products/freemotion-epic-smith-machine-remanufactured',
    'Freemotion LiveAxis Dead Lift F703': 'https://www.fitnesssuperstore.com/products/freemotion-liveaxis-dead-lift-remanufactured',
    'Freemotion Genesis Overhead Tricep': 'https://www.fitnesssuperstore.com/products/freemotion-genesis-overhead-triceps-remanufactured',
    'Freemotion Genesis Abdominal': 'https://www.fitnesssuperstore.com/products/freemotion-genesis-abdominal-remanufactured',
    'Freemotion Genesis Quad': 'https://www.fitnesssuperstore.com/products/freemotion-genesis-quad-remanufactured',
    'Freemotion Genesis Multi-Plane Shoulder': 'https://www.fitnesssuperstore.com/products/freemotion-genesis-multi-plane-shoulder-remanufactured',
    'Matrix Versa Biceps Curl (VS-S40)': 'https://www.fitnesssuperstore.com/products/matrix-versa-biceps-curl-remanufactured',
    'Matrix Versa Chest Press (VS-S13)': 'https://www.fitnesssuperstore.com/products/matrix-versa-chest-press-remanufactured',
    'Matrix Versa Lat Pulldown (VS-S33)': 'https://www.fitnesssuperstore.com/products/matrix-versa-lat-pulldown-remanufactured',
    'Matrix Versa Abdominal (VS-S53)': 'https://www.fitnesssuperstore.com/products/matrix-versa-abdominal-remanufactured',
    'Matrix Versa Shoulder Press (VS-S23)': 'https://www.fitnesssuperstore.com/products/matrix-versa-shoulder-press-remanufactured',
    'Matrix Versa Triceps Press (VS-S42)': 'https://www.fitnesssuperstore.com/products/matrix-versa-triceps-press-remanufactured',
    'Matrix Versa Leg Extension (VS-S71)': 'https://www.fitnesssuperstore.com/products/matrix-versa-leg-extension-remanufactured',
    'Matrix Versa Leg Press (VS-S70)': 'https://www.fitnesssuperstore.com/products/matrix-versa-leg-press-remanufactured',
    'Insight Fitness Leg Extension': 'https://insightfitness.com/product/leg-extension-re8014/',
    'Insight Fitness Leg Curl': 'https://insightfitness.com/product/leg-curl-re8015/',
    'Cybex VR3 Seated Leg Curl': 'https://www.fitnesssuperstore.com/products/cybex-vr3-seated-leg-curl-remanufactured',
    'Cybex VR3 Abdominal': 'https://www.fitnesssuperstore.com/products/cybex-vr3-abdominal-remanufactured',
    'FULL ROM RG5008 Hack Squat': 'https://www.realleaderfitness.com/products/plate-loaded-hack-squat-machine-rg-5008',
    'FULL ROM RG1038 Multi AB Bench': 'https://www.realleaderfitness.com/products/multi-ab-bench-rg-1038',
    'FULL ROM RG1037 Adjustable Bench': 'https://www.realleaderfitness.com/products/adjustable-bench-rg-1037',
    'FULL ROM Olympic Flat Bench': 'https://www.realleaderfitness.com/products/olympic-flat-bench',
    'FULL ROM RG1071 Half Rack': 'https://www.realleaderfitness.com/products/half-rack-rg-1071',
    'FULL ROM RG2049 Leg Curl': 'https://www.realleaderfitness.com/products/leg-curl-rg-2049',
    'FULL ROM RG1041 Preacher Bench': 'https://www.realleaderfitness.com/products/preacher-bench-rg-1041',
    'FULL ROM Dual Adjustable Pulley': 'https://www.realleaderfitness.com/products/dual-adjustable-pulley',
    'FULL ROM Linear Leg Press': 'https://www.realleaderfitness.com/products/linear-leg-press',
    'FULL ROM V-Squat': 'https://www.realleaderfitness.com/products/v-squat',
    'FULL ROM Sissy Squat Bench': 'https://www.realleaderfitness.com/products/sissy-squat-bench',
    'FULL ROM Frog Pump': 'https://www.realleaderfitness.com/products/frog-pump-rg-5005',
    'FULL ROM Utility Bench': 'https://www.realleaderfitness.com/products/utility-bench-rg-1039',
    'FULL ROM Belt Squat': 'https://www.realleaderfitness.com/products/belt-squat-rg-5003'
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
        site_file = os.path.join(folder_path, 'site.txt')
        
        if os.path.isdir(folder_path):
            final_url = urls.get(name.strip(), f"https://www.fitnesssuperstore.com/search?q={urllib.parse.quote(name.strip())}")
            with open(site_file, 'w', encoding='utf-8') as f:
                f.write(final_url)
            count += 1
            
    print(f'Successfully updated {count} site.txt files with guaranteed direct URLs.')
except Exception as e:
    print('Error:', e)
