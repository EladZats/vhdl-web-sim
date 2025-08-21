import React from "react";

function InputsPanel({ inputs, values, onChange }) {
  return (
    <div className="mt-4 p-2 bg-gray-800 rounded text-white">
      <h3 className="font-bold mb-2">Input Stimuli</h3>
      {inputs.map((name) => (
        <div key={name} className="flex items-center mb-2">
          <label className="w-16">{name}:</label>
          <input
            type="text"
            value={values[name] || ""}
            onChange={(e) => onChange(name, e.target.value)}
            className="flex-grow bg-black text-green-400 font-mono px-2 py-1 rounded"
            placeholder="e.g. 0101"
          />
        </div>
      ))}
    </div>
  );
}

export default InputsPanel;
