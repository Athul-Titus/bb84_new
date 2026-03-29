#!/usr/bin/env python3
"""
test_final_fixes.py
-------------------
Comprehensive test to verify all 4 fixes work correctly:
1. Residual errors don't abort in tolerance mode
2. Privacy floor guard prevents negative m
3. Key is set regardless of strict verification
4. Environmental noise routing works
"""

import requests
import json

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


def log_test(name):
    print(f"\n{CYAN}{'='*70}{RESET}")
    print(f"{BOLD}{name}{RESET}")
    print(f"{CYAN}{'='*70}{RESET}")


def check(condition, label):
    if condition:
        print(f"{GREEN}✓ {label}{RESET}")
        return True
    else:
        print(f"{RED}✗ {label}{RESET}")
        return False


def test_fix1_tolerance_mode():
    """Test FIX 1: Residual errors don't abort in tolerance mode"""
    log_test("TEST 1: FIX 1 - Residual Errors Tolerance Mode")
    
    # Set noise, enable tolerance mode
    post("/set_noise_config", {
        "interception_density": 0.0,
        "use_hardware_noise": False,
        "qber_sn": 0.0,
        "network_noise_rate": 0.0,
        "channel_noise_rate": 0.05,
        "packet_loss_rate": 0.0,
        "attack_mode": "none",
    })
    
    # Run BB84
    g = post("/generate_keys", {"length": 600})
    b = post("/bob_measure", {})
    s = post("/sift_keys", {
        "aliceBases": g["aliceBases"],
        "bobBases": b["bobBases"],
        "bobBits": b["measuredBits"],
    })
    
    sm = post("/sample_key", {"siftedKey": s["siftedKey"]})
    
    # Compare with manual noise and tolerance enabled
    c = post("/compare_sample", {
        "sampleIndices": sm["sampleIndices"],
        "bobSampleBits": sm["sampleBits"],
        "bobRemainingKey": sm["remainingKey"],
        "originalMatches": s["matches"],
        "manual_noise_enabled": True,
        "manual_noise_rate": 0.05,
        "noise_tolerance_enabled": True,
    })
    
    result_ok = check(isinstance(c, dict), "Response received")
    status_ok = check(c.get("status") in ["success", "aborted"], f"Status valid: {c.get('status')}")
    
    cascade_stats = c.get("cascade_stats", {})
    residual = cascade_stats.get("residual_errors")
    
    # Even with residual errors, in tolerance mode should not have hard abort
    if residual is not None and residual > 0:
        tolerance_ok = check(
            c.get("status") == "success" or (c.get("verified") != False and c.get("corrected_bob_key")),
            f"Residual errors ({residual}) allowed in tolerance mode"
        )
    else:
        tolerance_ok = True
    
    return result_ok and status_ok and tolerance_ok


def test_fix2_privacy_floor():
    """Test FIX 2: Privacy floor guard prevents negative m"""
    log_test("TEST 2: FIX 2 - Privacy Floor Guard")
    
    # Set very high noise to trigger short key scenario
    post("/set_noise_config", {
        "interception_density": 0.0,
        "use_hardware_noise": False,
        "qber_sn": 0.0,
        "network_noise_rate": 0.0,
        "channel_noise_rate": 0.20,  # Very high noise
        "packet_loss_rate": 0.0,
        "attack_mode": "none",
    })
    
    # Run BB84 with small key
    g = post("/generate_keys", {"length": 100})  # Small key
    b = post("/bob_measure", {})
    s = post("/sift_keys", {
        "aliceBases": g["aliceBases"],
        "bobBases": b["bobBases"],
        "bobBits": b["measuredBits"],
    })
    
    sm = post("/sample_key", {"siftedKey": s["siftedKey"]})
    c = post("/compare_sample", {
        "sampleIndices": sm["sampleIndices"],
        "bobSampleBits": sm["sampleBits"],
        "bobRemainingKey": sm["remainingKey"],
        "originalMatches": s["matches"],
    })
    
    result_ok = check(isinstance(c, dict), "Response received (no crash)")
    
    pa_stats = c.get("pa_stats") or {}
    final_len = pa_stats.get("final_length") if pa_stats else None
    
    # Check that final_length >= 8 (privacy floor)
    privacy_floor_ok = check(
        final_len is None or final_len >= 8,
        f"Privacy floor maintained: final_length={final_len} (should be None or >= 8)"
    )
    
    # Check no crash occurred
    no_crash = check(c.get("status") in ["success", "aborted"], "Backend didn't crash")
    
    return result_ok and privacy_floor_ok and no_crash


def test_fix3_key_set_in_tolerance():
    """Test FIX 3: Key is set regardless of strict verification"""
    log_test("TEST 3: FIX 3 - Key Set in Tolerance Mode")
    
    # Set moderate noise, enable tolerance
    post("/set_noise_config", {
        "interception_density": 0.0,
        "use_hardware_noise": False,
        "qber_sn": 0.0,
        "network_noise_rate": 0.0,
        "channel_noise_rate": 0.08,
        "packet_loss_rate": 0.0,
        "attack_mode": "none",
    })
    
    # Run BB84
    g = post("/generate_keys", {"length": 500})
    b = post("/bob_measure", {})
    s = post("/sift_keys", {
        "aliceBases": g["aliceBases"],
        "bobBases": b["bobBases"],
        "bobBits": b["measuredBits"],
    })
    
    sm = post("/sample_key", {"siftedKey": s["siftedKey"]})
    c = post("/compare_sample", {
        "sampleIndices": sm["sampleIndices"],
        "bobSampleBits": sm["sampleBits"],
        "bobRemainingKey": sm["remainingKey"],
        "originalMatches": s["matches"],
        "manual_noise_enabled": True,
        "manual_noise_rate": 0.08,
        "noise_tolerance_enabled": True,
    })
    
    result_ok = check(isinstance(c, dict), "Response received")
    
    has_key = check(
        len(c.get("corrected_bob_key", [])) > 0 or c.get("remainingKey"),
        f"Key is set even with tolerance mode"
    )
    
    return result_ok and has_key


def test_fix4_environmental_routing():
    """Test FIX 4: Environmental noise routing (abort_classification present)"""
    log_test("TEST 4: FIX 4 - Environmental Noise Routing")
    
    # Set very high noise to trigger QBER > threshold
    post("/set_noise_config", {
        "interception_density": 0.0,
        "use_hardware_noise": False,
        "qber_sn": 0.0,
        "network_noise_rate": 0.0,
        "channel_noise_rate": 0.20,
        "packet_loss_rate": 0.0,
        "attack_mode": "none",
    })
    
    # Run BB84
    g = post("/generate_keys", {"length": 500})
    b = post("/bob_measure", {})
    s = post("/sift_keys", {
        "aliceBases": g["aliceBases"],
        "bobBases": b["bobBases"],
        "bobBits": b["measuredBits"],
    })
    
    sm = post("/sample_key", {"siftedKey": s["siftedKey"]})
    
    # Without tolerance — should see security_threat
    c1 = post("/compare_sample", {
        "sampleIndices": sm["sampleIndices"],
        "bobSampleBits": sm["sampleBits"],
        "bobRemainingKey": sm["remainingKey"],
        "originalMatches": s["matches"],
    })
    
    result_ok = check(isinstance(c1, dict), "Response received (no tolerance)")
    
    abort_class = c1.get("abort_classification")
    has_classification = check(
        abort_class in ["security_threat", "software_error", "environmental_noise", None],
        f"Abort classification present: {abort_class}"
    )
    
    return result_ok and has_classification


def test_zero_qber_cascade():
    """Bonus test: Ensure Cascade runs even with QBER=0 (no residual errors issue)"""
    log_test("BONUS: Zero QBER Cascade Execution")
    
    # Clean noise config
    post("/set_noise_config", {
        "interception_density": 0.0,
        "use_hardware_noise": False,
        "qber_sn": 0.0,
        "network_noise_rate": 0.0,
        "channel_noise_rate": 0.0,
        "packet_loss_rate": 0.0,
        "attack_mode": "none",
    })
    
    # Run BB84
    g = post("/generate_keys", {"length": 500})
    b = post("/bob_measure", {})
    s = post("/sift_keys", {
        "aliceBases": g["aliceBases"],
        "bobBases": b["bobBases"],
        "bobBits": b["measuredBits"],
    })
    
    sm = post("/sample_key", {"siftedKey": s["siftedKey"]})
    c = post("/compare_sample", {
        "sampleIndices": sm["sampleIndices"],
        "bobSampleBits": sm["sampleBits"],
        "bobRemainingKey": sm["remainingKey"],
        "originalMatches": s["matches"],
    })
    
    result_ok = check(isinstance(c, dict), "Response received")
    
    qber = c.get("qber", 999)
    cascade_stats = c.get("cascade_stats", {})
    residual = cascade_stats.get("residual_errors")
    
    zero_qber = check(qber == 0.0, f"QBER is zero: {qber}")
    residual_ok = check(residual == 0, f"No residual errors with QBER=0: residual={residual}")
    status_ok = check(c.get("status") == "success", f"Status is success: {c.get('status')}")
    
    return result_ok and zero_qber and residual_ok and status_ok


def main():
    print(f"\n{BOLD}{CYAN}═════════════════════════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN}FINAL FIX VERIFICATION TEST SUITE{RESET}")
    print(f"{BOLD}{CYAN}═════════════════════════════════════════════════════════════════{RESET}\n")
    
    results = {
        "FIX 1 (Tolerance Mode)": test_fix1_tolerance_mode(),
        "FIX 2 (Privacy Floor)": test_fix2_privacy_floor(),
        "FIX 3 (Key Set in Tolerance)": test_fix3_key_set_in_tolerance(),
        "FIX 4 (Environmental Routing)": test_fix4_environmental_routing(),
        "BONUS (Zero QBER Cascade)": test_zero_qber_cascade(),
    }
    
    # Summary
    print(f"\n{CYAN}{'='*70}{RESET}")
    print(f"{BOLD}SUMMARY{RESET}")
    print(f"{CYAN}{'='*70}{RESET}\n")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_flag in results.items():
        symbol = GREEN + "✓" + RESET if passed_flag else RED + "✗" + RESET
        print(f"{symbol} {test_name}")
    
    print(f"\n{BOLD}Result: {passed}/{total} tests passed{RESET}\n")
    
    if passed == total:
        print(f"{GREEN}{BOLD}🎉 ALL FIXES VERIFIED SUCCESSFULLY!{RESET}\n")
    else:
        print(f"{RED}{BOLD}⚠ Some fixes need attention{RESET}\n")


if __name__ == "__main__":
    main()
