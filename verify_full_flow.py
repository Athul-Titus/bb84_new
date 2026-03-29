
import requests
import time

# Wait for server to be up
time.sleep(2)

BASE_URL = "http://127.0.0.1:5000"

print("--- Testing Full BB84 Flow with Network Verification ---")

# 1. Setup Alice (Generate)
print("\n1. Generating keys on Alice...")
resp = requests.post(f"{BASE_URL}/api/generate_keys", json={"length": 20})
if resp.status_code != 200:
    print(f"❌ Failed to generate keys: {resp.text}")
    exit(1)
data = resp.json()
alice_bits = data.get('aliceBits')
alice_bases = data.get('aliceBases')
print("✅ Alice keys generated.")

# 2. Simulate Bob Measurement (Local cheat: perfect match)
print("\n2. Simulating Bob Measurement (Local)...")
bob_bits = alice_bits[:] # Copy
bob_bases = alice_bases[:] # Copy
# Perfect match means matches = all indices
matches = list(range(len(alice_bits)))
sifted_key = bob_bits[:] # All bits kept

# 3. Bob calls 'verify_peer_sample' (Simulating Bob -> Alice over network)
print("\n3. Bob verifying sample with Alice (Network)...")
payload = {
    "peer_ip": "127.0.0.1", # Loopback
    "sifted_key": sifted_key,
    "original_matches": matches
}
resp = requests.post(f"{BASE_URL}/api/verify_peer_sample", json=payload)
if resp.status_code != 200:
    print(f"❌ Verification failed: {resp.text}")
    exit(1)
    
verify_data = resp.json()
bob_final_key = verify_data.get('remainingKey')
print(f"✅ Bob Verification Response. status={verify_data.get('status')} QBER={verify_data.get('qber')}%")
print(f"Bob Final Key: {bob_final_key}")

if verify_data.get("status") != "success" or not verify_data.get("verified"):
    print("❌ Expected verification success for clean test profile.")
    exit(1)

cascade_stats = verify_data.get("cascade_stats") or {}
residual = cascade_stats.get("residual_errors", verify_data.get("residual_errors"))
if residual not in (0, None):
    print(f"❌ Residual errors detected after Cascade: {residual}")
    exit(1)

# 4. Check Alice's Status (Did she get the key?)
print("\n4. Checking Alice's Key Status...")
# Give a moment for backend to process if async (it's synchronous here but good practice)
time.sleep(1)

resp = requests.get(f"{BASE_URL}/api/alice/key_status")
if resp.status_code != 200:
    print(f"❌ Failed to get Alice status: {resp.text}")
    exit(1)
    
alice_status = resp.json()
alice_final_key = alice_status.get('sharedKey')
print(f"Alice Final Key: {alice_final_key}")

# 5. Compare
if alice_final_key == bob_final_key:
    print("\n✅ SUCCESS: Alice and Bob have identical final keys.")
    print(f"Key Length: {len(alice_final_key)}")
    if alice_status.get("paStats"):
        print(f"PA Final Length: {alice_status['paStats'].get('final_length')}")
else:
    print("\n❌ FAILURE: Keys do not match!")
    print(f"Alice: {alice_final_key}")
    print(f"Bob:   {bob_final_key}")
