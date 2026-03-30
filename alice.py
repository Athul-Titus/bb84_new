

import randomkey
import random
from node import Node

class Alice(Node):
    def __init__(self):
        super().__init__("Alice")
        print("[DEBUG] Alice Initialized with shared_key field")
        self.raw_bits = None
        self.bases = None
        self.encoded_qubits = None
        self.shared_key = None
        self.sifted_key = None
        self.pa_stats = None
        self.protocol_round_id = None
        self.sacrifice_indices = []
        self.pending_raw_remaining_key = None
        self.pending_qber = None
        self.pending_leaked_bits = 0
        self.pending_flip_log = []
        self.peer_corrected_remaining_key = None
        self.hash_check_passed = None
        self.final_key_hash = None

    def generate_sacrifice_indices(self, length, percentage=0.3):
        """
        Alice generates public sacrifice indices on raw qubit positions.
        Bob maps these to sifted-key positions after basis matching.
        """
        total = max(0, int(length))
        if total == 0:
            self.sacrifice_indices = []
            return []

        sample_size = max(1, int(total * float(percentage)))
        sample_size = min(total, sample_size)
        all_indices = list(range(total))
        random.shuffle(all_indices)
        self.sacrifice_indices = sorted(all_indices[:sample_size])
        return list(self.sacrifice_indices)

    def prepare_quantum_states(self, length):
        self.log(f"Generating {length} bits (Standard BB84)...")
        
        # Call the existing module to do the heavy lifting
        self.raw_bits, self.bases, self.encoded_qubits = randomkey.generate_masked_key(length)
        
        self.log(f"Generated {len(self.raw_bits)} raw bits.")
        self.log(f"Encoded {len(self.encoded_qubits)} qubits.")
        return self.encoded_qubits

if __name__ == "__main__":
    # Manual Verification
    alice = Alice()
    
    # Test with a small example
    test_len = 5
    
    qubits = alice.prepare_quantum_states(test_len)
    
    print("\nVerification - Quantum Circuit Dump:")
    for i, qc in enumerate(qubits):
        print(f"\nQubit {i}:")
        print(qc)
