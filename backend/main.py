import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from pydantic import BaseModel
from core.parser import NetlistParser

app = FastAPI()

# ✅ Enable CORS so frontend on Netlify can access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://netlistsimulator.netlify.app"],  # Netlify domain only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the request model to match the frontend
class SimulateRequest(BaseModel):
    netlist: str
    steps: int
    inputs: dict[str, str]

@app.post("/simulate")
async def simulate(req: SimulateRequest):
    try:
        parser = NetlistParser(text=req.netlist)
        circuit = parser.parse()

        # Get ALL signal names (inputs, outputs, internal, clocks)
        all_signal_names = set(circuit.signals.keys())
        for clock in circuit.clocks:
            all_signal_names.add(clock.name)
        sorted_signal_names = sorted(list(all_signal_names))
        print(f"Tracking all signals: {sorted_signal_names}")

        # Collect values for each timestep
        steps_data = []
        for step in range(req.steps):
            # Directly set the input values for the current step.
            for signal_name, vector_str in req.inputs.items():
                if signal_name in circuit.signals and step < len(vector_str):
                    value = int(vector_str[step])
                    circuit.signals[signal_name].set_value(value)

            # Update all gates and clocks to propagate signals
            for clock in circuit.clocks:
                # FIX: Pass the current simulation step to the clock's update method.
                clock.update(step)
            for gate in circuit.gates:
                gate.update()
            
            # Record the state of ALL signals for this step
            state = {}
            for name in sorted_signal_names:
                if name in circuit.signals:
                    state[name] = circuit.signals[name].get_value()
            steps_data.append(state)
        
        # Format the response with ALL waveforms
        waveforms = {}
        for name in sorted_signal_names:
            waveforms[name] = [step.get(name, 0) for step in steps_data]
                
        response = {
            "waveforms": waveforms,
            "steps": list(range(req.steps))
        }
        
        print(f"Sending response with all waveforms.")
        return JSONResponse(content=response)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"\n!!! Error during simulation !!!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Traceback:\n{error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}\n{error_trace}"
        )

