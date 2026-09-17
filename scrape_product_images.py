import os
import time
import pandas as pd
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

def download_image(img_url, save_path):
    try:
        # Handle protocol-relative URLs
        if img_url.startswith('//'):
            img_url = 'https:' + img_url
        
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        res = requests.get(img_url, headers=headers, timeout=10)
        if res.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(res.content)
            return True
    except Exception as e:
        print(f"Failed to download {img_url}: {e}")
    return False

def scrape_images():
    df = pd.read_excel('/Users/estuvar4/Downloads/listado_productos_con_fuentes_web.xlsx')
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for index, row in df.iterrows():
            item_no = row['Codigo (Item No)']
            name = row['Nombre del Producto']
            url = row['URL de informacion']
            
            # Limpiar nombre para la carpeta
            folder_name = name.strip()
            folder_path = os.path.join('nuevos_productos', folder_name)
            
            if not os.path.exists(folder_path):
                print(f"Skipping {folder_name} - Folder not found")
                continue
                
            print(f"Processing [{item_no}] {name} from {url}")
            
            try:
                page = browser.new_page()
                page.goto(url, timeout=30000, wait_until='domcontentloaded')
                
                # Scroll a bit to lazy load images
                page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
                time.sleep(2)
                
                content = page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Find all images
                imgs = soup.find_all('img')
                downloaded = 0
                
                for img in imgs:
                    src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                    if not src:
                        continue
                        
                    # Filtrar logos, iconos, etc.
                    src_lower = src.lower()
                    if any(x in src_lower for x in ['logo', 'icon', 'svg', 'thumb', 'avatar', 'banner']):
                        continue
                        
                    # Asumimos que imagenes grandes de producto terminan en jpg, png, webp o estan en carpetas /products/
                    if 'product' in src_lower or src_lower.endswith(('.jpg', '.png', '.webp', '.jpeg')):
                        # Intentar descargar
                        img_num = downloaded + 2 # Empezar desde 02 ya que 01 existe
                        save_path = os.path.join(folder_path, f"{item_no}-0{img_num}.jpg")
                        
                        # Si ya existe, saltar
                        if os.path.exists(save_path):
                            downloaded += 1
                            continue
                            
                        success = download_image(src, save_path)
                        if success:
                            downloaded += 1
                            print(f"  -> Saved {save_path}")
                            
                    if downloaded >= 3: # Limitar a 3 imagenes adicionales por maquina
                        break
                        
                page.close()
            except Exception as e:
                print(f"Error processing {url}: {e}")
                
        browser.close()

if __name__ == '__main__':
    scrape_images()
