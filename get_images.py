import urllib.request
import urllib.parse
import re
import os
import time

items = [
    ('MATRIX-VERSA-CHEST', 'Matrix Versa Chest Press VS-S13'),
    ('MATRIX-VERSA-LATPULL', 'Matrix Versa Lat Pulldown VS-S33'),
    ('MATRIX-VERSA-ABDOMINAL', 'Matrix Versa Abdominal VS-S53'),
    ('MATRIX-VERSA-SHOULDER', 'Matrix Versa Shoulder Press VS-S23'),
    ('MATRIX-VERSA-TRICEPS', 'Matrix Versa Triceps Press VS-S42'),
    ('MATRIX-VERSA-LEGEXT', 'Matrix Versa Leg Extension VS-S71'),
    ('MATRIX-VERSA-LEGPRESS', 'Matrix Versa Leg Press VS-S70'),
    ('FULLROM-RG1039', 'Utility Bench RG1039')
]

for item_no, query in items:
    url = 'https://images.search.yahoo.com/search/images?p=' + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        # Yahoo images are inside imgurl=&quot;http...&quot;
        links = re.findall(r'imgurl=&quot;(http[^&]+)&quot;', html)
        if links:
            img_url = links[0]
            print(f"Downloading {item_no} from {img_url[:60]}...")
            
            # Buscamos la carpeta exacta del producto
            # Como renombramos las carpetas a su nombre real, tenemos que encontrar cual es.
            # Pero el archivo en uploads/productos siempre es el mismo.
            upload_path = f"uploads/productos/{item_no}-01.jpg"
            
            # Descargamos
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(img_req).read()
            
            with open(upload_path, 'wb') as f:
                f.write(img_data)
                
            # Tambien actualizar en la carpeta nuevos_productos si la encontramos
            for d in os.listdir('nuevos_productos'):
                d_path = os.path.join('nuevos_productos', d)
                if os.path.isdir(d_path):
                    internal_img = os.path.join(d_path, f"{item_no}-01.jpg")
                    if os.path.exists(internal_img):
                        with open(internal_img, 'wb') as f:
                            f.write(img_data)
        else:
            print(f"No image found for {item_no}")
    except Exception as e:
        print(f"Error {item_no}: {e}")
    time.sleep(1)
