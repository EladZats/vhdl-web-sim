import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from pydantic import BaseModel
from core.parser import NetlistParser
from settings import ALLOWED_ORIGINS, ENV

app = FastAPI(title="VHDL Web Simulator Backend")

# ✅ Enable CORS based on environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health check endpoint ---
@app.get("/health")
async def health_check():
    return {"status": "ok", "mode": ENV, "message": "Backend is running"}

# --- Request model ---
class SimulateRequest(BaseModel):
    netlist: str
    steps: int
    inputs: dict[str, str]

# --- Simulation endpoint ---
@app.post("/simulate")
async def simulate(req: SimulateRequest):
    try:
        parser = NetlistParser(text=req.netlist)
        circuit = parser.parse()

        all_signal_names = set(circuit.signals.keys())
        for clock in circuit.clocks:
            all_signal_names.add(clock.name)
        sorted_signal_names = sorted(list(all_signal_names))

        steps_data = []
        for step in range(req.steps):
            # Set input values
            for signal_name, vector_str in req.inputs.items():
                if signal_name in circuit.signals and step < len(vector_str):
                    value = int(vector_str[step])
                    circuit.signals[signal_name].set_value(value)

            # Update clocks and gates
            for clock in circuit.clocks:
                clock.update(step)
            for gate in circuit.gates:
                gate.update()

            # Record signal values
            state = {name: circuit.signals[name].get_value()
                     for name in sorted_signal_names if name in circuit.signals}
            steps_data.append(state)

        waveforms = {name: [s.get(name, 0) for s in steps_data]
                     for name in sorted_signal_names}

        response = {
            "waveforms": waveforms,
            "steps": list(range(req.steps))
        }

        return JSONResponse(content=response)

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"\n!!! Error during simulation !!!")
        print(error_trace)
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}\n{error_trace}"
        )
