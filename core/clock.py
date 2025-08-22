from .signal import Signal
import math

class Clock(Signal):
    """Digital clock with configurable period and duty cycle.

    Value at absolute time t (time_step starts at 0):
      val(t) = 1 if (t % period) >= low_duration else 0

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
        super().__init__(name=name, value=0)
        if period < 2:
            raise ValueError("Clock period must be at least 2 time units")
        if not (0.0 < duty_cycle < 1.0):
            raise ValueError("Duty cycle must be strictly between 0 and 1")

        self.period = period
        self.duty_cycle = duty_cycle
        # Robustly calculate the duration of the HIGH and LOW phases
        high_duration = math.ceil(self.period * self.duty_cycle)
        self.low_duration = self.period - high_duration

    def update(self, time_step: int):
        """
        Updates the clock's value based on the current simulation time step.
        This now implements a LOW-first clock.
        """
        if self.period <= 0:
            self.set_value(0)
            return

        time_in_cycle = time_step % self.period
        
        # The clock is HIGH only after the LOW duration has passed.
        if time_in_cycle >= self.low_duration:
            self.set_value(1)
        else:
            self.set_value(0)
