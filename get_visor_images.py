import json
import re
import urllib.request
import os
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with open('/Users/estuvar4/Downloads/catalogo_productos_con_imagenes_web.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'const PRODUCTS = (\[.*?\]);', html, re.DOTALL)
if match:
    products = json.loads(match.group(1))
    print(f'Found {len(products)} products in HTML.', flush=True)
    
    count = 0
    for p in products:
        name = p.get('Nombre del Producto', '').strip()
        item_no = p.get('Codigo (Item No)', '').strip()
        img_url = p.get('Imagen web', '').strip()
        
        if not img_url or img_url == 'null':
            continue
            
        folder_path = os.path.join('nuevos_productos', name)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path, exist_ok=True)
            
        save_path = os.path.join(folder_path, f'{item_no}-visor.jpg')
        if not os.path.exists(save_path):
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                res = urllib.request.urlopen(req, timeout=5, context=ctx).read()
                if len(res) > 1000:
                    with open(save_path, 'wb') as f:
                        f.write(res)
                    print(f'Saved {item_no} from visor', flush=True)
                    count += 1
            except Exception as e:
                print(f'Failed {item_no} - {img_url[:30]} - {e}', flush=True)
                
    print(f'Successfully downloaded {count} exact images from the viewer!', flush=True)
else:
    print('Could not find PRODUCTS array.', flush=True)
