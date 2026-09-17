import os
import re
import urllib.request
import urllib.parse
import time

sql_file = 'nuevos_productos/productos_nuevos.sql'

def search_ddg(query):
    url = 'https://html.duckduckgo.com/html/'
    data = urllib.parse.urlencode({'q': query}).encode('utf-8')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        links = re.findall(r'class=\"result__url\" href=\"([^\"]+)\"', html)
        results = []
        for l in links:
            if 'uddg=' in l:
                decoded = urllib.parse.unquote(l.split('uddg=')[1].split('&')[0])
                results.append(decoded)
            else:
                results.append(l)
        return results
    except Exception as e:
        return []

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r"INSERT INTO \`productos\`.+?VALUES\s*\(\s*'[^']*',\s*NULL,\s*'([^']*)',\s*'([^']*)'"
    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
    
    print(f"Finding real direct links for {len(matches)} products...")
    
    bad_domains = ['amazon.', 'ebay.', 'pinterest.', 'facebook.', 'instagram.', 'youtube.', 'manuals', 'reddit.', 'alibaba.', 'aliexpress.']

    count = 0
    for item_no, name in matches:
        folder_path = os.path.join('nuevos_productos', name.strip())
        site_file = os.path.join(folder_path, 'site.txt')
        
        if os.path.isdir(folder_path):
            query = f"{name} {item_no} specs"
            results = search_ddg(query)
            
            found_url = None
            for url in results:
                if any(bd in url.lower() for bd in bad_domains):
                    continue
                if '.pdf' in url.lower():
                    continue
                found_url = url
                break
                
            if found_url:
                with open(site_file, 'w', encoding='utf-8') as f:
                    f.write(found_url)
                print(f"[OK] {name} -> {found_url}")
                count += 1
            else:
                print(f"[WARN] No suitable link for {name}")
                
        time.sleep(1.5) # Sleep to avoid rate limiting
                
    print(f"Successfully wrote {count} real direct links!")
except Exception as e:
    print('Error:', e)
