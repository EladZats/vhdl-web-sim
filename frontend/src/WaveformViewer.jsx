import React, { useRef, useEffect, useState } from "react";

export default function WaveformViewer({ waveforms, steps }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverX, setHoverX] = useState(null);

  useEffect(() => {
    if (!waveforms || Object.keys(waveforms).length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const devicePixelRatio = window.devicePixelRatio || 1;

    // --- Dimensions ---
    const rowHeight = 40;
    const padding = 120; // More space for cleaner text
    const actualSteps = waveforms[Object.keys(waveforms)[0]].length;
    const stepWidth = 50; // Wider steps

    const canvasWidth = padding + actualSteps * stepWidth + 50;
    const canvasHeight = rowHeight * (Object.keys(waveforms).length + 2);

    // Set canvas dimensions for High-DPI rendering
    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // Scale context for crisp rendering
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // --- Modern Styling ---
    ctx.fillStyle = "#222222"; // A more neutral dark gray background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.lineJoin = "round"; // Smoother lines
    ctx.lineCap = "round";

    const signals = Object.keys(waveforms);

    // Draw each signal waveform
    signals.forEach((signal, row) => {
      const values = waveforms[signal];
      const yMid = rowHeight * (row + 1);

      // Signal Name
      ctx.fillStyle = "#cbd5e0"; // Lighter text
      ctx.font = "14px 'SF Mono', 'Fira Code', monospace";
      ctx.textAlign = "left";
      ctx.fillText(signal, 15, yMid - 10);

      // Waveform Line
      ctx.strokeStyle = signal === "y" ? "#48bb78" : "#4299e1"; // Vibrant green and blue
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(padding, yMid - values[0] * 15);

      values.forEach((v, i) => {
        const x = padding + i * stepWidth;
        const y = yMid - v * 15;
        if (i > 0) {
          const prev_y = yMid - values[i - 1] * 15;
          ctx.lineTo(x, prev_y);
        }
        ctx.lineTo(x, y);
        ctx.lineTo(x + stepWidth, y);
      });
      ctx.stroke();
    });

    // Time axis with subtle grid lines
    const axisY = rowHeight * (signals.length + 1);
    ctx.strokeStyle = "#4a5568"; // Gray grid lines
    ctx.lineWidth = 1;

    for (let i = 0; i < actualSteps; i++) {
      const x = padding + i * stepWidth + stepWidth / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, axisY);
      ctx.stroke();

      ctx.fillStyle = "#a0aec0";
      ctx.textAlign = "center";
      ctx.fillText(i, x, axisY + 15);
    }

    // Modern Hover bar and values
    if (hoverX !== null && hoverX >= padding) {
      let col = Math.floor((hoverX - padding) / stepWidth);
      col = Math.max(0, Math.min(col, actualSteps - 1));

      // Snapped Red Bar
      const barX = padding + col * stepWidth + stepWidth / 2;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Softer red
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(barX, 0);
      ctx.lineTo(barX, canvasHeight);
      ctx.stroke();

      // Show values
      signals.forEach((signal, row) => {
        const value = waveforms[signal][col];
        if (value !== undefined) {
          const yMid = rowHeight * (row + 1);
          ctx.fillStyle = "#f6e05e"; // Bright yellow
          ctx.font = "bold 16px 'SF Mono', 'Fira Code', monospace";
          ctx.textAlign = "right";
          ctx.fillText(value, padding - 20, yMid - 10);
        }
      });
    }
  }, [waveforms, hoverX]);

  const handleMouseMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const canvasX = e.clientX - rect.left + container.scrollLeft;
    setHoverX(canvasX);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        border: "1px solid #2d3748",
        width: "100%",
        overflowX: "auto",
        cursor: "crosshair",
        backgroundColor: "#222222", // A more neutral dark gray background
        borderRadius: "8px",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
