#!/usr/bin/env python3
"""
test_cascade_with_natural_noise.py
----------------------------------
Test cascade error correction under natural channel noise using actual API workflow.
"""

import requests

BASE = "http://127.0.0.1:5000/api"
BOLD = "\033[1m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"


def post(path, payload):
    try:
        r = requests.post(f"{BASE}{path}", json=payload, timeout=20)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"{RED}POST {path} failed: {e}{RESET}")
        return None


def log_pass(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def log_fail(msg):
    print(f"{RED}✗ {msg}{RESET}")

def log_warn(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

def log_info(msg):
    print(f"{CYAN}ℹ {msg}{RESET}")


def set_natural_noise(channel_noise_rate: float):
    """Configure natural channel noise."""
    result = post("/set_noise_config", {
        "interception_density": 0.0,
        "use_hardware_noise": False,
        "qber_sn": 0.0,
        "network_noise_rate": 0.0,
        "channel_noise_rate": channel_noise_rate,
        "packet_loss_rate": 0.0,
        "attack_mode": "none",
    })
    return result is not None


def run_bb84_with_cascade(qubit_count: int = 500):
    """Execute full BB84 workflow and return cascade results."""
    
    # Step 1: Alice generates keys
    gen = post("/generate_keys", {"length": qubit_count})
    if not gen:
        return None
    
    # Step 2: Bob measures
    bob = post("/bob_measure", {})
    if not bob:
        return None
    
    # Step 3: Sifting
    sift = post("/sift_keys", {
        "aliceBases": gen["aliceBases"],
        "bobBases": bob["bobBases"],
        "bobBits": bob["measuredBits"],
    })
    if not sift:
        return None
    
    sifted_key = sift.get("siftedKey", [])
    matches = sift.get("matches", [])
    
    # Step 4: Sample verification and cascade correction
    sample = post("/sample_key", {"siftedKey": sifted_key})
    if not sample:
        return None
    
    compare = post("/compare_sample", {
        "sampleIndices": sample["sampleIndices"],
        "bobSampleBits": sample["sampleBits"],
        "bobRemainingKey": sample["remainingKey"],
        "originalMatches": matches,
    })
    
    if not compare:
        return None
    
    return {
        "length": qubit_count,
        "sifted_key": sifted_key,
        "qber": compare.get("qber", 0.0),
        "cascade_stats": compare.get("cascadeStats", {}),
        "compare_response": compare,
    }


def test_scenario(label: str, noise_rate: float, qubit_count: int = 500):
    """Run single test scenario."""
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}Test: {label}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")
    
    log_info(f"Setting channel_noise_rate = {noise_rate}")
    if not set_natural_noise(noise_rate):
        log_fail("Failed to set noise configuration")
        return None
    
    log_info(f"Running BB84 with {qubit_count} qubits...")
    result = run_bb84_with_cascade(qubit_count)
    
    if not result:
        log_fail("BB84 workflow failed")
        return None
    
    # Extract cascade metrics
    qber = result["qber"]
    cascade = result["cascade_stats"]
    errors_found = cascade.get("errors_found", 0)
    residual = cascade.get("residual_errors", 0)
    converged = cascade.get("converged", False)
    
    log_info(f"QBER: {qber:.2f}%")
    log_info(f"Cascade: errors_found={errors_found}, residual={residual}, converged={converged}")
    
    if residual == 0:
        log_pass("SUCCESS: All errors corrected!")
    else:
        log_fail(f"FAILURE: {residual} error(s) remain uncorrected!")
        
        # Print trace details if available
        trace = cascade.get("trace", {})
        rounds = trace.get("rounds", [])
        if rounds:
            print(f"\n{YELLOW}Cascade Trace (by round):{RESET}")
            for i, round_data in enumerate(rounds):
                print(f"  Round {i+1}: block_size={round_data.get('block_size')}, "
                      f"errors_found={round_data.get('errors_found', 0)}")
    
    return {
        "label": label,
        "noise_rate": noise_rate,
        "qber": qber,
        "errors_found": errors_found,
        "residual_errors": residual,
        "converged": converged,
        "sifted_length": len(result["sifted_key"]),
    }


def main():
    print(f"\n{CYAN}{'='*70}{RESET}")
    print(f"{BOLD}{CYAN}CASCADE ERROR CORRECTION UNDER NATURAL NOISE{RESET}")
    print(f"{CYAN}{'='*70}{RESET}\n")
    
    test_cases = [
        ("Minimal Natural Noise", 0.01, 500),
        ("Moderate Natural Noise", 0.05, 600),
        ("High Natural Noise", 0.10, 800),
        ("Stress Test (Very High)", 0.15, 1000),
    ]
    
    results = []
    passed = 0
    
    for label, noise_rate, qcount in test_cases:
        result = test_scenario(label, noise_rate, qcount)
        if result:
            results.append(result)
            if result["residual_errors"] == 0:
                passed += 1
    
    # Summary report
    print(f"\n{CYAN}{'='*70}{RESET}")
    print(f"{BOLD}{CYAN}SUMMARY REPORT{RESET}")
    print(f"{CYAN}{'='*70}{RESET}\n")
    
    print(f"{BOLD}Test Results:{RESET}")
    for r in results:
        status_symbol = GREEN + "✓" + RESET if r["residual_errors"] == 0 else RED + "✗" + RESET
        print(f"{status_symbol} {r['label']:30s} | "
              f"noise={r['noise_rate']:4.1%} | "
              f"qber={r['qber']:5.2f}% | "
              f"found={r['errors_found']:2d} | "
              f"residual={r['residual_errors']:2d}")
    
    print(f"\n{BOLD}Overall:{RESET} {passed}/{len(results)} scenarios passed")
    
    if passed == len(results):
        log_pass("All tests passed! Cascade is working correctly.")
    else:
        log_warn(f"⚠ {len(results) - passed} test(s) with persistent errors detected")
        print(f"\n{RED}{BOLD}ERROR ANALYSIS:{RESET}")
        for r in results:
            if r["residual_errors"] > 0:
                print(f"\n  {r['label']}:")
                print(f"    QBER: {r['qber']:.2f}% (noise={r['noise_rate']:.1%})")
                print(f"    Errors found: {r['errors_found']}, Residual: {r['residual_errors']}")
                if r["qber"] > 0.11:
                    print(f"    → QBER exceeds 11% threshold; Cascade may abort")
                if r['residual_errors'] == r['errors_found']:
                    print(f"    → Cascade did not find any errors despite QBER indicating they exist")


if __name__ == "__main__":
    main()
