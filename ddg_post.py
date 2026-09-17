import urllib.request
import urllib.parse
import re

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
        # duckduckgo html might have redirect links like //duckduckgo.com/l/?uddg=...
        results = []
        for l in links:
            if 'uddg=' in l:
                decoded = urllib.parse.unquote(l.split('uddg=')[1].split('&')[0])
                results.append(decoded)
            else:
                results.append(l)
        return results
    except Exception as e:
        return [str(e)]

print(search_ddg('Freemotion EPIC Calf Extension ES813')[0:3])
