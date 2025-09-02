import React, { useState, useMemo, useRef, useEffect } from "react";
import { Play, Settings, HelpCircle, Library, AlertTriangle, Dices, Copy } from "lucide-react";
import NetlistEditor from './NetlistEditor';
import WaveformViewer from './WaveformViewer';
import GraphEditor from "./circuit-ui/GraphEditor";
import Palette from "./circuit-ui/Palette"; // <-- Import the new Palette
import { graphToNetlist } from "./circuit-ui/graphToNetlist";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/themes/prism-tomorrow.css";
import getCaretCoordinates from "textarea-caret";
import { StreamLanguage } from '@codemirror/language';
import { vhdl } from '@codemirror/legacy-modes/mode/vhdl';
import { autocompletion } from '@codemirror/autocomplete';
import { CIRCUIT_TEMPLATES } from './CircuitTemplates';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
const customKeywords = { ...vhdl.keywords, dff: true };
const customVHDL = {
  ...vhdl,
  keywords: customKeywords,
  ignoreCase: true,
};
const completionKeywords = [
  "CIRCUIT", "INPUT", "OUTPUT", "SIGNAL", "GATE", "CLOCK", "DFF",
   "PERIOD", "DUTY", "NAND", "NOR", "XNOR" , "AND", "OR", "NOT", "XOR"
].map(label => ({ label, type: "keyword" }));
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

export default function App() {
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
  const [inputPeriod, setInputPeriod] = useState(1);
  const [validationError, setValidationError] = useState(null);
  const editorRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [showMainHelp, setShowMainHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [compressedView, setCompressedView] = useState(false);
  const [stepWidth, setStepWidth] = useState(40);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [editorTheme, setEditorTheme] = useState('dark');
  const [mode, setMode] = useState("text");
  const [graphNodes, setGraphNodes] = useState([
    { id: "in1", type: "input", position: { x: 50, y: 50 }, data: { label: "a" } },
    { id: "in2", type: "input", position: { x: 50, y: 150 }, data: { label: "b" } },
    { id: "g1", type: "andGate", position: { x: 250, y: 100 }, data: { label: "AND" } },
    { id: "out1", type: "output", position: { x: 450, y: 100 }, data: { label: "y" } },
  ]);
  const [graphEdges, setGraphEdges] = useState([
    // Connect source "in1" to the "a" handle of target "g1"
    { id: "e1-g1", source: "in1", target: "g1", targetHandle: "a" },
    // Connect source "in2" to the "b" handle of target "g1"
    { id: "e2-g1", source: "in2", target: "g1", targetHandle: "b" },
    // This edge doesn't need a handle ID because the source (g1) only has one source handle
    { id: "e3-out1", source: "g1", target: "out1" },
  ]);

  const handleTemplatesClick = () => {
    setShowSettings(false);
    setShowMainHelp(false);
    setShowTemplates(prev => !prev);
  };

  const handleSettingsClick = () => {
    setShowTemplates(false);
    setShowMainHelp(false);
    setShowSettings(prev => !prev);
  };

  const handleHelpClick = () => {
    setShowTemplates(false);
    setShowSettings(false);
    setShowMainHelp(prev => !prev);
  };

  useEffect(() => {
    const errors = validateNetlist(netlist);
    setParseErrors(errors);
    if (errors.length > 0) {
      setValidationError(errors[0]);
    } else {
      setValidationError(null);
    }
  }, [netlist]);

  const definedInputs = useMemo(() => {
    const currentNetlist = mode === 'graph' ? graphToNetlist(graphNodes, graphEdges) : netlist;
    return currentNetlist
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.toUpperCase().startsWith("INPUT "))
      .map((line) => line.split(/\s+/)[1])
      .filter(Boolean);
  }, [netlist, graphNodes, graphEdges, mode]);

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

  const handleInputChange = (signal, value) => {
    const cleanValue = value.replace(/[^01]/g, '');
    setInputsMap(prev => ({ ...prev, [signal]: cleanValue }));
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    const expandedInputs = Object.fromEntries(
      Object.entries(inputsMap).map(([signal, value]) => [
        signal,
        value.split('').map(bit => bit.repeat(inputPeriod)).join('').padEnd(steps, '0')
      ])
    );
    const netlistToSend = mode === "graph" ? graphToNetlist(graphNodes, graphEdges) : netlist.trim();
    const requestBody = { netlist: netlistToSend, steps: Number(steps), inputs: expandedInputs };

    try {
      const res = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `HTTP error! status: ${res.status}`);
      if (!data || !data.waveforms || Object.keys(data.waveforms).length === 0) throw new Error('No waveform data received');
      setWaveforms(data.waveforms);
    } catch (error) {
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

  const handleTemplateSelect = (template) => {
    const separator = netlist.endsWith('\n') ? '' : '\n';
    setNetlist(netlist + separator + template.value);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", editorTheme === "dark");
  }, [editorTheme]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white font-mono transition-colors duration-300">
      {/* Top bar */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 p-4 flex items-center justify-between shadow-md border-b border-gray-200 dark:border-transparent">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            Netlist Simulator
          </h1>
          {/* Toggle Mode Button - half green, half dark gray */}
          <div className="ml-4 flex rounded-full border-2 border-emerald-600 overflow-hidden">
            <button
              className={`px-3 py-1 font-semibold transition focus:outline-none
                ${mode === "text"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}
              `}
              style={{ borderRight: "1px solid #059669" }}
              onClick={() => setMode("text")}
            >
              Text
            </button>
            <button
              className={`px-3 py-1 font-semibold transition focus:outline-none
                ${mode === "graph"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}
              `}
              onClick={() => setMode("graph")}
            >
              Graph
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Templates Button */}
          <div className="relative">
            <button
              onClick={handleTemplatesClick}
              className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition font-semibold"
            >
              <Library size={16} /> Templates
            </button>
            {showTemplates && (
              <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl">
                <div className="py-1">
                  {CIRCUIT_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
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
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={parseErrors.length > 0 || loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg shadow-md transition transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed font-semibold"
          >
            <Play size={18} /> {loading ? "Running..." : "Run"}
          </button>
          {/* Settings Button */}
          <div className="relative">
            <button
              onClick={handleSettingsClick}
              className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition font-semibold"
            >
              <Settings size={16} /> Settings
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl z-50 p-4 text-sm font-sans">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b border-gray-200 dark:border-slate-600 pb-1">
                  Settings
                </h4>

                {/* --- Editor --- */}
                <h5 className="text-slate-600 dark:text-slate-200 font-semibold mb-2">Editor</h5>
                <div className="mb-3">
                  <label className="block text-slate-500 dark:text-slate-300 text-xs mb-1">Font Size</label>
                  <input
                    type="number"
                    min="10"
                    max="24"
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-amber-300 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <input type="checkbox" id="autocomplete" className="accent-emerald-500" checked={autocompleteEnabled} onChange={(e) => setAutocompleteEnabled(e.target.checked)} />
                  <label htmlFor="autocomplete" className="text-slate-500 dark:text-slate-300 text-xs">Enable autocomplete</label>
                </div>
                <div className="mb-3">
                  <label className="block text-slate-500 dark:text-slate-300 text-xs mb-1">Theme</label>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-amber-300 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-md text-white text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- Help Button --- */}
          <div className="relative">
            <button
              onClick={handleHelpClick}
              className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition font-semibold"
            >
              <HelpCircle size={16} /> Help
            </button>
            {showMainHelp && (
<div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl z-20 p-4 text-sm font-sans">                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b border-gray-200 dark:border-slate-600 pb-1">
                  Netlist Simulator – Help Guide
                </h4>
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  This tool lets you design and simulate simple digital circuits
                  using a text-based <span className="text-emerald-400 font-mono">netlist</span> format.
                  You can describe your circuit with inputs, outputs, signals,
                  gates, clocks, and flip-flops, then run a step-by-step simulation
                  to view signal waveforms.
                </p>

                <h5 className="text-slate-700 dark:text-slate-200 font-semibold mb-1">How to use:</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 mb-3">
                  <li>
                    <code className="bg-slate-700 text-white px-1 rounded font-mono">CIRCUIT name</code> – Start by naming your circuit.
                  </li>
                  <li>
                    <code className="bg-slate-700 text-white px-1 rounded font-mono">INPUT / OUTPUT</code> – Declare external pins.
                  </li>
                  <li>
                    <code className="bg-slate-700 text-white px-1 rounded font-mono">SIGNAL</code> – Create internal wires.
                  </li>
                  <li>
                    <code className="bg-slate-700 text-white px-1 rounded font-mono">GATE</code> – Define gates 
                    (<span className="text-emerald-400">AND, OR, NOT, NAND, NOR, XOR, XNOR</span>).
                  </li>
                  <li>
                    <code className="bg-slate-700 text-white px-1 rounded font-mono">CLOCK</code> – Add a clock with period & duty cycle.
                  </li>
                  <li>
                    <code className="bg-slate-700 text-white px-1 rounded font-mono">DFF</code> – Add flip-flops for sequential logic.
                  </li>
                  <li>
                    Type your circuit in the editor, then click 
                    <span className="text-emerald-400"> Run</span> to simulate and see the waveforms.
                  </li>
                </ul>

                <h5 className="text-slate-700 dark:text-slate-200 font-semibold mb-1">Tips:</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 mb-3">
                  <li>Comments start with <code className="bg-slate-700 text-white px-1 rounded font-mono">--</code>.</li>
                  <li>Signal names are case-sensitive.</li>
                  <li>Use the <span className="text-emerald-400">Templates</span> menu to quickly load example circuits.</li>
                </ul>

                <p className="text-xs text-slate-500 border-t border-gray-200 dark:border-slate-700 pt-2">
                  © All rights reserved – Elad Zats
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden gap-6 p-6">
        {mode === 'text' ? (
          <>
            {/* Left panel: Editor */}
            <div className="w-2/5 flex flex-col">
              <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-base font-semibold text-gray-600 dark:text-gray-200">Netlist Editor</label>
                  <div className="flex items-center gap-3">
                    <button onClick={handleCopy} className="text-gray-400 hover:text-emerald-500 transition text-xs flex items-center gap-1">
                      <Copy size={14} /> {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="editor-container flex-1 bg-gray-100 dark:bg-slate-950 font-mono rounded-lg border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 overflow-hidden text-sm mt-3">
                  <NetlistEditor value={netlist} onChange={handleNetlistChange} fontSize={editorFontSize} autocomplete={autocompleteEnabled} completions={myCompletions} theme={editorTheme} />
                </div>
                {parseErrors.length > 0 && (
                  <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded-md text-sm">
                    {parseErrors.map((error, i) => (
                      <div key={i} className="flex items-center gap-2 text-red-400">
                        <AlertTriangle size={14} /> <span>Line {error.lineno}: {error.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Right panel: Inputs + Waveform */}
            <div className="w-3/5 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-slate-700 pb-3">
                  <label className="text-base font-semibold text-gray-600 dark:text-gray-200">Inputs</label>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs text-gray-400 dark:text-gray-400">Input Period:</span>
                    <input type="number" min="1" className="w-16 px-2 py-1 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md text-emerald-700 dark:text-amber-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm" value={inputPeriod} onChange={(e) => setInputPeriod(Math.max(1, parseInt(e.target.value, 10) || 1))} />
                  </div>
                </div>
                {definedInputs.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      {definedInputs.map((inpName) => (
                        <div key={inpName} className="flex items-center gap-3 font-mono">
                          <span className="w-12 text-gray-700 dark:text-gray-300">{inpName}:</span>
                          <input type="text" placeholder="e.g. 0101" className="flex-1 px-3 py-1 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md text-emerald-700 dark:text-amber-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={inputsMap[inpName] || ''} onChange={(e) => handleInputChange(inpName, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    Define inputs in the editor or graph.
                  </p>
                )}
              </div>
              <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                <h2 className="text-lg font-semibold mb-4 text-gray-600 dark:text-gray-200">Waveform</h2>
                <div className="flex-1 overflow-auto">
                  {loading && <p>Simulating...</p>}
                  {error && <p className="text-red-400">Error: {error.message}</p>}
                  {waveforms && <WaveformViewer waveforms={waveforms} steps={steps} stepWidth={stepWidth} showGrid={showGrid} compressed={compressedView} />}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Left panel: Palette */}
            <Palette />
            {/* Center panel: Graph Editor */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
              <GraphEditor nodes={graphNodes} setNodes={setGraphNodes} edges={graphEdges} setEdges={setGraphEdges} />
            </div>
            {/* Right panel: Inputs + Waveform */}
            <div className="w-2/5 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-slate-700 pb-3">
                  <label className="text-base font-semibold text-gray-600 dark:text-gray-200">Inputs</label>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs text-gray-400 dark:text-gray-400">Input Period:</span>
                    <input type="number" min="1" className="w-16 px-2 py-1 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md text-emerald-700 dark:text-amber-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm" value={inputPeriod} onChange={(e) => setInputPeriod(Math.max(1, parseInt(e.target.value, 10) || 1))} />
                  </div>
                </div>
                {definedInputs.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      {definedInputs.map((inpName) => (
                        <div key={inpName} className="flex items-center gap-3 font-mono">
                          <span className="w-12 text-gray-700 dark:text-gray-300">{inpName}:</span>
                          <input type="text" placeholder="e.g. 0101" className="flex-1 px-3 py-1 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md text-emerald-700 dark:text-amber-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" value={inputsMap[inpName] || ''} onChange={(e) => handleInputChange(inpName, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    Define inputs in the editor or graph.
                  </p>
                )}
              </div>
              <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                <h2 className="text-lg font-semibold mb-4 text-gray-600 dark:text-gray-200">Waveform</h2>
                <div className="flex-1 overflow-auto">
                  {loading && <p>Simulating...</p>}
                  {error && <p className="text-red-400">Error: {error.message}</p>}
                  {waveforms && <WaveformViewer waveforms={waveforms} steps={steps} stepWidth={stepWidth} showGrid={showGrid} compressed={compressedView} />}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
