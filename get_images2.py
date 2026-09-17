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
    ('FULLROM-RG1039', 'Utility Bench')
]

for item_no, query in items:
    # Use bing images search
    url = 'https://www.bing.com/images/search?q=' + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        links = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', html)
        if links:
            img_url = links[0]
            print(f"Downloading {item_no} from {img_url[:60]}...")
            
            upload_path = f"uploads/productos/{item_no}-01.jpg"
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(img_req).read()
            
            with open(upload_path, 'wb') as f:
                f.write(img_data)
                
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
