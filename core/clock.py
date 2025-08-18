from core.signal import Signal

class Clock(Signal):
    """Digital clock with configurable period and duty cycle.

    Value at absolute time t (t starts at 1 on first tick):
      val(t) = 1 if ((t - 1) % period) >= low_time else 0

    Examples:
      - period=4, duty=0.5  -> 0,0,1,1,0,0,1,1,...
      - period=4, duty=0.25 -> 0,0,0,1,0,0,0,1,...
      - period=2, duty=0.5  -> 0,1,0,1,0,1,...
    """

    def __init__(self, name: str = "clk", period: int = 4, duty_cycle: float = 0.5):
        """
        :param name: Clock name
        :param period: Full cycle length in time units (>= 2)
        :param duty_cycle: Fraction of cycle HIGH (0.0 < duty < 1.0)
        """
        super().__init__(name, init=0)
        if period < 2:
            raise ValueError("Clock period must be at least 2 time units")
        if not (0.0 < duty_cycle < 1.0):
            raise ValueError("Duty cycle must be strictly between 0 and 1")

        self.period = period
        self.duty_cycle = duty_cycle

        # Compute HIGH/LOW durations and ensure both phases exist
        self.high_time = max(1, min(int(round(self.period * self.duty_cycle)), self.period - 1))
        self.low_time = self.period - self.high_time

        # Absolute time counter; t=0 is the initial state (already in history)
        self.t = 0

    def tick(self):
        """Advance one time unit and update clock value based on t."""
        self.t += 1
        pos = (self.t - 1) % self.period
        self.set(1 if pos >= self.low_time else 0)
