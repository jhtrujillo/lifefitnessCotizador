import os
import re
import time
from duckduckgo_search import DDGS

sql_file = 'nuevos_productos/productos_nuevos.sql'
try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r"INSERT INTO \`productos\`.+?VALUES\s*\(\s*'[^']*',\s*NULL,\s*'([^']*)',\s*'([^']*)'"
    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
    
    print(f"Finding direct links for {len(matches)} products...")
    
    bad_domains = ['amazon.', 'ebay.', 'pinterest.', 'facebook.', 'instagram.', 'youtube.', 'manuals', 'reddit.', 'alibaba.', 'aliexpress.']

    count = 0
    with DDGS() as ddgs:
        for item_no, name in matches:
            folder_path = os.path.join('nuevos_productos', name.strip())
            site_file = os.path.join(folder_path, 'site.txt')
            
            if os.path.isdir(folder_path):
                # FULL ROM is generic, better to append specific keywords so it finds a real link
                if "FULL ROM" in name:
                    query = f"{name.replace('FULL ROM', '')} {item_no} fitness equipment machine specs"
                else:
                    query = f"{name} {item_no} fitness equipment specs"
                
                found_url = None
                
                try:
                    # search DDG
                    results = list(ddgs.text(query, max_results=5))
                    for r in results:
                        url = r['href']
                        if any(bd in url.lower() for bd in bad_domains):
                            continue
                        
                        # Found a direct link
                        found_url = url
                        break
                    
                    if found_url:
                        with open(site_file, 'w', encoding='utf-8') as f:
                            f.write(found_url)
                        print(f"[OK] {name} -> {found_url}")
                        count += 1
                        
                except Exception as e:
                    print(f"[ERR] {name} -> {e}")
                    
                time.sleep(1)
                
    print(f"Successfully replaced {count} site.txt files with direct product links!")
except Exception as e:
    print('Error:', e)
