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
    
    bad_domains = ['amazon', 'ebay', 'pinterest', 'facebook', 'instagram', 'youtube', 'manuals']
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }

    count = 0
    for item_no, name in matches:
        folder_path = os.path.join('nuevos_productos', name.strip())
        site_file = os.path.join(folder_path, 'site.txt')
        
        if os.path.isdir(folder_path):
            query = f"{name} specs fitness equipment"
            found_url = None
            
            try:
                # Use num_results for newer googlesearch-python
                results = list(search(query, num_results=3, sleep_interval=2))
                for url in results:
                    if any(bd in url.lower() for bd in bad_domains):
                        continue
                        
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
                    count += 1
                    
            except Exception as e:
                print(f"[ERR] {name} -> {e}")
                
    print(f"Fixed {count} working links successfully!")
except Exception as e:
    print('Error:', e)
