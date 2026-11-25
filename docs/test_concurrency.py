import urllib.request
import json
import concurrent.futures

BASE = "https://wardflow-app.onrender.com/api/patients"

def search_query(name):
    url = f"{BASE}?search={name}"
    with urllib.request.urlopen(url) as resp:
        return name, resp.status, len(json.loads(resp.read().decode("utf-8")))

names = ["Aarav", "Meera", "Deepak", "Rohan", "Priyanka"]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    results = list(ex.map(search_query, names))

print("Concurrent Search Results:")
for name, status, count in results:
    print(f"  Search '{name}': Status {status}, Results: {count}")
