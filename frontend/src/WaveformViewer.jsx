import React, { useRef, useEffect, useState } from "react";

export default function WaveformViewer({ waveforms, steps }) {
  const canvasRef = useRef(null);
  const [hoverX, setHoverX] = useState(null);

  useEffect(() => {
    if (!waveforms) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;
    const rowHeight = 40;
    const padding = 60;

    // נקבע את מספר השלבים האמיתי לפי האורך של אחד האותות
    const actualSteps = waveforms[Object.keys(waveforms)[0]].length;
    const stepWidth = (width - padding - 40) / (actualSteps - 1);

    // Clear
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    const signals = Object.keys(waveforms);

    // Draw each signal waveform
    signals.forEach((signal, row) => {
      const values = waveforms[signal];
      const yMid = rowHeight * (row + 1);

      // Name
      ctx.fillStyle = "#fff";
      ctx.font = "14px monospace";
      ctx.fillText(signal, 5, yMid - 10);

      // Line color (green for outputs)
      ctx.strokeStyle = signal === "y" ? "#0f0" : "#888";
      ctx.beginPath();
      ctx.moveTo(padding, yMid - values[0] * 20);

      values.forEach((v, i) => {
        const x = padding + i * stepWidth;
        const y = yMid - v * 20;
        ctx.lineTo(x, y);
        ctx.lineTo(x + stepWidth, y);
      });
      ctx.stroke();

      // Divider line
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(0, yMid);
      ctx.lineTo(width, yMid);
      ctx.stroke();
    });

    // Time axis
    const axisY = rowHeight * (signals.length + 1);
    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(padding, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();

    for (let i = 0; i < actualSteps; i++) {
      const x = padding + i * stepWidth;
      ctx.fillStyle = "#aaa";
      ctx.fillText(i, x - 3, axisY + 15);
    }

    // Hover bar
    if (hoverX !== null) {
      const col = Math.floor((hoverX - padding) / stepWidth);
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();

      // Values at hover position
      signals.forEach((signal, row) => {
        const values = waveforms[signal];
        if (values && values[col] !== undefined) {
          const yMid = rowHeight * (row + 1);
          ctx.fillStyle = "yellow";
          ctx.fillText(values[col], width - 30, yMid - 10);
        }
      });
    }
  }, [waveforms, steps, hoverX]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      onMouseMove={(e) => setHoverX(e.nativeEvent.offsetX)}
      style={{ border: "1px solid #444", width: "100%" }}
    />
  );
}
