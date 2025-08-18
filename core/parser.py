"""
netlist_parser.py

A minimal, robust parser for a tiny text-based netlist language.

Language (case-insensitive keywords, names are case-sensitive):
    CIRCUIT <Name>
    INPUT   a, b, ...
    OUTPUT  y, z, ...
    SIGNAL  internal1, internal2, ...        # optional internal wires
    GATE <gateName> <TYPE> <IN1> <IN2> <OUT> # for 2-input gates
    GATE <gateName> NOT <IN> <OUT>           # for NOT (1-input)

Comments:
    - Lines starting with '#' or '//' are ignored.
    - Empty lines are ignored.
    - Commas between names are optional (INPUT a b c  or  INPUT a, b, c)

Supported gate types:
    AND, OR, XOR, NOT   (easy to add more later)

Parsing strategy:
    - Read line-by-line (no heavy tokenizer).
    - Split tokens by whitespace and commas.
    - Validate identifiers.
    - Build a Circuit with inputs/outputs/gates.
    - Ensure signals dictionary contains any referenced nets (to avoid KeyError).

Errors:
    - Clear messages with line numbers for quick debugging.
"""

from __future__ import annotations
import re
from typing import List

from core.circuit import Circuit
from core.signal import Signal
from core.gates import AndGate, OrGate, NotGate, XorGate


_NAME_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


class NetlistParseError(Exception):
    """Raised for any netlist parsing error with a helpful message."""


class NetlistParser:
    """Parses a small netlist language into a Circuit object."""

    GATE_MAP = {
        "AND": AndGate,
        "OR": OrGate,
        "XOR": XorGate,
        "NOT": NotGate,
    }

    def __init__(self, text: str):
        self.text = text
        self.circuit: Circuit | None = None

    # ---------- public API ----------

    def parse(self) -> Circuit:
        """Parse the netlist text and return a fully wired Circuit."""
        lines = self._preprocess(self.text)
        for lineno, line in lines:
            if not line:
                continue
            head, *rest = self._split(line)
            head_u = head.upper()

            if head_u == "CIRCUIT":
                self._parse_circuit(lineno, rest)

            elif head_u == "INPUT":
                self._require_circuit(lineno)
                for name in self._parse_names(rest, lineno):
                    self._assert_name(name, lineno)
                    self._add_input(name)

            elif head_u == "OUTPUT":
                self._require_circuit(lineno)
                for name in self._parse_names(rest, lineno):
                    self._assert_name(name, lineno)
                    self._add_output(name)

            elif head_u == "SIGNAL":
                self._require_circuit(lineno)
                for name in self._parse_names(rest, lineno):
                    self._assert_name(name, lineno)
                    self._ensure_signal(name)

            elif head_u == "GATE":
                self._require_circuit(lineno)
                self._parse_gate(lineno, rest)

            else:
                raise NetlistParseError(f"[line {lineno}] Unknown directive '{head}'")

        if self.circuit is None:
            raise NetlistParseError("No CIRCUIT defined.")
        return self.circuit

    # ---------- helpers ----------

    def _preprocess(self, text: str) -> List[tuple[int, str]]:
        """Strip comments and blank lines; keep line numbers for error messages."""
        logical_lines: List[tuple[int, str]] = []
        for i, raw in enumerate(text.splitlines(), start=1):
            line = raw.strip()
            if not line:
                logical_lines.append((i, "")); continue
            if line.startswith("#") or line.startswith("//"):
                logical_lines.append((i, "")); continue
            # allow inline comments after ' #' or ' //'
            for marker in (" #", " //"):
                p = line.find(marker)
                if p != -1:
                    line = line[:p].strip()
            logical_lines.append((i, line))
        return logical_lines

    def _split(self, line: str) -> List[str]:
        """Split by whitespace and commas, remove empties."""
        parts = re.split(r"[,\s]+", line.strip())
        return [p for p in parts if p]

    def _parse_names(self, parts: List[str], lineno: int) -> List[str]:
        if not parts:
            raise NetlistParseError(f"[line {lineno}] Expected one or more names.")
        return parts

    def _assert_name(self, name: str, lineno: int):
        if not _NAME_RE.match(name):
            raise NetlistParseError(f"[line {lineno}] Invalid name '{name}'.")

    def _require_circuit(self, lineno: int):
        if self.circuit is None:
            raise NetlistParseError(f"[line {lineno}] 'CIRCUIT' must appear before this directive.")

    def _parse_circuit(self, lineno: int, rest: List[str]):
        if self.circuit is not None:
            raise NetlistParseError(f"[line {lineno}] Multiple CIRCUIT declarations.")
        if not rest:
            raise NetlistParseError(f"[line {lineno}] CIRCUIT requires a name.")
        name = rest[0]
        self._assert_name(name, lineno)
        self.circuit = Circuit(name)

    def _add_input(self, name: str):
        # If an input already exists as a signal, keep it; otherwise create.
        if name not in self.circuit.signals:
            self.circuit.add_input(name)
        else:
            # ensure it is listed as input
            if all(s.name != name for s in self.circuit.inputs):
                self.circuit.inputs.append(self.circuit.signals[name])

    def _add_output(self, name: str):
        if name not in self.circuit.signals:
            self.circuit.add_output(name)
        else:
            if all(s.name != name for s in self.circuit.outputs):
                self.circuit.outputs.append(self.circuit.signals[name])

    def _ensure_signal(self, name: str):
        if name not in self.circuit.signals:
            self.circuit.signals[name] = Signal(name)

    def _parse_gate(self, lineno: int, parts: List[str]):
        """
        GATE <gateName> <TYPE> <IN1> <IN2> <OUT>
        GATE <gateName> NOT <IN> <OUT>
        """
        if len(parts) < 4:
            raise NetlistParseError(f"[line {lineno}] GATE requires at least 4 tokens.")
        gate_name = parts[0]
        gate_type = parts[1].upper()
        self._assert_name(gate_name, lineno)

        gate_cls = self.GATE_MAP.get(gate_type)
        if gate_cls is None:
            raise NetlistParseError(f"[line {lineno}] Unsupported gate type '{gate_type}'")

        if gate_type == "NOT":
            if len(parts) != 4:
                raise NetlistParseError(f"[line {lineno}] NOT form: GATE <name> NOT <IN> <OUT>")
            in1, out = parts[2], parts[3]
            # make sure signals exist in the circuit dictionary
            self._ensure_signal(in1)
            self._ensure_signal(out)
            gate = gate_cls(gate_name, [in1], out)
        else:
            if len(parts) != 5:
                raise NetlistParseError(f"[line {lineno}] {gate_type} form: GATE <name> {gate_type} <IN1> <IN2> <OUT>")
            in1, in2, out = parts[2], parts[3], parts[4]
            self._ensure_signal(in1)
            self._ensure_signal(in2)
            self._ensure_signal(out)
            gate = gate_cls(gate_name, [in1, in2], out)

        self.circuit.add_gate(gate)
