from playwright.sync_api import sync_playwright
import urllib.request
import os

url = "https://www.globalfitness.com/products/refurbished-cybex-jungle-gym-4-stack-multi-station"
folder_path = "nuevos_productos/Cybex Modular 4-Stack Jungle Gym"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url, wait_until='networkidle')
    
    # Eval JS to get all images on page
    images = page.evaluate('''() => {
        let imgs = document.querySelectorAll('img');
        let urls = [];
        for (let i of imgs) {
            urls.push(i.src || i.dataset.src || "");
        }
        return urls;
    }''')
    
    downloaded = 0
    for img_url in images:
        if not img_url or "logo" in img_url.lower() or "icon" in img_url.lower():
            continue
            
        if "cdn.shopify.com" in img_url or "products" in img_url.lower():
            # Sometimes shopify appends ?v= which is fine
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
                
            try:
                req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                res = urllib.request.urlopen(req).read()
                
                # Check size to avoid tiny thumbnails
                if len(res) > 20000: # greater than 20KB
                    img_num = downloaded + 2
                    save_path = os.path.join(folder_path, f"CYBEX-JUNGLE-4STACK-0{img_num}.jpg")
                    if not os.path.exists(save_path):
                        with open(save_path, 'wb') as f:
                            f.write(res)
                        print(f"Saved {save_path}")
                        downloaded += 1
                        if downloaded >= 4:
                            break
            except Exception as e:
                pass
                
    browser.close()
    if downloaded == 0:
        print("Could not find any large product images to download.")
