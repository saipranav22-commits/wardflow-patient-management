import urllib.request
import time
import sys

prev_hash = "index-BiaNHvUt.js"
print("Waiting for Render deployment to update asset hash...")
for i in range(24):
    try:
        url = f"https://wardflow-patient-management.onrender.com?_t={int(time.time())}"
        req = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "DeployCheck/1.0"})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            for line in content.splitlines():
                if 'src="/assets/index-' in line:
                    print(f"Attempt {i+1}: {line.strip()}", flush=True)
                    if prev_hash not in line:
                        print("Render deployment completed!", flush=True)
                        sys.exit(0)
    except Exception as e:
        print(f"Attempt {i+1} err: {e}", flush=True)
    time.sleep(5)

print("Timeout waiting for asset update")
