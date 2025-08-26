import React, { useRef, useState, useEffect } from 'react';

const WaveformViewer = ({ waveforms, steps, stepWidth = 40, showGrid = true, compressed = false }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverX, setHoverX] = useState(null);
  const signalNames = Object.keys(waveforms);
  const signalHeight = compressed ? 20 : 40;
  const paddingTop = 20;
  const nameWidth = 100;
  const totalWidth = nameWidth + (steps * stepWidth);
  const totalHeight = paddingTop + (signalNames.length * signalHeight);

  useEffect(() => {
    if (!waveforms || Object.keys(waveforms).length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set dimensions with extra space for time axis
    const rowHeight = 40;
    const padding = 160; // Increased padding for value display
    const signals = Object.keys(waveforms);
    const steps = waveforms[signals[0]].length;
    const width = padding + (steps * stepWidth);
    const height = (signals.length + 1) * rowHeight + 30; // Extra height for time axis

    // Configure canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= steps; i++) {
      const x = padding + (i * stepWidth);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - rowHeight);
      ctx.stroke();
    }

    // Horizontal grid lines for 0 and 1 levels
    signals.forEach((_, index) => {
      const y = (index + 1) * rowHeight;
      
      // Draw 0-level line (lighter)
      ctx.strokeStyle = '#333333';
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Draw 1-level line (lighter)
      ctx.strokeStyle = '#333333';
      ctx.beginPath();
      ctx.moveTo(padding, y - 20);
      ctx.lineTo(width, y - 20);
      ctx.stroke();
    });

    // Draw time axis at the bottom with aligned units
    ctx.strokeStyle = '#4a5568';
    ctx.fillStyle = '#8b9cb0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i < steps; i++) {
      const x = padding + (i * stepWidth);
      // Draw tick mark
      ctx.beginPath();
      ctx.moveTo(x, height - 30);
      ctx.lineTo(x, height - 25);
      ctx.stroke();
      // Draw number aligned with grid line
      ctx.fillText(i.toString(), x + stepWidth/2, height - 20);
    }

    // Draw signals with current values on the left
    signals.forEach((signal, index) => {
      const y = (index + 1) * rowHeight;
      const values = waveforms[signal];
      const currentValue = values[0]; // Get initial value

      // Draw signal name
      ctx.fillStyle = '#8b9cb0';
      ctx.font = '14px monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(signal, 10, y - 10);

      // Draw current value box on the left
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(padding - 45, y - 20, 30, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(currentValue.toString(), padding - 30, y - 10);

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = signal.startsWith('clk') ? '#4ade80' : '#60a5fa';
      ctx.lineWidth = 2;

      let lastValue = values[0];
      ctx.moveTo(padding, y - (lastValue * 20));

      values.forEach((value, i) => {
        const x = padding + (i * stepWidth);
        
        // Draw vertical transition if value changed
        if (value !== lastValue) {
          ctx.lineTo(x, y - (lastValue * 20));
          ctx.lineTo(x, y - (value * 20));
        }
        
        // Draw horizontal line
        ctx.lineTo(x + stepWidth, y - (value * 20));
        lastValue = value;
      });
      ctx.stroke();
    });

    // Draw hover indicator and values
    if (hoverX !== null) {
      const step = Math.floor((hoverX - padding) / stepWidth);
      if (step >= 0 && step < steps) {
        // Draw red vertical line
        const x = padding + (step * stepWidth);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 30); // Stop above time axis
        ctx.stroke();

        // Update values on the left
        signals.forEach((signal, index) => {
          const y = (index + 1) * rowHeight;
          const value = waveforms[signal][step];
          
          // Clear previous value
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(padding - 45, y - 20, 30, 20);
          
          // Draw new value
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(value.toString(), padding - 30, y - 10);
        });
      }
    }
  }, [waveforms, hoverX]);

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    setHoverX(x);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-gray-900 rounded-lg p-4 overflow-auto"
    >
      <canvas ref={canvasRef} className="min-w-full" />
    </div>
  );
};

export default WaveformViewer;
