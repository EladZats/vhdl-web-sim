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
  }
];
