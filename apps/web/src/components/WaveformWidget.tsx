import { useEffect, useRef, useState } from "react";

const width = 600;
const height = 300;

export function computeWaveform(frequency: number, amplitude: number, phase: number, t: number) {
  const base = amplitude * Math.sin(2 * Math.PI * frequency * t + phase);
  const overtone = 0.45 * amplitude * Math.sin(2 * Math.PI * frequency * 2 * t);
  return base + overtone;
}

interface WaveformWidgetProps {
  onInteract?: (eventType: string, payload: Record<string, unknown>) => void;
}

export function WaveformWidget({ onInteract }: WaveformWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frequency, setFrequency] = useState(1.5);
  const [amplitude, setAmplitude] = useState(1);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#fffdfa";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "#d7cec0";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();

    context.strokeStyle = "#176b63";
    context.lineWidth = 3;
    context.beginPath();

    for (let x = 0; x < width; x += 1) {
      const t = x / width;
      const y = height / 2 - computeWaveform(frequency, amplitude, phase, t) * 58;
      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }, [amplitude, frequency, phase]);

  function updateControl(name: string, value: number) {
    if (name === "frequency") {
      setFrequency(value);
    }
    if (name === "amplitude") {
      setAmplitude(value);
    }
    if (name === "phase") {
      setPhase(value);
    }
    onInteract?.("slider_change", { name, value });
  }

  return (
    <section className="waveform-tool" aria-label="Waveform controls">
      <canvas ref={canvasRef} width={width} height={height} />
      <div className="controls">
        <label>
          <span>Frequency</span>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={frequency}
            onChange={(event) => updateControl("frequency", Number(event.target.value))}
          />
          <strong>{frequency.toFixed(1)} Hz</strong>
        </label>
        <label>
          <span>Amplitude</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={amplitude}
            onChange={(event) => updateControl("amplitude", Number(event.target.value))}
          />
          <strong>{amplitude.toFixed(1)}</strong>
        </label>
        <label>
          <span>Phase</span>
          <input
            type="range"
            min="0"
            max={String(Math.PI * 2)}
            step="0.1"
            value={phase}
            onChange={(event) => updateControl("phase", Number(event.target.value))}
          />
          <strong>{phase.toFixed(1)}</strong>
        </label>
      </div>
    </section>
  );
}
