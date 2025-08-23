export const CIRCUIT_TEMPLATES = [
  {
    label: "Half Adder (HA)",
    value: `CIRCUIT half_adder
INPUT a
INPUT b
OUTPUT sum
OUTPUT cout
GATE xor1 XOR a b sum
GATE and1 AND a b cout`
  },
  {
    label: "Full Adder (FA)",
    value: `CIRCUIT full_adder
INPUT a
INPUT b
INPUT cin
OUTPUT sum
OUTPUT cout
SIGNAL s1
SIGNAL s2
SIGNAL s3
GATE xor1 XOR a b s1
GATE xor2 XOR s1 cin sum
GATE and1 AND a b s2
GATE and2 AND s1 cin s3
GATE or1 OR s2 s3 cout`
  },
  {
    label: "D Latch",
    value: `CIRCUIT d_latch
INPUT d
INPUT enable
OUTPUT q
OUTPUT qn
SIGNAL d_and_en
SIGNAL en_and_qn
GATE and1 AND d enable d_and_en
GATE not1 NOT q qn
GATE and2 AND enable qn en_and_qn
GATE or1 OR d_and_en en_and_qn q`
  },
  {
    label: "D Flip-Flop",
    value: `CIRCUIT d_flipflop
INPUT d
OUTPUT q
OUTPUT qn
SIGNAL clk
SIGNAL nclk
SIGNAL master_q
SIGNAL master_qn
SIGNAL slave_q
SIGNAL slave_qn
CLOCK clk PERIOD 4 DUTY 0.5
GATE not1 NOT clk nclk

-- Master stage (transparent on clock low)
SIGNAL md_and_nclk
SIGNAL nclk_and_mqn
GATE and1 AND d nclk md_and_nclk
GATE not2 NOT master_q master_qn
GATE and2 AND nclk master_qn nclk_and_mqn
GATE or1 OR md_and_nclk nclk_and_mqn master_q

-- Slave stage (transparent on clock high)
SIGNAL mq_and_clk
SIGNAL clk_and_sqn
GATE and3 AND master_q clk mq_and_clk
GATE not3 NOT q qn
GATE and4 AND clk qn clk_and_sqn
GATE or2 OR mq_and_clk clk_and_sqn q`
  },
  {
    label: "2-to-1 Multiplexer",
    value: `CIRCUIT mux_2to1
INPUT a
INPUT b
INPUT sel
OUTPUT y
SIGNAL nsel
SIGNAL s1
SIGNAL s2
GATE not1 NOT sel nsel
GATE and1 AND a nsel s1
GATE and2 AND b sel s2
GATE or1 OR s1 s2 y`
  },
  {
    label: "SR Latch",
    value: `CIRCUIT sr_latch
INPUT s
INPUT r
OUTPUT q
OUTPUT qn
SIGNAL s_and_qn
SIGNAL r_and_q
GATE and1 AND s qn s_and_qn
GATE and2 AND r q r_and_q
GATE not1 NOT r_and_q q
GATE not2 NOT s_and_qn qn`
  },
  {
    label: "4-bit Register",
    value: `CIRCUIT register_4bit
INPUT d0
INPUT d1
INPUT d2
INPUT d3
OUTPUT q0
OUTPUT q1
OUTPUT q2
OUTPUT q3
SIGNAL clk
SIGNAL nclk
CLOCK clk PERIOD 4 DUTY 0.5
GATE not1 NOT clk nclk

-- Bit 0
SIGNAL m0q, m0qn
SIGNAL m0d_and_nclk, m0nclk_and_mqn
GATE and1 AND d0 nclk m0d_and_nclk
GATE not2 NOT m0q m0qn
GATE and2 AND nclk m0qn m0nclk_and_mqn
GATE or1 OR m0d_and_nclk m0nclk_and_mqn m0q
GATE not3 NOT m0q q0

-- Bit 1
SIGNAL m1q, m1qn
SIGNAL m1d_and_nclk, m1nclk_and_mqn
GATE and3 AND d1 nclk m1d_and_nclk
GATE not4 NOT m1q m1qn
GATE and4 AND nclk m1qn m1nclk_and_mqn
GATE or2 OR m1d_and_nclk m1nclk_and_mqn m1q
GATE not5 NOT m1q q1

-- Bit 2
SIGNAL m2q, m2qn
SIGNAL m2d_and_nclk, m2nclk_and_mqn
GATE and5 AND d2 nclk m2d_and_nclk
GATE not6 NOT m2q m2qn
GATE and6 AND nclk m2qn m2nclk_and_mqn
GATE or3 OR m2d_and_nclk m2nclk_and_mqn m2q
GATE not7 NOT m2q q2

-- Bit 3
SIGNAL m3q, m3qn
SIGNAL m3d_and_nclk, m3nclk_and_mqn
GATE and7 AND d3 nclk m3d_and_nclk
GATE not8 NOT m3q m3qn
GATE and8 AND nclk m3qn m3nclk_and_mqn
GATE or4 OR m3d_and_nclk m3nclk_and_mqn m3q
GATE not9 NOT m3q q3`
  }
];