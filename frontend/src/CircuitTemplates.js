export const CIRCUIT_TEMPLATES = [
  {
    label: "Half Adder (HA)",
    value: `CIRCUIT half_adder
INPUT a
INPUT b
OUTPUT sum
OUTPUT cout
-- sum = a XOR b
GATE xor1 XOR a b sum
-- cout = a AND b = NOT(a NAND b)
SIGNAL nand_out
GATE nand1 NAND a b nand_out
GATE not1 NOT nand_out cout`
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
-- sum = a XOR b XOR cin
GATE xor1 XOR a b s1
GATE xor2 XOR s1 cin sum
-- cout = (a AND b) OR (s1 AND cin)
SIGNAL nand1_out
SIGNAL nand2_out
SIGNAL nand3_out
SIGNAL nand4_out
-- a AND b = NOT(a NAND b)
GATE nand1 NAND a b nand1_out
GATE not1 NOT nand1_out s2
-- s1 AND cin = NOT(s1 NAND cin)
GATE nand2 NAND s1 cin nand2_out
GATE not2 NOT nand2_out s3
-- cout = s2 OR s3 = NOT(s2 NOR s3)
GATE nor1 NOR s2 s3 nand3_out
GATE not3 NOT nand3_out cout`
  },
  {
    label: "D Latch",
    value: `CIRCUIT d_latch
INPUT d
INPUT enable
OUTPUT q
OUTPUT qn
-- Use NAND structure for latch
SIGNAL d_en
SIGNAL q_int
SIGNAL qn_int
GATE nand1 NAND d enable d_en
GATE nand2 NAND d_en qn q_int
GATE nand3 NAND enable q qn_int
GATE nand4 NAND q_int qn_int q
GATE not1 NOT q qn`
  },
  {
    label: "D Flip-Flop",
    value: `CIRCUIT d_flipflop
INPUT d
OUTPUT q
OUTPUT qn
SIGNAL clk
CLOCK clk PERIOD 4 DUTY 0.5
-- Classic DFF using NAND/NOR gates
SIGNAL nclk
GATE not1 NOT clk nclk
SIGNAL s, r, nq, nq2
GATE nand1 NAND d nclk s
GATE nand2 NAND s nq q
GATE nand3 NAND q clk nq
GATE nand4 NAND nq d nq2
GATE nor1 NOR q qn qn`
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
-- s1 = a AND ~sel = NOT(a NAND nsel)
SIGNAL nand1_out
GATE nand1 NAND a nsel nand1_out
GATE not2 NOT nand1_out s1
-- s2 = b AND sel = NOT(b NAND sel)
SIGNAL nand2_out
GATE nand2 NAND b sel nand2_out
GATE not3 NOT nand2_out s2
-- y = s1 OR s2 = NOT(s1 NOR s2)
SIGNAL nor_out
GATE nor1 NOR s1 s2 nor_out
GATE not4 NOT nor_out y`
  },
  {
    label: "SR Latch",
    value: `CIRCUIT sr_latch
INPUT s
INPUT r
OUTPUT q
OUTPUT qn
-- Classic cross-coupled NOR latch
GATE nor1 NOR s qn q
GATE nor2 NOR r q qn`
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
CLOCK clk PERIOD 4 DUTY 0.5

-- Four D latches implemented with NAND gates
SIGNAL nclk
GATE not1 NOT clk nclk

-- Bit 0
SIGNAL s0, r0
GATE nand1 NAND d0 nclk s0
GATE nand2 NAND s0 qn0 q0
GATE nand3 NAND nclk q0 r0
GATE nand4 NAND r0 d0 qn0

-- Bit 1
SIGNAL s1, r1
GATE nand5 NAND d1 nclk s1
GATE nand6 NAND s1 qn1 q1
GATE nand7 NAND nclk q1 r1
GATE nand8 NAND r1 d1 qn1

-- Bit 2
SIGNAL s2, r2
GATE nand9 NAND d2 nclk s2
GATE nand10 NAND s2 qn2 q2
GATE nand11 NAND nclk q2 r2
GATE nand12 NAND r2 d2 qn2

-- Bit 3
SIGNAL s3, r3
GATE nand13 NAND d3 nclk s3
GATE nand14 NAND s3 qn3 q3
GATE nand15 NAND nclk q3 r3
GATE nand16 NAND r3 d3 qn3`
  }
];
