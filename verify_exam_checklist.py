import random
import statistics
import requests

BASE = "http://127.0.0.1:5000/api"


def post(path, payload):
    r = requests.post(f"{BASE}{path}", json=payload, timeout=20)
    r.raise_for_status()
    return r.json()


def get(path):
    r = requests.get(f"{BASE}{path}", timeout=20)
    r.raise_for_status()
    return r.json()


def reset_noise():
    post("/set_noise_config", {
        "interception_density": 0.0,
        "use_hardware_noise": False,
        "qber_sn": 0.0,
        "network_noise_rate": 0.0,
        "channel_noise_rate": 0.0,
        "packet_loss_rate": 0.0,
        "attack_mode": "none",
    })


def run_basic(length):
    gen = post("/generate_keys", {"length": length})
    bob = post("/bob_measure", {})
    sift = post("/sift_keys", {
        "aliceBases": gen["aliceBases"],
        "bobBases": bob["bobBases"],
        "bobBits": bob["measuredBits"],
    })
    return gen, bob, sift


def verify_from_sift(sifted_key, matches, manual_flags=None):
    sample = post("/sample_key", {"siftedKey": sifted_key})
    payload = {
        "sampleIndices": sample["sampleIndices"],
        "bobSampleBits": sample["sampleBits"],
        "bobRemainingKey": sample["remainingKey"],
        "originalMatches": matches,
    }
    if manual_flags:
        payload.update(manual_flags)
    compare = post("/compare_sample", payload)
    return sample, compare


def inject_noise(bits, rate):
    noisy = list(bits)
    n = len(noisy)
    flips = max(1, int(n * rate))
    idxs = random.sample(range(n), min(flips, n))
    for i in idxs:
        noisy[i] = 1 - noisy[i]
    return noisy, len(idxs)


results = {}

# 1) Quantum Engine
reset_noise()
_, _, sift = run_basic(1000)
sift_len = len(sift["siftedKey"])
sift_ratio = sift_len / 1000.0
results["Quantum Engine"] = {
    "expected": "Sifted key length approx 500 (ratio about 0.5)",
    "actual": f"sifted={sift_len}, ratio={sift_ratio:.3f}",
    "pass": 0.45 <= sift_ratio <= 0.55,
}

# 2) Eve Detection
post("/set_noise_config", {
    "interception_density": 1.0,
    "network_noise_rate": 0.0,
    "channel_noise_rate": 0.0,
    "packet_loss_rate": 0.0,
    "use_hardware_noise": False,
})
_, _, sift_eve = run_basic(400)
_, cmp_eve = verify_from_sift(sift_eve["siftedKey"], sift_eve["matches"])
results["Eve Detection"] = {
    "expected": "classification=security_threat and status=aborted",
    "actual": f"status={cmp_eve.get('status')}, class={cmp_eve.get('abort_classification')}, qber={cmp_eve.get('qber')}",
    "pass": (cmp_eve.get("status") == "aborted" and cmp_eve.get("abort_classification") == "security_threat"),
}

# 3) Cascade Correction (environmental 4%)
reset_noise()
_, _, sift_c = run_basic(1000)
noisy_sift, flips = inject_noise(sift_c["siftedKey"], 0.04)
_, cmp_c = verify_from_sift(
    noisy_sift,
    sift_c["matches"],
    {
        "manual_noise_enabled": True,
        "manual_noise_rate": 0.04,
        "noise_tolerance_enabled": True,
    },
)
cstats = cmp_c.get("cascade_stats") or {}
residual = cstats.get("residual_errors")
errors_found = cstats.get("errors_found")
results["Cascade Correction"] = {
    "expected": "Cascade runs and final residual_errors=0 after noisy input",
    "actual": f"status={cmp_c.get('status')}, qber={cmp_c.get('qber')}, injected_flips={flips}, errors_found={errors_found}, residual_errors={residual}",
    "pass": (cmp_c.get("status") == "success" and residual == 0),
    "note": "Visualizer bit-flip animation is UI-only and not verifiable via backend API.",
}

# 4) Privacy Amplification
pa = cmp_c.get("pa_stats") or {}
in_len = pa.get("input_length")
out_len = pa.get("final_length")
pa_warning = cmp_c.get("pa_warning")
results["Privacy Amplification"] = {
    "expected": "Final key shorter than sifted/corrected key (or warning path for tiny keys)",
    "actual": f"input_length={in_len}, final_length={out_len}, pa_warning={pa_warning}",
    "pass": (isinstance(in_len, int) and isinstance(out_len, int) and out_len < in_len) or bool(pa_warning),
}

# 5) DBS Sync range over multiple runs
reset_noise()
ratios = []
for _ in range(5):
    _, _, sift_i = run_basic(1000)
    ratios.append((sift_i.get("basisSyncLevel", 0.0) / 100.0))
in_range = [0.45 <= r <= 0.55 for r in ratios]
results["DBS Sync"] = {
    "expected": "Sift ratio consistently between 0.45 and 0.55",
    "actual": f"ratios={[round(r,3) for r in ratios]}, mean={statistics.mean(ratios):.3f}",
    "pass": all(in_range),
}

# 6) Recursive mode (3 rounds bias drift)
# ensure a valid seed exists. If absent, bootstrap a clean successful BB84 run first.
try:
    seed = post("/recursive/plant_seed", {})
except Exception:
    reset_noise()
    _, _, sift_seed = run_basic(300)
    _, cmp_seed = verify_from_sift(sift_seed["siftedKey"], sift_seed["matches"])
    if cmp_seed.get("status") != "success":
        results["Recursive Mode"] = {
            "expected": "3 rounds, each round uses different bias seeded from previous key",
            "actual": f"Could not bootstrap seed key. bootstrap_status={cmp_seed.get('status')}, class={cmp_seed.get('abort_classification')}",
            "pass": False,
        }
        print("\n=== EXAM CHECKLIST RESULTS ===")
        for k, v in results.items():
            status = "PASS" if v["pass"] else "FAIL"
            print(f"\n[{status}] {k}")
            print(f"Expected: {v['expected']}")
            print(f"Actual:   {v['actual']}")
            if "note" in v:
                print(f"Note:     {v['note']}")
        raise SystemExit(0)
    seed = post("/recursive/plant_seed", {})
round_biases = []
recursive_ok = True
recursive_errors = []
for i in range(3):
    try:
        rr = post("/recursive/send_message", {"message": f"round-{i+1}", "length": 120})
        round_biases.append(rr.get("bias_used"))
    except Exception as e:
        recursive_ok = False
        recursive_errors.append(str(e))
        break

unique_biases = len(set(round_biases)) if round_biases else 0
results["Recursive Mode"] = {
    "expected": "3 rounds, each round uses different bias seeded from previous key",
    "actual": f"biases={round_biases}, unique_count={unique_biases}, errors={recursive_errors}",
    "pass": recursive_ok and len(round_biases) == 3 and unique_biases == 3,
}

print("\n=== EXAM CHECKLIST RESULTS ===")
for k, v in results.items():
    status = "PASS" if v["pass"] else "FAIL"
    print(f"\n[{status}] {k}")
    print(f"Expected: {v['expected']}")
    print(f"Actual:   {v['actual']}")
    if "note" in v:
        print(f"Note:     {v['note']}")
