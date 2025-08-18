from .signal import Signal
from .clock import Clock


class DFlipFlop:
    """
    A basic D-type Flip-Flop with synchronous reset.
    Captures the input D on the rising edge of CLK and updates Q.
    If reset is HIGH at the rising edge, Q is forced to 0.
    """

    def __init__(self, name: str, d: Signal, clk: Clock, q: Signal, reset: Signal = None):
        """
        Initialize the D Flip-Flop.
        :param name: Instance name
        :param d: Data input signal
        :param clk: Clock signal (must be Clock type or derived)
        :param q: Output signal
        :param reset: Optional reset signal (active HIGH)
        """
        self.name = name
        self.d = d
        self.clk = clk
        self.q = q
        self.reset = reset

        self._prev_clk = self.clk.get()  # track last clock value to detect edges

        # Initialize output to 0 on reset or default
        self.q.set(0)

    def update(self):
        """
        Called every simulation step.
        Checks for rising edge of clock and updates Q.
        """
        current_clk = self.clk.get()

        # Detect rising edge (0 -> 1)
        if self._prev_clk == 0 and current_clk == 1:
            if self.reset is not None and self.reset.get() == 1:
                # reset dominates
                self.q.set(0)
            else:
                # normal operation: latch D into Q
                self.q.set(self.d.get())

        self._prev_clk = current_clk

    def __repr__(self):
        return f"DFF({self.name}, D={self.d.get()}, Q={self.q.get()}, CLK={self.clk.get()})"
