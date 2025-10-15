# Netlist Web Simulator

An educational, web-based digital logic simulator for learning and visualizing digital circuits in real time. It lets you design and simulate digital circuits using a simple text-based netlist language (and an optional visual editor), then view waveforms instantly.

## Features

*   **Dual-Mode Editor**: Seamlessly switch between a visual graph editor and a text-based netlist editor.
*   **Live Validation**: The netlist editor provides real-time syntax checking and error highlighting.
*   **Graph Auto-Layout**: Automatically generates a clean, layered graph from netlist code, even for circuits with feedback loops.
*   **Interactive Waveform Viewer**: Visualize signal values over time, with a cursor to inspect values at each step.
*   **Component Palette**: Drag and drop gates, inputs, and outputs onto the graph canvas.
*   **FastAPI Backend**: A lightweight, high-performance Python backend for circuit simulation.

## Quickstart (Local)

### Prerequisites

*   Node.js (v18 or newer)
*   Python (v3.10 or newer)

### 1. Backend Setup

First, set up and run the Python simulation server.

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vhdl-web-sim.git
cd vhdl-web-sim

# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate

# Install dependencies
pip install fastapi "uvicorn[standard]"

# Run the server
uvicorn main:app --reload --port 8000
```

The backend API will now be running at `http://localhost:8000`.

### 2. Frontend Setup

In a separate terminal, set up and run the React frontend.

```bash
# Navigate to the frontend directory from the root
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`. Open this URL in your browser to use the application.

**Note**: The frontend is configured to send API requests to `http://localhost:8000`, and the backend is configured to allow requests from `http://localhost:5173`. If you change these ports, you must update them in both `frontend/src/App.jsx` and `backend/main.py` to avoid CORS errors.

## API

The simulator uses a single endpoint to run simulations.

### `POST /simulate`

**Request Body:**

*   `netlist` (string): The circuit definition in the custom netlist language.
*   `steps` (integer): The number of time steps to simulate.
*   `inputs` (object): A dictionary mapping input signal names to their value strings (e.g., `"0110..."`).

**Example Request:**

```json
{
  "netlist": "CIRCUIT half_adder\nINPUT a\nINPUT b\nOUTPUT s\nOUTPUT c\nGATE g1 XOR a b s\nGATE g2 AND a b c",
  "steps": 4,
  "inputs": {
    "a": "0101",
    "b": "0011"
  }
}
```

**Example Response:**

```json
{
  "waveforms": {
    "a": [0,1,0,1],
    "b": [0,0,1,1],
    "c": [0,0,0,1],
    "s": [0,1,1,0]
  },
  "steps": [0,1,2,3]
}
```

## Netlist Language Cheat-Sheet

The netlist language is a simple, line-based format for describing a circuit's structure.

| Directive | Format                                           | Example                               |
| :-------- | :----------------------------------------------- | :------------------------------------ |
| `CIRCUIT` | `CIRCUIT <name>`                                 | `CIRCUIT my_circuit`                  |
| `INPUT`   | `INPUT <signal1> [signal2]...`                   | `INPUT a b`                           |
| `OUTPUT`  | `OUTPUT <signal1> [signal2]...`                  | `OUTPUT y`                            |
| `SIGNAL`  | `SIGNAL <signal1> [signal2]...`                  | `SIGNAL internal_wire`                |
| `GATE`    | `GATE <id> <type> <in1> [in2] <out>`             | `GATE g1 AND a b y`                   |
| `CLOCK`   | `CLOCK <name> PERIOD <val> DUTY <val>`           | `CLOCK clk PERIOD 10 DUTY 0.5`        |
| `DFF`     | `DFF <id> <D_in> <CLK_in> <Q_out>`               | `DFF ff1 d clk q`                     |
| Comment   | `-- ...`                                         | `-- This is a comment`                 |

**Supported Gate Types**: `AND`, `OR`, `NOT`, `NAND`, `NOR`, `XOR`, `XNOR`.

### Example: Half Adder

You can copy and paste this code into the netlist editor to get started.

```
CIRCUIT half_adder
-- Define inputs and outputs
INPUT a
INPUT b
OUTPUT s
OUTPUT c

-- Define logic gates
GATE g1 XOR a b s
GATE g2 AND a b c
```
  
## Templates Available

The application includes built-in templates for common circuits. You can load them from the "Templates" menu.

*   Half Adder
*   Full Adder
*   D Latch
*   D Flip-Flop
*   2-to-1 Multiplexer
*   SR Latch
*   4-bit Register

## Troubleshooting

*   **"Failed to fetch" or 404 Error on Simulation**:
    *   Ensure the backend FastAPI server is running in a separate terminal.
    *   Verify the backend is running on `http://localhost:8000` as expected.

*   **CORS Error in Browser Console**:
    *   This means the frontend's origin (`http://localhost:5173`) is not allowed by the backend.
    *   Check `backend/main.py` and make sure `allow_origins` in the `CORSMiddleware` includes your frontend URL.

*   **Waveform is Empty or Incorrect**:
    *   Make sure you have provided stimulus for the `INPUT` signals in the "Inputs" panel.
    *   Ensure the input signal strings are long enough for the number of simulation `steps`.
    *   Check the netlist editor for any red error messages from the live validator.

*   **Netlist Parse Errors**:
    *   `"The 'CIRCUIT' directive must be the first command."`: Your code must start with `CIRCUIT <name>`.
    *   `"Incorrect number of arguments for a ... gate."`: `NOT` takes 1 input; other gates take 2. The format is `GATE <id> <type> <inputs...> <output>`.
    *   `"Signal '...' is used but not declared."`: All signals used as inputs to gates must first be declared via `INPUT`, `OUTPUT`, or `SIGNAL`.

## Contributing

Contributions are welcome. Please open an issue to discuss your idea or submit a pull request with your changes.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
