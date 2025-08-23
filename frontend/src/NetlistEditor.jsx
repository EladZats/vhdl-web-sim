import React from "react";
import Editor from "@monaco-editor/react";

const NetlistEditor = ({ value, onChange }) => {
  const handleEditorWillMount = (monaco) => {
    monaco.languages.register({ id: "netlist" });
    monaco.languages.setMonarchTokensProvider("netlist", {
      tokenizer: {
        root: [
          // Keywords with bright yellow and bold
          [/\b(CIRCUIT|INPUT|OUTPUT|SIGNAL|GATE|CLOCK|DFF)\b/, "keyword"],
          // Gate types with bright cyan
          [/\b(AND|OR|XOR|NOT)\b/, "gate"],
          // Parameters with warm orange
          [/\b(PERIOD|DUTY)\b/, "parameter"],
          // Comments with softer green
          [/--.*$/, "comment"],
          // Numbers with a distinct color
          [/\d+/, "number"],
        ],
      },
    });

    monaco.editor.defineTheme("netlist-dark", {
      base: "vs-dark",
      inherit: false, // Don't inherit to prevent style conflicts
      rules: [
        { token: "keyword", foreground: "c792ea", fontStyle: "bold" }, // Purple instead of yellow
        { token: "gate", foreground: "66d9ef", fontStyle: "bold" }, // Cyan
        { token: "parameter", foreground: "ff9650" }, // Orange
        { token: "comment", foreground: "6a9955" }, // Green
        { token: "number", foreground: "bd93f9" }, // Light purple
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorGutter.background": "#1e1e1e",
        "editorLineNumber.foreground": "#5a5a5a", // Darker line numbers
        "editorLineNumber.activeForeground": "#c6c6c6", // Active line number
        "editor.lineHighlightBackground": "#1e1e1e", // Same as background
        "editor.lineHighlightBorder": "#1e1e1e", // Remove border
        "editorGutter.modifiedBackground": "#1e1e1e", // Remove modified indicator
        "editorGutter.addedBackground": "#1e1e1e", // Remove added indicator
        "editorGutter.deletedBackground": "#1e1e1e", // Remove deleted indicator
      },
    });
  };

  return (
    <Editor
      height="100%"
      width="100%"
      language="netlist"
      theme="netlist-dark"
      value={value}
      onChange={onChange}
      beforeMount={handleEditorWillMount}
      options={{
        fontSize: 14,
        lineHeight: 1.6,
        minimap: { enabled: false },
        lineNumbers: "on",
        glyphMargin: false,
        folding: false,
        renderLineHighlight: "none",
        scrollBeyondLastLine: false,
        renderWhitespace: "none",
        guides: { indentation: false },
        overviewRulerBorder: false,
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          verticalScrollbarSize: 14,
          horizontalScrollbarSize: 14,
          useShadows: false,
        },
        padding: { top: 8 },
        fixedOverflowWidgets: true,
        automaticLayout: true,
      }}
    />
  );
};

export default NetlistEditor;