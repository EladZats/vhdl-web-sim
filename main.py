from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Dict
import logging
from fastapi.responses import JSONResponse

from core.simulation import NetlistSimulator

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class SimulationRequest(BaseModel):
    netlist: str
    steps: int
    inputs_map: Dict[str, str]

    @validator('netlist')
    def validate_netlist(cls, v):
        if not v:
            raise ValueError('netlist cannot be empty')
        return v

    @validator('steps')
    def validate_steps(cls, v):
        if v <= 0:
            raise ValueError('steps must be positive')
        return v

    @validator('inputs_map')
    def validate_inputs(cls, v):
        if not v:
            raise ValueError('inputs_map cannot be empty')
        return v

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simulate")
async def simulate_netlist(request: SimulationRequest):
    # Log the incoming request
    logger.debug(f"Received request:")
    logger.debug(f"netlist: {request.netlist[:100]}...")  # First 100 chars
    logger.debug(f"steps: {request.steps}")
    logger.debug(f"inputs_map: {request.inputs_map}")

    try:
        simulator = NetlistSimulator(request.netlist)
        waveforms = simulator.run_simulation(request.steps, request.inputs_map)
        return {"waveforms": waveforms}
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return JSONResponse(
            status_code=422,
            content={"detail": str(e)}
        )
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        return JSONResponse(
            status_code=400,
            content={"detail": str(e)}
        )