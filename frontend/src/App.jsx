import React, { useState } from "react";
import WaveformViewer from "./WaveformViewer.jsx";

export default function App() {
  const [netlist, setNetlist] = useState(
    "CIRCUIT DEMO\nINPUT a\nINPUT b\nOUTPUT y\nSIGNAL s1\nCLOCK clk PERIOD 4 DUTY 0.5\nGATE g1 AND a b s1\nGATE g2 NOT s1 y"
  );
  const [inputs, setInputs] = useState('{"a":"0101","b":"1100"}');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

const handleSimulate = async () => {
  console.log("🚀 Sending netlist:", netlist);
  console.log("🚀 Sending inputs:", inputs);

  setLoading(true);
  try {
    const body = {
      netlist,
      steps: 16,
    };

    // נכניס inputs אם המשתמש הגדיר
    if (inputs && inputs.trim() !== "") {
      try {
        body.inputs = JSON.parse(inputs);
      } catch (e) {
        alert("⚠️ Invalid JSON in Inputs field");
        setLoading(false);
        return;
      }
    }

    const response = await fetch("http://127.0.0.1:8000/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // ✅ חשוב: משתמשים ב־response.json(), לא response.text()
    const json = await response.json();
    console.log("✅ Full JSON from backend:", json);
    console.log("Typeof json before setData:", typeof json); // צריך להיות "object"

    setData(json); // עכשיו data יהיה object ולא string
  } catch (error) {
    console.error("❌ Simulation failed:", error);
  } finally {
    setLoading(false);
  }
};

  // debug every render
  console.log("👀 Rendering App, loading=", loading);
  console.log("🔍 typeof data =", typeof data, " data=", data);
  console.log("🔍 typeof data?.simulation =", typeof data?.simulation);
  console.log("🔍 simulation value =", data?.simulation);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Top bar */}
      <div className="bg-gray-800 p-4 flex items-center justify-between shadow">
        <h1 className="text-xl font-bold">Netlist Simulator</h1>
        <div className="space-x-4">
          <button
            onClick={handleSimulate}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
          >
            Run
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: netlist + inputs */}
        <div className="w-1/2 p-4 flex flex-col space-y-4">
          <div className="flex-1 flex flex-col">
            <label className="mb-1 text-sm text-gray-400 font-semibold">
              Netlist
            </label>
            <textarea
              className="flex-1 w-full p-2 bg-black text-green-400 font-mono rounded resize-none border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={netlist}
              onChange={(e) => setNetlist(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 text-sm text-gray-400 font-semibold">
              Inputs (JSON)
            </label>
            <textarea
              className="w-full p-2 bg-gray-800 text-yellow-300 font-mono rounded resize-none border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              rows={3}
              value={inputs}
              onChange={(e) => setInputs(e.target.value)}
              placeholder='e.g. {"a":"0101","b":"1100"}'
            />
            <p className="mt-1 text-xs text-gray-500">
              Define input waveforms per signal (use "0" and "1").
            </p>
          </div>
        </div>

        {/* Right panel: waveform */}
        <div className="w-1/2 p-4 overflow-auto">
          {loading && <div>⏳ Running simulation...</div>}

          {!loading && data?.simulation && (
            <WaveformViewer
              waveforms={data.simulation.waveforms}
              steps={data.simulation.steps}
            />
          )}

          {!loading && !data?.simulation && (
            <div className="text-gray-400">No simulation yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
