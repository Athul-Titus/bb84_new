
import math
import random


class Cascade:
    def __init__(self, alice_key, bob_key, qber, with_trace=False):
        self.alice_key = list(alice_key)
        self.bob_key = list(bob_key)
        self.qber = float(qber)
        self.key_length = len(self.alice_key)
        self.with_trace = with_trace

        self.block_registry = {}
        self.pos_to_blocks = {i: [] for i in range(self.key_length)}

        self.errors_found = 0
        self.parities_exchanged = 0
        self.rounds_run = 0

        self.work_queue = []
        self.queued_set = set()
        self.max_iterations = max(4, int(math.ceil(math.log2(max(2, self.key_length))) * 6))
        self.iterations_used = 0
        self.residual_errors = None
        self.converged = False

        self.trace = {
            "seed": None,
            "adaptive_k": None,
            "skipped": None,
            "rounds": [],
        }

    @staticmethod
    def _get_parity(key, positions):
        return sum(key[i] for i in positions) % 2

    def _get_adaptive_k(self):
        if self.qber > 0.05:
            return 4
        if self.qber < 0.01:
            return 16
        return 8

    def _enqueue_block(self, round_num, block_idx, correction_type="direct", trigger_position=None):
        item_key = (round_num, block_idx)
        if item_key in self.queued_set:
            return False
        self.work_queue.append({
            "round": round_num,
            "block": block_idx,
            "type": correction_type,
            "trigger_position": trigger_position,
        })
        self.queued_set.add(item_key)
        return True

    def _count_residual_errors(self):
        return sum(1 for a, b in zip(self.alice_key, self.bob_key) if a != b)

    def _binary_search_positions(self, positions):
        if len(positions) == 1:
            error_pos = positions[0]
            self.bob_key[error_pos] = 1 - self.bob_key[error_pos]
            self.errors_found += 1
            return error_pos

        mid = len(positions) // 2
        left_half = positions[:mid]
        right_half = positions[mid:]

        alice_left_parity = self._get_parity(self.alice_key, left_half)
        bob_left_parity = self._get_parity(self.bob_key, left_half)
        self.parities_exchanged += 1

        if alice_left_parity != bob_left_parity:
            return self._binary_search_positions(left_half)
        return self._binary_search_positions(right_half)

    def _cascade_ripple(self, flipped_pos, processed_round):
        enqueued = []
        rechecks = 0
        # Recursive-style traversal over prior rounds that contain the corrected bit.
        # We use a small local frontier to avoid deep recursion while preserving the same propagation behavior.
        frontier = [(flipped_pos, processed_round)]
        seen = set()
        while frontier:
            current_pos, current_processed_round = frontier.pop(0)
            state_key = (current_pos, current_processed_round)
            if state_key in seen:
                continue
            seen.add(state_key)

            for round_num, block_idx in self.pos_to_blocks.get(current_pos, []):
                if round_num >= current_processed_round:
                    continue
                positions = self.block_registry.get(round_num, {}).get(block_idx, [])
                if not positions:
                    continue

                alice_parity = self._get_parity(self.alice_key, positions)
                bob_parity = self._get_parity(self.bob_key, positions)
                self.parities_exchanged += 1
                rechecks += 1

                if alice_parity != bob_parity and self._enqueue_block(
                    round_num,
                    block_idx,
                    correction_type="ripple",
                    trigger_position=current_pos,
                ):
                    enqueued.append({
                        "round": round_num,
                        "block_index": block_idx,
                        "trigger_position": current_pos,
                    })

        return {
            "rechecks": rechecks,
            "enqueued": enqueued,
        }

    def _skip_result(self, reason):
        self.trace["skipped"] = reason
        result = {
            "corrected_key": list(self.bob_key),
            "stats": {
                "errors_found": 0,
                "rounds_run": 0,
                "parities_exchanged": 0,
                "converged": True,
                "iterations_used": 0,
                "max_iterations": 0,
                "residual_errors": 0,
            },
        }
        if self.with_trace:
            result["trace"] = self.trace
        return result

    def run(self):
        if len(self.alice_key) != len(self.bob_key):
            raise ValueError("Alice and Bob keys must have identical lengths.")
        if self.key_length < 8:
            return self._skip_result("key_too_short")
        if self.qber == 0:
            return self._skip_result("qber_zero")
        if self.qber > 0.11:
            raise ValueError(f"QBER {self.qber:.4f} exceeds abort threshold 0.11.")

        seed = int(round(self.qber * 10000))
        k = self._get_adaptive_k()
        block_sizes = [k, 2 * k, 4 * k, 8 * k]

        self.trace["seed"] = seed
        self.trace["adaptive_k"] = k

        while self.iterations_used < self.max_iterations:
            self.iterations_used += 1

            # Rebuild per-iteration registries to avoid stale mappings across convergence passes.
            self.block_registry = {}
            self.pos_to_blocks = {i: [] for i in range(self.key_length)}
            self.work_queue = []
            self.queued_set = set()

            for round_index, block_size in enumerate(block_sizes, start=1):
                self.rounds_run += 1
                indices = list(range(self.key_length))
                if round_index > 1:
                    rng = random.Random(seed + round_index + (self.iterations_used * 101))
                    rng.shuffle(indices)

                self.block_registry[round_index] = {}
                num_blocks = int(math.ceil(self.key_length / block_size))
                for block_idx in range(num_blocks):
                    start = block_idx * block_size
                    end = min((block_idx + 1) * block_size, self.key_length)
                    positions = indices[start:end]
                    self.block_registry[round_index][block_idx] = positions
                    for pos in positions:
                        self.pos_to_blocks[pos].append((round_index, block_idx))

                round_trace = {
                    "round": round_index,
                    "iteration": self.iterations_used,
                    "block_size": block_size,
                    "num_blocks": num_blocks,
                    "shuffled": round_index > 1,
                    "mismatched_blocks": 0,
                    "queue_rechecks": 0,
                    "ripple_corrections": 0,
                    "corrections": [],
                }

                for block_idx, positions in self.block_registry[round_index].items():
                    if not positions:
                        continue
                    alice_parity = self._get_parity(self.alice_key, positions)
                    bob_parity = self._get_parity(self.bob_key, positions)
                    self.parities_exchanged += 1
                    if alice_parity != bob_parity:
                        round_trace["mismatched_blocks"] += 1
                        self._enqueue_block(round_index, block_idx, correction_type="direct")

                while self.work_queue:
                    queue_item = self.work_queue.pop(0)
                    search_round = queue_item["round"]
                    search_block = queue_item["block"]
                    correction_type = queue_item.get("type", "direct")
                    trigger_position = queue_item.get("trigger_position")

                    self.queued_set.remove((search_round, search_block))
                    positions = self.block_registry.get(search_round, {}).get(search_block, [])
                    if not positions:
                        continue

                    current_alice_parity = self._get_parity(self.alice_key, positions)
                    current_bob_parity = self._get_parity(self.bob_key, positions)
                    self.parities_exchanged += 1
                    round_trace["queue_rechecks"] += 1
                    if current_alice_parity == current_bob_parity:
                        continue

                    corrected_position = self._binary_search_positions(positions)
                    ripple = self._cascade_ripple(corrected_position, round_index)
                    if correction_type == "ripple":
                        round_trace["ripple_corrections"] += 1

                    if self.with_trace:
                        round_trace["corrections"].append({
                            "position": corrected_position,
                            "type": correction_type,
                            "source_round": search_round,
                            "source_block": search_block,
                            "trigger_position": trigger_position,
                            "ripple_rechecks": ripple["rechecks"],
                            "ripple_enqueued": ripple["enqueued"],
                        })

                if self.with_trace:
                    self.trace["rounds"].append(round_trace)

            self.residual_errors = self._count_residual_errors()
            if self.residual_errors == 0:
                self.converged = True
                break

        result = {
            "corrected_key": list(self.bob_key),
            "stats": {
                "errors_found": self.errors_found,
                "rounds_run": self.rounds_run,
                "parities_exchanged": self.parities_exchanged,
                "converged": self.converged,
                "iterations_used": self.iterations_used,
                "max_iterations": self.max_iterations,
                "residual_errors": self.residual_errors if self.residual_errors is not None else self._count_residual_errors(),
            },
        }
        if self.with_trace:
            result["trace"] = self.trace
        return result


def run_cascade(alice_key, bob_key, qber):
    cascade_instance = Cascade(alice_key, bob_key, qber, with_trace=False)
    return cascade_instance.run()


def run_cascade_with_trace(alice_key, bob_key, qber):
    cascade_instance = Cascade(alice_key, bob_key, qber, with_trace=True)
    return cascade_instance.run()

