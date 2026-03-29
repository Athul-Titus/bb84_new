import requests
import time

# Wait for server startup when run right after backend launch
time.sleep(2)

BASE_URL = "http://127.0.0.1:5000"

print("--- Testing DBS Synchronization Metrics ---")

print("1. Generating Alice keys...")
resp = requests.post(f"{BASE_URL}/api/generate_keys", json={"length": 40})
if resp.status_code != 200:
    print(f"❌ Failed to generate keys: {resp.text}")
    raise SystemExit(1)

alice_data = resp.json()
alice_bits = alice_data.get("aliceBits", [])
alice_bases = alice_data.get("aliceBases", [])

if not alice_bits or not alice_bases:
    print("❌ Alice data missing")
    raise SystemExit(1)

print("2. Forcing synchronized-bias basis profile for Bob (non-50/50 seed condition)...")
# Use Alice bases directly to emulate a fully synchronized next-round bias profile.
bob_bases = list(alice_bases)
bob_bits = list(alice_bits)

resp = requests.post(
    f"{BASE_URL}/api/sift_keys",
    json={
        "bobBases": bob_bases,
        "bobBits": bob_bits,
        "aliceBases": alice_bases,
    },
)
if resp.status_code != 200:
    print(f"❌ sift_keys failed: {resp.text}")
    raise SystemExit(1)

result = resp.json()
print("Sift response:", result)

basis_sync = result.get("basisSyncLevel")
bias_alignment = result.get("biasAlignmentScore")

if basis_sync is None or bias_alignment is None:
    print("❌ Missing DBS metrics in sift_keys response")
    raise SystemExit(1)

if basis_sync <= 50:
    print(f"❌ Expected non-50/50 synchronization level evidence, got {basis_sync}")
    raise SystemExit(1)

print(f"✅ DBS metrics validated: basisSyncLevel={basis_sync}%, biasAlignmentScore={bias_alignment}%")
