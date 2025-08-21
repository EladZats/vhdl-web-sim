from .signal import Signal
from .clock import Clock


class DFlipFlop:
    """Positive-edge triggered D Flip-Flop with delayed commit.

    Behavior:
      - On each tick(), first commit the previously scheduled value into Q.
      - If a rising edge (0->1) is detected on CLK this tick, sample D into _next_q.
      - Effect: Q updates one simulation step after the rising edge (delayed commit).
    """

    def __init__(self, d: Signal, clk: Clock, q: Signal, reset: int = 0):
        """
        :param d: Data input signal
        :param clk: Clock signal (rising-edge detected)
        :param q: Output signal driven by the FF
        :param reset: Initial reset flag (if 1, start with Q=0; if 0, also start at Q=0 by default)
        """
        self.d = d
        self.clk = clk
        self.q = q

        # Start in a known state: Q=0
        self.q.set(0)

        # The value to be committed to Q on the next tick
        self._next_q = 0

        # Track previous clock value for edge detection
        self._prev_clk = self.clk.get()

    def tick(self):
        """Advance one simulation step for the FF (delayed commit)."""
        # 1) Commit previously scheduled value to Q
        self.q.set(self._next_q)

        # 2) Edge detection and sample D on rising edge
        clk_now = self.clk.get()
        if self._prev_clk == 0 and clk_now == 1:
            # Schedule D to appear on Q at the NEXT tick
            self._next_q = self.d.get()

        # 3) Update previous clock state
        self._prev_clk = clk_now

    def flush(self):
        """Commit the pending _next_q into Q without advancing time.
        Used at the end of a run() so that final state reflects last captured D.
        """
        self.q.set(self._next_q)

    def reset_ff(self):
        """Asynchronous reset: force Q to 0 now and clear the next scheduled value."""
        self._next_q = 0
        self.q.set(0)

    # Optional alias if you prefer .reset()
    def reset(self):
        self.reset_ff()
