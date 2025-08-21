from core.signal import Signal
from core.clock import Clock
from core.flipflop import DFlipFlop
from core.simulator import Simulator


def main():
    # יצירת אותות
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d_in = Signal("d_in", init=0)   # קלט ראשי
    q1 = Signal("q1")               # פלט FF1
    q2 = Signal("q2")               # פלט FF2
    not_out = Signal("not_out")     # חיבור בין FF1 ל-FF2 דרך NOT

    # יצירת FF
    ff1 = DFlipFlop(d_in, clk, q1, reset=0)
    ff2 = DFlipFlop(not_out, clk, q2, reset=0)

    # סימולטור
    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d_in)
    sim.add_signal(q1)
    sim.add_signal(q2)
    sim.add_signal(not_out)
    sim.add_flipflop(ff1)
    sim.add_flipflop(ff2)

    # פונקציה פשוטה ל-NOT
    def update_not():
        not_out.set(0 if q1.get() == 1 else 1)

    # הרצה 20 צעדים (10 מחזורי שעון)
    print("Starting simulation...\n")
    for t in range(20):
        # באמצע (בצעד 10) נשנה את הקלט
        if t == 10:
            d_in.set(1)

        update_not()
        sim.step()
        print(f"t={sim.time:02d} | d_in={d_in.get()} | q1={q1.get()} | not_out={not_out.get()} | q2={q2.get()}")

    # טבלת אמת – נריץ על כל האפשרויות של d_in (0,1)
    print("\nTruth table for one cycle (D -> Q1 -> NOT -> Q2):")
    print(" D_in | Q1 | NOT(Q1) | Q2 ")
    print("------+----+---------+----")
    for dval in [0, 1]:
        d_in.set(dval)
        sim.run(2, verbose=False)  # מחזור אחד מלא
        update_not()
        print(f"  {dval}   | {q1.get()}  |    {not_out.get()}    | {q2.get()}")


if __name__ == "__main__":
    main()
