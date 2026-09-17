import os
import re
import urllib.request
import urllib.parse
import time

sql_file = 'nuevos_productos/productos_nuevos.sql'
try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r"INSERT INTO \`productos\`.+?VALUES\s*\(\s*'([^']*)',\s*NULL,\s*'([^']*)',\s*'([^']*)'"
    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
    
    print(f"Generating site.txt for {len(matches)} products...")
    
    for series, item_no, name in matches:
        folder_path = os.path.join('nuevos_productos', name)
        site_file = os.path.join(folder_path, 'site.txt')
        
        if os.path.isdir(folder_path):
            # Known manufacturer logic
            url = ""
            if "Matrix" in name:
                # e.g. Matrix Versa Chest Press (VS-S13)
                url = f"https://www.matrixfitness.com/us/eng/strength/single-station/vs-s{item_no.split('-')[-1] if '-' in item_no else item_no}"
            elif "Life Fitness" in name:
                url = "https://www.lifefitness.com/en-us/catalog/commercial-equipment"
            elif "Hammer Strength" in name:
                url = "https://www.lifefitness.com/en-us/hammer-strength"
            elif "Freemotion" in name:
                url = "https://freemotionfitness.com/"
            elif "Precor" in name:
                url = "https://www.precor.com/en-us/commercial"
            elif "FULL ROM" in name:
                url = "https://www.google.com/search?q=" + urllib.parse.quote(name)
            else:
                url = "https://www.google.com/search?q=" + urllib.parse.quote(name)

            # Escribir en site.txt
            with open(site_file, 'w', encoding='utf-8') as f:
                f.write(f"Búsqueda / Sitio Oficial para {name}:\n{url}\n")
                
    print("Done! All site.txt files created.")
except Exception as e:
    print('Error:', e)
