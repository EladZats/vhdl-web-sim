import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from core.parser import NetlistParser
from core.simulator import Simulator
from core.exporter import export_to_json

app = FastAPI()

# ✅ Enable CORS so frontend on Netlify can access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://netlistsimulator.netlify.app"],  # Netlify domain only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class SimulateRequest(BaseModel):
    netlist: str
    inputs: dict[str, str] | None = None  # e.g. {"a": "0101"}
    steps: int = 16

@app.post("/simulate")
def simulate(req: SimulateRequest):
    # 1. Parse the netlist
    parser = NetlistParser(req.netlist)
    circuit = parser.parse()

    # 2. Build simulator and register all signals
    sim = Simulator()
    for sig in circuit.signals.values():
        sim.add_signal(sig)
    for clk in circuit.clocks:
        sim.add_clock(clk)
    for ff in circuit.flipflops:
        sim.add_flipflop(ff)

    # 3. Run simulation
    if req.inputs:
        for step in range(req.steps):
            for name, vector in req.inputs.items():
                if step < len(vector):
                    val = int(vector[step])
                    circuit.signals[name].set(val)
            circuit.evaluate()
            sim.step()
    else:
        sim.run(req.steps, verbose=False)

    # 4. Return results as JSON (dict → JSONResponse)
    return JSONResponse(content=export_to_json(circuit, sim, req.steps))
