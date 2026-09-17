import os
import re
import time
from googlesearch import search
import requests

sql_file = 'nuevos_productos/productos_nuevos.sql'
try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r"INSERT INTO \`productos\`.+?VALUES\s*\(\s*'[^']*',\s*NULL,\s*'([^']*)',\s*'([^']*)'"
    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
    
    print(f"Fixing URLs for {len(matches)} products...")
    
    # Common bad domains that might require auth or are just aggregators
    bad_domains = ['amazon', 'ebay', 'pinterest', 'facebook', 'instagram', 'youtube']
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    count = 0
    for item_no, name in matches:
        folder_path = os.path.join('nuevos_productos', name.strip())
        site_file = os.path.join(folder_path, 'site.txt')
        
        if os.path.isdir(folder_path):
            query = f"{name} fitness equipment specs"
            found_url = None
            
            try:
                # Get top 3 results from google
                results = list(search(query, num=3, stop=3, pause=2))
                for url in results:
                    # Skip bad domains
                    if any(bd in url.lower() for bd in bad_domains):
                        continue
                        
                    # Validate URL works
                    try:
                        res = requests.head(url, headers=headers, timeout=5, allow_redirects=True)
                        if res.status_code < 400:
                            found_url = url
                            break
                    except:
                        pass
                
                if found_url:
                    with open(site_file, 'w', encoding='utf-8') as f:
                        f.write(found_url)
                    print(f"[OK] {name} -> {found_url}")
                    count += 1
                else:
                    print(f"[FAIL] {name} -> No working URL found, keeping fallback.")
                    
            except Exception as e:
                print(f"[ERR] {name} -> Google search failed: {e}")
                
            time.sleep(2) # be nice to google
            
    print(f"Fixed {count} working links successfully!")
except Exception as e:
    print('Error:', e)
