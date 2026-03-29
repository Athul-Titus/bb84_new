#!/usr/bin/env python3
"""
diagnose_cascade_natural_noise.py
---------------------------------
Comprehensive diagnostic test for Cascade error correction under natural channel noise.
Tests various noise regimes and captures detailed failure analytics.
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


def log_section(title):
    print(f"\n{CYAN}{'='*70}{RESET}")
    print(f"{CYAN}{BOLD}{title}{RESET}")
    print(f"{CYAN}{'='*70}{RESET}\n")


def log_pass(msg):
    print(f"{GREEN}✓ {msg}{RESET}")


def log_fail(msg):
    print(f"{RED}✗ {msg}{RESET}")


def log_warn(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")


def log_info(msg):
    print(f"{CYAN}ℹ {msg}{RESET}")


def set_natural_noise(channel_noise_rate: float, qber_sn: float = 0.0):
    """Configure natural channel noise."""
    payload = {
        "channel_noise_rate": channel_noise_rate,
        "qber_sn": qber_sn,
        "interception_density": 0.0,  # No Eve
        "use_hardware_noise": False,
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/set_noise_config", json=payload)
        resp.raise_for_status()
        log_info(f"Natural noise configured: ch_rate={channel_noise_rate}, qber_sn={qber_sn}%")
        return True
    except Exception as e:
        log_fail(f"Failed to set noise config: {e}")
        return False


def run_basic_bb84(qubit_count: int = 500):
    """Run standard BB84 and return results."""
    try:
        resp = requests.post(f"{BASE_URL}/api/run_basic", json={"n": qubit_count})
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        log_fail(f"BB84 run failed: {e}")
        return None


def check_cascade_correction():
    """Fetch cascade reconciliation status."""
    try:
        resp = requests.get(f"{BASE_URL}/api/cascade_status")
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        log_fail(f"Failed to fetch cascade status: {e}")
        return None


def analyze_cascade_trace(cascade_data):
    """Deep-dive analysis of cascade trace."""
    if not cascade_data:
        return
    
    trace = cascade_data.get("trace", {})
    rounds = trace.get("rounds", [])
    errors_found = cascade_data.get("errors_found", 0)
    residual_errors = cascade_data.get("residual_errors", 0)
    converged = cascade_data.get("converged", False)
    
    log_info(f"Cascade Convergence: {converged}")
    log_info(f"Errors Found: {errors_found}")
    log_info(f"Residual Errors: {residual_errors}")
    log_info(f"Rounds Executed: {len(rounds)}")
    
    if residual_errors > 0:
        log_warn(f"PERSISTENT ERRORS DETECTED: {residual_errors} bits remain uncorrected")
        
        # Print round-by-round details
        for i, round_data in enumerate(rounds):
            print(f"\n  {YELLOW}Round {i+1}:{RESET}")
            print(f"    Block size: {round_data.get('block_size', 'N/A')}")
            print(f"    Blocks: {round_data.get('num_blocks', 'N/A')}")
            print(f"    Parities queried: {round_data.get('parities_exchanged', 0)}")
            print(f"    Errors corrected: {round_data.get('errors_found', 0)}")
    else:
        log_pass("All errors corrected successfully")
    
    return residual_errors


def test_scenario(scenario_name: str, channel_noise_rate: float, qubit_count: int = 500):
    """Run a single diagnostic scenario."""
    log_section(f"Test Scenario: {scenario_name}")
    
    # 1. Set noise
    if not set_natural_noise(channel_noise_rate, qber_sn=0.0):
        return None
    
    # 2. Run BB84
    print(f"\n{BOLD}Running BB84 with {qubit_count} qubits...{RESET}")
    bb84_result = run_basic_bb84(qubit_count)
    if not bb84_result:
        return None
    
    sifted_len = bb84_result.get("sifted_key_length", 0)
    qber_pct = bb84_result.get("qber", 0.0)
    
    log_info(f"Sifted key length: {sifted_len}")
    log_info(f"QBER: {qber_pct:.2f}%")
    
    # 3. Check cascade status
    time.sleep(0.5)  # Small delay for cascade processing
    print(f"\n{BOLD}Analyzing Cascade Error Correction...{RESET}")
    cascade_data = check_cascade_correction()
    if not cascade_data:
        return None
    
    # 4. Deep analysis
    residual = analyze_cascade_trace(cascade_data)
    
    return {
        "scenario": scenario_name,
        "channel_noise_rate": channel_noise_rate,
        "qber": qber_pct,
        "sifted_length": sifted_len,
        "residual_errors": residual,
        "cascade_data": cascade_data,
    }


def main():
    """Main diagnostic workflow."""
    print(f"\n{BOLD}{CYAN}BB84 CASCADE ERROR CORRECTION — NATURAL NOISE DIAGNOSTICS{RESET}\n")
    
    # Pre-flight check
    try:
        resp = requests.get(f"{BASE_URL}/api/status")
        resp.raise_for_status()
        log_pass("Backend is online")
    except Exception as e:
        log_fail(f"Backend unreachable: {e}. Start Flask server first.")
        return
    
    results = []
    
    # Test 1: Minimal noise (baseline)
    results.append(test_scenario("Minimal Natural Noise", channel_noise_rate=0.01, qubit_count=500))
    
    # Test 2: Moderate noise
    results.append(test_scenario("Moderate Natural Noise", channel_noise_rate=0.05, qubit_count=600))
    
    # Test 3: High noise
    results.append(test_scenario("High Natural Noise", channel_noise_rate=0.10, qubit_count=800))
    
    # Test 4: Very high noise (stress test)
    results.append(test_scenario("Stress Test (Very High Noise)", channel_noise_rate=0.15, qubit_count=1000))
    
    # Summary
    log_section("DIAGNOSTIC SUMMARY")
    print(f"\n{BOLD}Results across all scenarios:{RESET}\n")
    
    success_count = 0
    for result in results:
        if result is None:
            continue
        
        scenario = result["scenario"]
        residual = result["residual_errors"]
        qber = result["qber"]
        
        if residual == 0:
            log_pass(f"{scenario}: QBER={qber:.2f}%, Residual=0 ✓")
            success_count += 1
        else:
            log_fail(f"{scenario}: QBER={qber:.2f}%, Residual={residual} errors ✗")
    
    print(f"\n{BOLD}Overall: {success_count}/{len(results)} scenarios passed{RESET}")
    
    # Detailed failure analysis if any persisted
    if success_count < len(results):
        print(f"\n{RED}{BOLD}PERSISTENT ERROR ANALYSIS:{RESET}\n")
        for result in results:
            if result and result["residual_errors"] > 0:
                print(f"\n{YELLOW}Scenario: {result['scenario']}{RESET}")
                print(f"Channel Noise Rate: {result['channel_noise_rate']}")
                print(f"QBER: {result['qber']:.2f}%")
                print(f"Residual Errors: {result['residual_errors']}")
                
                cascade = result["cascade_data"]
                print(f"\nCascade Status:")
                print(f"  Converged: {cascade.get('converged', False)}")
                print(f"  Errors Found: {cascade.get('errors_found', 0)}")
                print(f"  Max Iterations: {cascade.get('max_iterations', 'N/A')}")
                print(f"  Iterations Used: {cascade.get('iterations_used', 'N/A')}")
                
                # Root cause hypothesis
                if cascade.get("iterations_used", 0) >= cascade.get("max_iterations", 999):
                    log_warn("Cascade iteration limit reached — may not have converged")
                if result["qber"] > 0.10:
                    log_warn("QBER exceeds 10% — cascade may struggle with this noise level")


if __name__ == "__main__":
    main()
