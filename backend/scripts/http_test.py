"""Test HTTP direct des endpoints auth."""
import urllib.request, urllib.error, json

BASE = "http://127.0.0.1:8000"

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        BASE + path, data=body,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return None, str(e)

# Test 1: login agent
print("=== Test login agent ===")
status, resp = post("/auth/agent/login", {"email": "yassine.transport@gmail.com", "mot_de_passe": "transport123"})
print(f"Status: {status}, Response: {resp}")

# Test 2: register client
print("\n=== Test register client ===")
status, resp = post("/auth/client/register", {
    "nom": "Tabete", "prenom": "Aymane",
    "telephone": "0624439639", "email": "aymanetabete@gmail.com",
    "mot_de_passe": "test1234"
})
print(f"Status: {status}, Response: {resp}")
