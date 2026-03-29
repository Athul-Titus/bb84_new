import requests

print("Generating keys...")
res = requests.post("http://127.0.0.1:5000/api/generate_keys", json={"length": 10})
alice_data = res.json()
print("Alice:", alice_data)

print("Bob Measuring...")
res = requests.post("http://127.0.0.1:5000/api/bob_measure", json={})
bob_data = res.json()
print("Bob:", bob_data)

print("Sifting keys...")
res = requests.post("http://127.0.0.1:5000/api/sift_keys", json={"bobBases": bob_data["bobBases"], "bobBits": bob_data["measuredBits"], "aliceBases": []})
sift_data = res.json()
print("Sift:", sift_data)

print("Sampling key...")
res = requests.post("http://127.0.0.1:5000/api/sample_key", json={"siftedKey": sift_data["siftedKey"]})
sample_data = res.json()
print("Sample:", sample_data)

print("Comparing sample...")
res = requests.post("http://127.0.0.1:5000/api/compare_sample", json={
	"sampleIndices": sample_data["sampleIndices"],
	"bobSampleBits": sample_data["sampleBits"],
	"bobRemainingKey": sample_data["remainingKey"],
	"originalMatches": sift_data["matches"]
})
compare_data = res.json()
print("Compare:", compare_data)

if compare_data.get("status") not in ("success", "aborted"):
	raise AssertionError("Missing structured status in compare_sample response")

if "math" not in compare_data:
	raise AssertionError("Missing math payload in compare_sample response")

math_payload = compare_data["math"]
for key in ("h2_qber", "secret_key_rate_r", "qber_decimal"):
	if key not in math_payload:
		raise AssertionError(f"Missing math field: {key}")

print("Fetching Alice Key...")
res = requests.get("http://127.0.0.1:5000/api/alice/key_status")
alice_stored = res.json()
print("Alice Stored Key:", alice_stored)
