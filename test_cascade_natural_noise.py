#!/usr/bin/env python3
"""
test_cascade_natural_noise.py
-----------------------------
Test cascade error correction under natural channel noise.
Simplified diagnostic without complex status polling.
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"
BOLD = "\033[1m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"


def log_pass(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def log_fail(msg):
    print(f"{RED}✗ {msg}{RESET}")

def log_warn(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

def log_info(msg):
    print(f"{CYAN}ℹ {msg}{RESET}")

def set_noise(channel_noise_rate: float):
    """Configure natural channel noise."""
    payload = {
        "channel_noise_rate": channel_noise_rate,
        "qber_sn": 0.0,
        "interception_density": 0.0,
        "use_hardware_noise": False,
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/set_noise_config", json=payload)
        resp.raise_for_status()
        log_info(f"Noise configured: channel_rate={channel_noise_rate}")
        return True
    except Exception as e:
        log_fail(f"Failed to set noise: {e}")
        return False

def run_test(noise_rate: float, qubit_count: int = 500):
    """Run single BB84 scenario and check cascade results."""
    print(f"\n{BOLD}Testing with channel_noise_rate={noise_rate} (n={qubit_count} qubits){RESET}")
    
    if not set_noise(noise_rate):
        return None
    
    try:
        # Run BB84
        resp = requests.post(f"{BASE_URL}/api/run_basic", json={"n": qubit_count})
        resp.raise_for_status()
        result = resp.json()
        
        sifted_len = result.get("sifted_key_length", 0)
        qber = result.get("qber", 0.0)
        
        log_info(f"Sifted key: {sifted_len} bits, QBER: {qber:.2f}%")
        
        # Get cascade results
        cascade_resp = requests.get(f"{BASE_URL}/api/cascade_status")
        cascade_resp.raise_for_status()
        cascade = cascade_resp.json()
        
        errors_found = cascade.get("errors_found", 0)
        residual = cascade.get("residual_errors", 0)
        converged = cascade.get("converged", False)
        
        log_info(f"Cascade: errors_found={errors_found}, residual={residual}, converged={converged}")
        
        if residual == 0:
            log_pass(f"Success! All {errors_found} errors corrected.")
        else:
            log_fail(f"FAILURE: {residual} errors remain uncorrected (found {errors_found})!")
            print(f"\n  Cascade Trace:")
            rounds = cascade.get("trace", {}).get("rounds", [])
            for i, round_data in enumerate(rounds):
                print(f"    Round {i+1}: block_size={round_data.get('block_size')}, "
                      f"errors_found={round_data.get('errors_found', 0)}")
        
        return {
            "noise_rate": noise_rate,
            "qber": qber,
            "errors_found": errors_found,
            "residual": residual,
            "converged": converged,
        }
        
    except Exception as e:
        log_fail(f"Test failed: {e}")
        return None


def main():
    print(f"\n{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}CASCADE ERROR CORRECTION — NATURAL NOISE TESTS{RESET}")
    print(f"{CYAN}{'='*60}{RESET}\n")
    
    scenarios = [
        (0.01, 500, "Minimal noise"),
        (0.05, 600, "Moderate noise"),
        (0.10, 800, "High noise"),
        (0.15, 1000, "Stress test"),
    ]
    
    results = []
    passed = 0
    
    for noise_rate, qubit_count, label in scenarios:
        print(f"\n{BOLD}Scenario: {label}{RESET}")
        result = run_test(noise_rate, qubit_count)
        
        if result:
            results.append(result)
            if result["residual"] == 0:
                passed += 1
    
    # Summary
    print(f"\n{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}SUMMARY: {passed}/{len(results)} scenarios passed{RESET}")
    print(f"{CYAN}{'='*60}{RESET}\n")
    
    for r in results:
        status = "PASS" if r["residual"] == 0 else "FAIL"
        color = GREEN if r["residual"] == 0 else RED
        print(f"{color}[{status}]{RESET} noise={r['noise_rate']:2%} qber={r['qber']:5.2f}% "
              f"found={r['errors_found']:2d} residual={r['residual']:2d}")
    
    if passed < len(results):
        print(f"\n{RED}{BOLD}⚠ PERSISTENT ERRORS DETECTED!{RESET}")
        print(f"Errors remain uncorrected in {len(results) - passed} scenarios")


if __name__ == "__main__":
    main()
