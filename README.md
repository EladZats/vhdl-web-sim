# Netlist Web Simulator

A simple **web-based digital logic simulator** that allows writing netlist code, simulating circuits, and visualizing waveforms in real time.

---

## 🚀 Features
- Netlist editor with syntax highlighting and autocompletion  
- Waveform viewer with interactive cursor  
- Built-in templates (gates, flip-flops, latches, registers, etc.)  
- Backend powered by **FastAPI**  
- Frontend built with **React + Vite + TailwindCSS**

---

## 🔗 Live Demo
👉 [Open Netlist Web Simulator](https://netlistsimulator.netlify.app)

---

## 🖥️ Development Setup

### 1. Clone repository
```bash
git clone https://github.com/YOUR_USERNAME/netlist-web-simulator.git
cd netlist-web-simulator
```

### 2. Install frontend dependencies
```bash
cd frontend
npm install
npm run dev
```
This will start the development server at `http://localhost:5173`.

### 3. Run backend server
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Backend will run at `http://localhost:8000`.

---

## 🎨 Customization
- **Title & Favicon**:  
  Update `public/index.html`  
  ```html
  <title>Netlist Simulator</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
  ```
- Replace `public/favicon.png` with your custom icon (already generated and included).

---

## 📸 Preview
![Screenshot](screenshot.png)

---

## 📜 License
MIT License
