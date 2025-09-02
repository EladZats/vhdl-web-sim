from core.signal import Signal
from core.clock import Clock
from core.flipflop import DFlipFlop
from core.simulator import Simulator


def main():
    # Create signals
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d_in = Signal("d_in", value=0)  # Primary input
    q1 = Signal("q1")               # Output of FF1
    q2 = Signal("q2")               # Output of FF2
    not_out = Signal("not_out")     # Connection between FF1 and FF2 through NOT

    # Create flip-flops (no reset parameter in your class)
    ff1 = DFlipFlop(d_in, clk, q1, name="ff1")
    ff2 = DFlipFlop(not_out, clk, q2, name="ff2")

    # Create simulator
    sim = Simulator(circuit=None)  # if your Simulator requires circuit, adjust accordingly
    sim.add_clock(clk)
    sim.add_signal(d_in)
    sim.add_signal(q1)
    sim.add_signal(q2)
    sim.add_signal(not_out)
    sim.add_flipflop(ff1)
    sim.add_flipflop(ff2)

    # Simple NOT function
    def update_not():
        not_out.set_value(0 if q1.get_value() == 1 else 1)

    # Run simulation for 20 steps (10 clock cycles)
    print("Starting simulation...\n")
    for t in range(20):
        # Change input at step 10
        if t == 10:
            d_in.set_value(1)

        update_not()
        sim.step()
        print(
            f"t={sim.time:02d} | d_in={d_in.get_value()} | q1={q1.get_value()} | "
            f"not_out={not_out.get_value()} | q2={q2.get_value()}"
        )

    # Generate truth table for one cycle (D -> Q1 -> NOT -> Q2)
    print("\nTruth table for one cycle (D -> Q1 -> NOT -> Q2):")
    print(" D_in | Q1 | NOT(Q1) | Q2 ")
    print("------+----+---------+----")
    for dval in [0, 1]:
        d_in.set_value(dval)
        sim.run(2, verbose=False)  # Run one full cycle
        update_not()
        print(f"  {dval}   | {q1.get_value()}  |    {not_out.get_value()}    | {q2.get_value()}")


if __name__ == "__main__":
    main()
