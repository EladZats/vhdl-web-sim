from .signal import Signal
from .clock import Clock
from typing import Dict


class DFlipFlop:
    """
    Represents a D-type flip-flop.
    On the clock's rising edge, the output Q gets the value of the input D.
    """

    def __init__(self, d: Signal, clk: Clock, q: Signal, name: str = "dff"):
        self.name = name
        self.d = d
        self.clk = clk
        self.q = q

        # State for edge detection. Initialize to None to handle the first cycle.
        self.prev_clk_state = None

        # Initialize output to a known state (e.g., 0)
        self.q.set_value(0)

    def update(self):
        """
        This method should be called at each time step of the simulation.
        It checks for a rising edge and updates the output accordingly.
        """
        current_clk_state = self.clk.get_value()

        # A rising edge occurs if the previous state was 0 and the current is 1.
        # self.prev_clk_state is not None ensures we don't trigger on the very first step if clock starts at 1.
        if self.prev_clk_state == 0 and current_clk_state == 1:
            # Sample the input D and update the output Q
            self.q.set_value(self.d.get_value())

        # Crucially, update the previous state for the next time step's check.
        self.prev_clk_state = current_clk_state

    def __repr__(self):
        return f"DFF(D={self.d.name}, CLK={self.clk.name}, Q={self.q.name})"


def simulate(self, steps: int, inputs_map: Dict[str, str]):
    # ... (setup logic) ...

    for t in range(steps):
        # 1. Update all clocks to set their value for this time step
        for clock in self.clocks:
            clock.update(t)

        # 2. Update all gates and flip-flops
        #    The DFF's update method will handle the clock edge detection
        for _ in range(len(self.gates) + len(self.flipflops)):  # Iterate enough times
            for gate in self.gates:
                gate.update()
            # No need for a separate flipflop loop if they are added to gates list

        # 3. Record waveforms
        # ... (rest of the simulation) ...
