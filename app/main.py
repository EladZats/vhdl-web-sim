from core.parser import NetlistParser

def run_demo():
    net = """
    CIRCUIT HalfAdder
    INPUT a, b
    OUTPUT sum, carry
    GATE g1 XOR a b sum
    GATE g2 AND a b carry
    """
    circuit = NetlistParser(net).parse()

    while True:
        try:
            raw = input("Enter inputs a,b (or 'q' to quit): ")
            if raw.lower() == "q":
                break

            a_str, b_str = raw.strip().split(",")
            a, b = int(a_str), int(b_str)

            circuit.set_inputs({"a": a, "b": b})
            circuit.evaluate()
            print("Outputs:", circuit.get_outputs())
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    run_demo()
