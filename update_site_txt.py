import json
import re
import os

html_path = '/Users/estuvar4/Downloads/catalogo_productos_con_imagenes_web.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'const PRODUCTS = (\[.*?\]);', html, re.DOTALL)
if match:
    products = json.loads(match.group(1))
    count = 0
    
    for p in products:
        name = p.get('Nombre del Producto', '').strip()
        info_url = p.get('URL de informacion', '').strip()
        
        if not name or not info_url or info_url == 'null':
            continue
            
        folder_path = os.path.join('nuevos_productos', name)
        site_path = os.path.join(folder_path, 'site.txt')
        
        if os.path.exists(folder_path):
            with open(site_path, 'w', encoding='utf-8') as f:
                f.write(info_url)
            count += 1
            
    print(f'Successfully updated {count} site.txt files with the verified URLs from the HTML viewer.')
else:
    print('Could not find PRODUCTS array in HTML.')
