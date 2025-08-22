from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict

# Import your existing parser and circuit logic
from core.parser import NetlistParser, NetlistParseError
from core.circuit import Circuit

app = FastAPI()

# --- CORS Middleware (This should be correct) ---
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Request Body ---
class SimulationRequest(BaseModel):
    netlist: str
    inputs: Dict[str, str]

# --- The /simulate Endpoint (Corrected and Final Version) ---
@app.post("/simulate")
async def simulate_endpoint(request: SimulationRequest):
    """
    Receives a netlist and input values, simulates the circuit,
    and returns the waveform data.
    """
    try:
        # 1. Parse the user's netlist code
        parser = NetlistParser(request.netlist)
        circuit = parser.parse()

        # 2. Determine the number of simulation steps.
        # This logic now correctly handles cases where no inputs are provided.
        input_lengths = [len(v) for v in request.inputs.values() if v]
        steps = max(input_lengths) if input_lengths else 16 # Default to 16 steps if no inputs

        # 3. Run the simulation
        waveforms = circuit.simulate(steps, request.inputs)

        # 4. Return the results
        return {
            "success": True,
            "simulation": {
                "steps": steps,
                "waveforms": waveforms,
            },
        }
    except NetlistParseError as e:
        # Handle errors from your parser
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle any other unexpected errors during simulation
        print(f"UNEXPECTED SERVER ERROR: {e}") # Log the actual error to the console
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")