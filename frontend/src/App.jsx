import React, { useState, useMemo, useRef, useEffect } from "react";
import { Play, Settings, HelpCircle, Library, AlertTriangle, Dices, Copy } from "lucide-react";
import NetlistEditor from './NetlistEditor';
import WaveformViewer from './WaveformViewer';
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/themes/prism-tomorrow.css";
import getCaretCoordinates from "textarea-caret";
import { StreamLanguage } from '@codemirror/language';
import { vhdl } from '@codemirror/legacy-modes/mode/vhdl';
import { autocompletion } from '@codemirror/autocomplete';
import { CIRCUIT_TEMPLATES } from './CircuitTemplates';

// --- Live Netlist Validator (based on your Python parser) ---
const validateNetlist = (text) => {
  const errors = [];
  const lines = text.split("\n");
  let circuitDeclared = false;
  const declaredSignals = new Set();
  const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;

  lines.forEach((line, index) => {
    const lineno = index + 1;
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#") || trimmedLine.startsWith("--")) {
      return; // Skip empty/comment lines
    }

    const tokens = trimmedLine.split(/[,\s]+/).filter(Boolean);
    const directive = tokens[0]?.toUpperCase();
    const args = tokens.slice(1);

    if (!circuitDeclared && !["CIRCUIT"].includes(directive)) {
      errors.push({ lineno, message: "The 'CIRCUIT' directive must be the first command." });
      return;
    }

    switch (directive) {
      case "CIRCUIT":
        if (circuitDeclared) errors.push({ lineno, message: "Multiple CIRCUIT declarations found." });
        if (args.length !== 1) errors.push({ lineno, message: "CIRCUIT requires exactly one name." });
        else if (!nameRegex.test(args[0])) errors.push({ lineno, message: `Invalid circuit name: '${args[0]}'.` });
        circuitDeclared = true;
        break;
      case "INPUT":
      case "OUTPUT":
      case "SIGNAL":
        if (args.length === 0) errors.push({ lineno, message: `${directive} requires at least one signal name.` });
        args.forEach(name => {
          if (!nameRegex.test(name)) errors.push({ lineno, message: `Invalid signal name: '${name}'.` });
          declaredSignals.add(name);
        });
        break;
      case "GATE":
        if (args.length < 4) errors.push({ lineno, message: "Incomplete GATE definition." });
        else {
          const gateType = args[1]?.toUpperCase();
          const expectedLen = gateType === "NOT" ? 4 : 5;
          if (args.length !== expectedLen) errors.push({ lineno, message: `Incorrect number of arguments for a ${gateType} gate.` });
          // Check if signals are declared (simple check)
          args.slice(2).forEach(name => {
            if (!declaredSignals.has(name)) errors.push({ lineno, message: `Signal '${name}' is used but not declared.` });
          });
        }
        break;
      case "CLOCK":
      case "DFF":
        // Basic checks, can be expanded
        break;
      default:
        errors.push({ lineno, message: `Unknown directive '${tokens[0]}'.` });
    }
  });
  return errors;
};


// Basic VHDL-like syntax highlighting for the netlist
languages.netlist = {
  keyword: /\b(CIRCUIT|INPUT|OUTPUT|SIGNAL|CLOCK|GATE|PERIOD|DUTY|NAND|NOR|XOR|XNOR|AND|OR|NOT)\b/i,
  number: /\b\d+(\.\d+)?\b/,
  comment: /--.*/,
  "string-literal": {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true,
  },
};

// --- Suggestion Engine ---
const KEYWORDS = ["CIRCUIT", "INPUT", "OUTPUT", "SIGNAL", "CLOCK", "GATE", "PERIOD", "DUTY", "DFF"];
const GATE_TYPES = ["NAND", "NOR", "XOR", "XNOR", "AND", "OR", "NOT"];

const getSuggestions = (line, word, declaredSignals) => {
  const upperLine = line.toUpperCase();
  if (upperLine.includes("GATE") && !GATE_TYPES.some(g => upperLine.includes(g))) {
    return GATE_TYPES.filter(g => g.startsWith(word.toUpperCase()));
  }
  if (word) {
    const allSuggestions = [...KEYWORDS, ...GATE_TYPES, ...Array.from(declaredSignals)];
    return allSuggestions.filter(s => s.toLowerCase().startsWith(word.toLowerCase()) && s.toLowerCase() !== word.toLowerCase());
  }
  return [];
};


// --- Custom Syntax Highlighting & Autocompletion ---

// 1. Define all keywords in lowercase for the highlighter
const customKeywords = { ...vhdl.keywords, dff: true };

// 2. Create a new language object that forces case-insensitivity
const customVHDL = {
  ...vhdl,
  keywords: customKeywords,
  ignoreCase: true, // Explicitly tell the highlighter to ignore case
};

// 3. Define the list of words for autocompletion (can be uppercase for readability)
const completionKeywords = [
  "CIRCUIT", "INPUT", "OUTPUT", "SIGNAL", "GATE", "CLOCK", "DFF",
   "PERIOD", "DUTY", "NAND", "NOR", "XNOR" , "AND", "OR", "NOT", "XOR"
].map(label => ({ label, type: "keyword" }));

// 4. Create a custom completion source function
const myCompletions = (context) => {
  let word = context.matchBefore(/\w*/);
  if (word.from == word.to && !context.explicit) {
    return null;
  }
  return {
    from: word.from,
    options: completionKeywords
  };
};


// --- Catalog of Netlist Templates ---
const TEMPLATES = [
  {
    label: "Basic AND Gate",
    value: `CIRCUIT and_gate
INPUT a
INPUT b
OUTPUT y
GATE g1 AND a b y
`,
  },
  {
    label: "Basic OR Gate",
    value: `CIRCUIT or_gate
INPUT a
INPUT b
OUTPUT y
GATE g1 OR a b y
`,
  },
  {
    label: "NOT Gate",
    value: `CIRCUIT not_gate
INPUT a
OUTPUT y
GATE g1 NOT a y
`,
  },
  {
    label: "NAND Gate",
    value: `CIRCUIT nand_gate
INPUT a
INPUT b
OUTPUT y
GATE g1 NAND a b y
`,
  },
  {
    label: "NOR Gate",
    value: `CIRCUIT nor_gate
INPUT a
INPUT b
OUTPUT y
GATE g1 NOR a b y
`,
  },
  {
    label: "XOR Gate",
    value: `CIRCUIT xor_gate
INPUT a
INPUT b
OUTPUT y
GATE g1 XOR a b y
`,
  },
  {
    label: "XNOR Gate",
    value: `CIRCUIT xnor_gate
INPUT a
INPUT b
OUTPUT y
GATE g1 XNOR a b y
`,
  },
  {
    label: "D Flip-Flop",
    value: `CIRCUIT dff_circuit
INPUT d
INPUT clk
OUTPUT q
DFF dff1 D dff_clk q
CLOCK clk PERIOD 10 DUTY 50
`,
  },
  {
    label: "Clock Signal",
    value: `CIRCUIT clock_circuit
OUTPUT clk
CLOCK clk PERIOD 10 DUTY 50
`,
  },
];

// --- Custom Highlighter Plugin ---
const keywordMap = {
  "CIRCUIT": "keyword-circuit",
  "INPUT": "keyword-io",
  "OUTPUT": "keyword-io",
  "SIGNAL": "keyword-signal",
  "CLOCK": "keyword-clock",
  "GATE": "keyword-component",
  "DFF": "keyword-component", // <-- THIS IS THE FIX. It now has the same style as GATE.
  "AND": "keyword-operator",
  "OR": "keyword-operator",
  "NOT": "keyword-operator",
  "XOR": "keyword-operator",
  "PERIOD": "keyword-parameter",
  "DUTY": "keyword-parameter",
  "NAND": "keyword-operator",
  "NOR": "keyword-operator",
  "XNOR": "keyword-operator"
};

export default function App() {
  // Add these state declarations at the top
  const [netlist, setNetlist] = useState(
    "CIRCUIT DEMO\nINPUT a\nINPUT b\nOUTPUT y\nSIGNAL s1\nCLOCK clk PERIOD 4 DUTY 0.5\nGATE g1 AND a b s1\nGATE g2 NOT s1 y"
  );
  const [steps, setSteps] = useState(50);
  const [inputsMap, setInputsMap] = useState({});
  const [waveforms, setWaveforms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [parseErrors, setParseErrors] = useState([]);
  const [inputPeriod, setInputPeriod] = useState(1); // State for the input period
  const [validationError, setValidationError] = useState(null); // New state for validation error

  // --- State for Auto-Suggestions ---
  const editorRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });

  // State to control help guide visibility
  const [showHelp, setShowHelp] = useState(false);

  // Ref for templates dropdown
  const templatesRef = useRef(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Run validator whenever netlist changes
  useEffect(() => {
    const errors = validateNetlist(netlist);
    setParseErrors(errors);

    // Set validation error state (new logic)
    if (errors.length > 0) {
      setValidationError(errors[0]);
    } else {
      setValidationError(null);
    }
  }, [netlist]);

  // Parse the netlist in real-time to find input definitions, preserving case
  const definedInputs = useMemo(() => {
    return netlist
      .split("\n")
      .map((line) => line.trim()) // Trim whitespace
      .filter((line) => line.toUpperCase().startsWith("INPUT ")) // Check for 'INPUT' case-insensitively
      .map((line) => line.split(/\s+/)[1]) // Extract the name with its original case
      .filter(Boolean); // remove any empty results
  }, [netlist]);

  const declaredSignals = useMemo(() => {
    const signals = new Set();
    netlist.split("\n").forEach(line => {
      const upperLine = line.toUpperCase().trim();
      if (upperLine.startsWith("INPUT") || upperLine.startsWith("OUTPUT") || upperLine.startsWith("SIGNAL")) {
        line.split(/\s+/).slice(1).forEach(name => signals.add(name));
      }
    });
    return signals;
  }, [netlist]);

  const handleNetlistChange = (code) => {
    setNetlist(code);
    const textarea = editorRef.current?._input;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const line = code.substring(0, cursorPos).split("\n").pop() || "";
    const currentWordMatch = line.match(/(\w+)$/);
    const currentWord = currentWordMatch ? currentWordMatch[1] : "";

    const newSuggestions = getSuggestions(line, currentWord, declaredSignals);
    setSuggestions(newSuggestions);
    setActiveSuggestion(0);

    if (newSuggestions.length > 0) {
      const coords = getCaretCoordinates(textarea, cursorPos);
      setSuggestionPos({ top: coords.top + 20, left: coords.left });
    }
  };

  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const suggestion = suggestions[activeSuggestion];
        const textarea = editorRef.current._input;
        const cursorPos = textarea.selectionStart;
        const lineStart = netlist.lastIndexOf("\n", cursorPos - 1) + 1;
        const textToCursor = netlist.substring(0, cursorPos);
        const wordStart = textToCursor.search(/(\w+)$/);
        
        const newCode = 
          netlist.substring(0, lineStart + wordStart) +
          suggestion + " " +
          netlist.substring(cursorPos);

        setNetlist(newCode);
        setSuggestions([]);
      } else if (e.key === "Escape") {
        setSuggestions([]);
      }
    }
  };

  // Update the handleInputChange function
  const handleInputChange = (signal, value) => {
    // Clean input to only allow 0s and 1s
    const cleanValue = value.replace(/[^01]/g, '');
    
    // Store the original input value
    setInputsMap(prev => ({
      ...prev,
      [signal]: cleanValue  // Store original input without padding
    }));

    // When sending to simulation, expand based on period
    const getExpandedValue = (value) => {
      return value
        .split('')
        .map(bit => bit.repeat(inputPeriod))
        .join('');
    };

    // Log for debugging
    console.log(`Input ${signal}:`, {
      original: cleanValue,
      period: inputPeriod,
      expanded: getExpandedValue(cleanValue)
    });
  };

  // Update the handleRun function
  const handleRun = async () => {
    setLoading(true);
    setError(null);

    // Expand all input values according to period before sending
    const expandedInputs = Object.fromEntries(
      Object.entries(inputsMap).map(([signal, value]) => [
        signal,
        value.split('').map(bit => bit.repeat(inputPeriod)).join('').padEnd(steps, '0')
      ])
    );

    // This object is correctly defined with the right variables: `netlist` and `expandedInputs`
    const requestBody = {
      netlist: netlist.trim(),
      steps: Number(steps),
      inputs: expandedInputs
    };

    console.log('DEBUG - Sending inputs:', expandedInputs);

    try {
      const res = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // FIX: Use the `requestBody` object we just created.
        // The old code was using `netlistContent` and `inputs` which are not defined here.
        body: JSON.stringify(requestBody),
      });

      // This part is important for debugging the backend response
      const data = await res.json();
      console.log('Received data from server:', JSON.stringify(data, null, 2));

      if (!res.ok) {
        // Handle server-side errors
        const errorDetail = data.detail || `HTTP error! status: ${res.status}`;
        throw new Error(errorDetail);
      }

      if (!data || !data.waveforms || Object.keys(data.waveforms).length === 0) {
        throw new Error('No waveform data received');
      }
      setWaveforms(data.waveforms);
    } catch (error) {
      console.error('DEBUG - Error:', error);
      setError({ message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(netlist);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add this function inside the App component before the return statement
  const handleTemplateSelect = (template) => {
    // Add a newline if the current netlist doesn't end with one
    const separator = netlist.endsWith('\n') ? '' : '\n';
    setNetlist(netlist + separator + template.value);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white font-mono">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Netlist Simulator
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition"
            >
              <Library size={16} /> Templates
            </button>
            {showTemplates && (
              <div className="absolute z-50 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
                <div className="py-1">
                  {CIRCUIT_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                      onClick={() => {
                        handleTemplateSelect(template);
                        setShowTemplates(false);
                      }}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleRun}
            disabled={parseErrors.length > 0 || loading}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg shadow-md transition transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <Play size={18} /> {loading ? "Running..." : "Run"}
          </button>
          <button className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition">
            <Settings size={16} /> Settings
          </button>
          <button className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition">
            <HelpCircle size={16} /> Help
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: netlist + inputs */}
        <div className="w-1/2 p-4 flex flex-col space-y-4">
          {/* Netlist editor */}
          <div className="flex-1 flex flex-col bg-slate-800/50 p-4 rounded-xl shadow-lg border border-slate-700 relative">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-300">
                Netlist Editor
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-white transition text-xs flex items-center gap-1"
                >
                  <Copy size={14} />
                  {copied ? "Copied!" : "Copy"}
                </button>
                {/* Help Icon and Guide */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowHelp(true)}
                  onMouseLeave={() => setShowHelp(false)}
                >
                  <button className="text-slate-400 hover:text-white transition">
                    <HelpCircle size={16} />
                  </button>
                  {showHelp && (
                    <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 p-4 text-sm font-sans">
                      <h4 className="font-bold text-slate-100 mb-2 border-b border-slate-600 pb-1">
                        Netlist Syntax Guide
                      </h4>
                      <ul className="space-y-2 list-disc list-inside text-slate-300">
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">CIRCUIT name</code>: Declares the circuit. Must be the first command.
                        </li>
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">INPUT a b ...</code>: Declares one or more input signals.
                        </li>
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">OUTPUT y ...</code>: Declares one or more output signals.
                        </li>
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">SIGNAL s ...</code>: Declares one or more internal signals (wires).
                        </li>
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">GATE g_name type in1 [in2] out</code>: Defines a logic gate.
                          <ul className="pl-6 mt-1 text-xs text-slate-400 font-mono">
                            <li>`type` can be  NAND, NOR, XOR, XNOR, AND, OR, NOT .`</li>
                            <li>NOT gates have 1 input; others have 2.</li>
                            <li>Example: `GATE g1 AND a b y`</li>
                          </ul>
                        </li>
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">DFF dff_name D clk Q</code>: Defines a D-type flip-flop.
                          <ul className="pl-6 mt-1 text-xs text-slate-400 font-mono">
                            <li>`D` is data in, `clk` is the clock, `Q` is the output.</li>
                            <li>Example: `DFF my_dff d_in clk q_out`</li>
                          </ul>
                        </li>
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">CLOCK clk PERIOD 4 DUTY 0.5</code>: Defines a clock signal.
                        </li>
                        <li>
                          <code className="bg-slate-700 px-1 rounded font-mono">-- comment</code>: Lines starting with '--' are ignored.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="editor-container flex-1 bg-slate-950 font-mono rounded-lg border border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 overflow-hidden text-sm mt-3">
              <NetlistEditor
                value={netlist}
                onChange={handleNetlistChange}
              />
            </div>
            {/* Suggestions Box */}
            {suggestions.length > 0 && (
              <div
                className="absolute z-10 bg-slate-700 border border-slate-600 rounded-md shadow-lg"
                style={{ top: suggestionPos.top, left: suggestionPos.left }}
              >
                <ul className="text-sm text-slate-200">
                  {suggestions.map((s, i) => (
                    <li
                      key={s}
                      className={`px-3 py-1 cursor-pointer ${i === activeSuggestion ? "bg-emerald-600" : "hover:bg-slate-600"}`}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Error Display Area */}
            {parseErrors.length > 0 && (
              <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded-md text-sm">
                {parseErrors.map((error, i) => (
                  <div key={i} className="flex items-center gap-2 text-red-400">
                    <AlertTriangle size={14} />
                    <span>Line {error.lineno}: {error.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inputs editor */}
          <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg max-h-56 overflow-y-auto border border-slate-700">
            {/* Header with Input Period on the right */}
            <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-3">
              <label className="text-sm font-semibold text-slate-300">
                Inputs
              </label>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-xs text-slate-400">Input Period:</span>
                <input
                  type="number"
                  min="1"
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded-md text-amber-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-sm"
                  value={inputPeriod}
                  onChange={(e) => setInputPeriod(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>
            </div>
            
            {definedInputs.length > 0 ? (
              definedInputs.map((inpName) => (
                <div key={inpName} className="flex items-center gap-3 mb-2 font-mono">
                  <span className="w-12 text-slate-300">{inpName}:</span>
                  <input
                    type="text"
                    placeholder="e.g. 0101"
                    className="flex-1 px-3 py-1 bg-slate-900 border border-slate-600 rounded-md text-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                    value={inputsMap[inpName] || ''}
                    onChange={(e) => handleInputChange(inpName, e.target.value)}
                  />
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic text-sm">
                Define inputs like 'INPUT a' in the editor.
              </p>
            )}
          </div>
        </div>

        {/* Right panel: waveform */}
        <div className="w-1/2 p-4 flex-1 flex flex-col bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">Waveform</h2>
          <div className="flex-1 overflow-auto">
            {loading && <p>Simulating...</p>}
            {error && <p className="text-red-400">Error: {error.message}</p>}
            {waveforms && <WaveformViewer waveforms={waveforms} steps={steps} />}
          </div>
        </div>
      </div>
    </div>
  );
}
