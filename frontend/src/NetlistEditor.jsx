import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';

// --- Netlist Mode with Gate Types and Signal Names ---
const netlistKeywords = [
  "CIRCUIT", "INPUT", "OUTPUT", "SIGNAL", "CLOCK", "GATE", "DFF", "PERIOD", "DUTY"
];
const gateTypes = [
  "AND", "NAND", "OR", "NOR", "XOR", "XNOR", "NOT"
];

function netlistMode() {
  return {
    token: function(stream) {
      if (stream.eatSpace()) return null;
      if (stream.match(/--.*/)) return "comment";
      const word = stream.match(/[\w\.]+/, true);
      if (word) {
        const w = word[0].toUpperCase();
        if (["CIRCUIT", "INPUT", "OUTPUT", "SIGNAL", "CLOCK", "GATE", "DFF", "PERIOD", "DUTY"].includes(w)) return "keyword";
        if (["AND", "NAND", "OR", "NOR", "XOR", "XNOR", "NOT"].includes(w)) return "gatetype";
        if (/^[0-9.]+$/.test(w)) return "number";
        return "signal";
      }
      stream.next();
      return null;
    }
  };
}

const NetlistEditor = ({ value, onChange, fontSize, autocomplete, completions, theme }) => {
  const extensions = [
    StreamLanguage.define(netlistMode()),
    EditorView.lineWrapping
  ];

  if (autocomplete && completions) {
    extensions.push(autocompletion({ override: [completions] }));
  }

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme === 'dark' ? 'dark' : 'light'}
      extensions={extensions}
      onChange={onChange}
      style={{ fontSize: `${fontSize}px`, height: '100%' }}
    />
  );
};

export default NetlistEditor;