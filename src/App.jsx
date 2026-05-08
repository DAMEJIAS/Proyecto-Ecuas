import { useEffect, useMemo, useRef, useState } from "react";
import { solveSystemRK4 } from "./solver";

const initialForm = {
  m: 10,
  b: 0.4,
  k: 0.16
};

const simConfig = {
  t0: 0,
  tf: 300,
  x0: 0.025,
  y0: 0,
  h: 0.1
};

const sliderConfig = {
  m: {
    min: 1,
    max: 50,
    step: 0.1,
    unit: "kg",
    label: "Masa (m)",
    note: "Determina la inercia del sistema."
  },
  b: {
    min: 0,
    max: 10,
    step: 0.05,
    unit: "Ns/m",
    label: "Constante de Amortiguamiento (c)",
    note: "Resistencia proporcional a la velocidad."
  },
  k: {
    min: 0.05,
    max: 40,
    step: 0.05,
    unit: "N/m",
    label: "Constante del Resorte (k)",
    note: "Rigidez del resorte."
  }
};

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!rows.length || !isPlaying) {
      return undefined;
    }

    let rafId = 0;
    let startTime = 0;
    const initialProgress = progressRef.current;
    const durationMs = 15000; // 15 segundos para animación más rápida

    const tick = (time) => {
      if (!startTime) {
        startTime = time;
      }

      const elapsed = time - startTime;
      const next = Math.min(1, initialProgress + elapsed / durationMs);
      setProgress(next);

      if (next < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isPlaying, rows]);

  const visibleRows = useMemo(() => {
    if (!rows.length) {
      return [];
    }

    const visibleCount = Math.max(2, Math.ceil(rows.length * progress));
    return rows.slice(0, visibleCount);
  }, [rows, progress]);

  const chartModel = useMemo(() => buildPlotModel(visibleRows, rows, zoomLevel), [visibleRows, rows, zoomLevel]);
  const currentState = visibleRows[visibleRows.length - 1] ?? { t: 0, x: simConfig.x0, y: simConfig.y0 };
  
  const equationDisplay = `${form.m.toFixed(2)}X'' + ${form.b.toFixed(2)}X' + ${form.k.toFixed(2)}X = 0`;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const runSimulation = () => {
    setError("");

    try {
      const m = Number(form.m);
      const b = Number(form.b);
      const k = Number(form.k);

      if (!Number.isFinite(m) || m <= 0) {
        throw new Error("La masa m debe ser mayor que 0.");
      }

      if (!Number.isFinite(k) || k <= 0) {
        throw new Error("La constante k debe ser mayor que 0.");
      }

      if (!Number.isFinite(b) || b < 0) {
        throw new Error("El amortiguamiento b no puede ser negativo.");
      }

      const result = solveSystemRK4({
        fExpr: "y",
        gExpr: `(-${b} * y - ${k} * x) / ${m}`,
        t0: simConfig.t0,
        tf: simConfig.tf,
        x0: simConfig.x0,
        y0: simConfig.y0,
        h: simConfig.h
      });

      setRows(result);
      setProgress(0);
      progressRef.current = 0;
      setIsPlaying(true);
    } catch (err) {
      setRows([]);
      setProgress(0);
      progressRef.current = 0;
      setIsPlaying(false);
      setError(err.message || "No se pudo resolver el sistema.");
    }
  };

  const togglePause = () => {
    if (!rows.length) {
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setForm(initialForm);
    setRows([]);
    setProgress(0);
    progressRef.current = 0;
    setIsPlaying(false);
    setError("");
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleGraphWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-title-wrap">
          <span className="topbar-title">Ecuaciones Diferenciales: Simulador Masa-Resorte</span>
        </div>

        <div className="topbar-actions">
        </div>
      </header>

      <main className="workspace">
        <aside className="side-column">
          <section className="panel controls-panel">
            <div className="section-copy">
              <h2>Parámetros del Sistema</h2>
              <p>Ajusta las constantes físicas para resolver la EDO homogénea: mx'' + cx' + kx = 0</p>
              <div className="equation-display">
                <strong>Ecuación Actual:</strong>
                <div className="equation-formula">{equationDisplay}</div>
              </div>
            </div>

            <div className="slider-stack">
              {Object.entries(sliderConfig).map(([key, config]) => (
                <div className="slider-group" key={key}>
                  <div className="slider-head">
                    <label>{config.label}</label>
                    <div className="value-input-group">
                      <input
                        className="value-input"
                        type="number"
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={form[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                      <span className="unit-label">{config.unit}</span>
                    </div>
                  </div>
                  <input
                    className="range-input"
                    max={config.max}
                    min={config.min}
                    onChange={(e) => handleChange(key, e.target.value)}
                    step={config.step}
                    type="range"
                    value={form[key]}
                  />
                  <p>{config.note}</p>
                </div>
              ))}
            </div>

            {error && <p className="error-banner">{error}</p>}

            {rows.length > 0 && (
              <div className="state-display">
                <h3>Estado Actual</h3>
                <div className="state-values">
                  <div className="state-item">
                    <span className="state-label">Tiempo (t):</span>
                    <span className="state-value">{formatValue(currentState.t, 3)} s</span>
                  </div>
                  <div className="state-item">
                    <span className="state-label">Desplazamiento (X):</span>
                    <span className="state-value">{formatValue(currentState.x, 4)} m</span>
                  </div>
                  <div className="state-item">
                    <span className="state-label">Velocidad (Y):</span>
                    <span className="state-value">{formatValue(currentState.y, 4)} m/s</span>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="error-banner">{error}</p>}

            <div className="action-stack">
              <button className="primary-action" onClick={runSimulation} type="button">
                Iniciar Simulación
              </button>

              <div className="secondary-actions">
                <button className="secondary-action" onClick={togglePause} type="button">
                  {isPlaying ? "Pausar" : "Reanudar"}
                </button>
                <button className="secondary-action" onClick={handleReset} type="button">
                  Reiniciar
                </button>
              </div>
            </div>
          </section>
        </aside>

        <div className="visual-column">
          <section className="panel graph-panel">
            <div className="panel-header">
              <span className="panel-label">Análisis de Desplazamiento vs. Tiempo</span>
              <span className="panel-dt">dt = {simConfig.h}s</span>
            </div>

            <div className="graph-stage">
              {visibleRows.length ? (
                <>
                  <svg 
                    className="analysis-chart" 
                    viewBox={`${(550 - 550/zoomLevel)} ${(200 - 200/zoomLevel)} ${1100/zoomLevel} ${400/zoomLevel}`}
                    preserveAspectRatio="none" 
                    role="img" 
                    aria-label="Desplazamiento versus tiempo"
                    onWheel={handleGraphWheel}
                  >
                  <defs>
                    <linearGradient id="analysisStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d8e2ff" />
                      <stop offset="100%" stopColor="#4d8eff" />
                    </linearGradient>
                    <linearGradient id="analysisGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4edea3" />
                      <stop offset="100%" stopColor="#adc6ff" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  {chartModel.gridLines.map((y, idx) => (
                    <line key={`grid-${idx}`} className="analysis-gridline" x1="100" y1={y} x2="1000" y2={y} />
                  ))}
                  
                  {/* Axes */}
                  <line className="zero-axis" x1="100" y1={chartModel.zeroLine} x2="1000" y2={chartModel.zeroLine} />
                  <line className="axis-line" x1="100" y1="20" x2="100" y2="340" /> {/* Y axis */}
                  <line className="axis-line" x1="100" y1="340" x2="1000" y2="340" /> {/* X axis */}
                  
                  {/* Y-axis labels */}
                  {chartModel.yAxisLabels.map((label, idx) => (
                    <text key={`y-label-${idx}`} x="85" y={label.y} textAnchor="end" className="axis-label-text" fontSize={label.fontSize}>
                      {label.value.toFixed(3)}
                    </text>
                  ))}
                  
                  {/* X-axis labels */}
                  {chartModel.xAxisLabels.map((label, idx) => (
                    <text key={`x-label-${idx}`} x={label.x} y="365" textAnchor="middle" className="axis-label-text" fontSize={label.fontSize}>
                      {label.value.toFixed(1)}
                    </text>
                  ))}
                  
                  {/* Data lines */}
                  <polyline className="analysis-glow" points={chartModel.displacementLine} />
                  <polyline className="analysis-line" points={chartModel.displacementLine} />
                  <polyline className="velocity-line" points={chartModel.velocityLine} />
                  </svg>
                  
                  <div className="zoom-controls">
                    <button className="zoom-button" onClick={handleZoomOut} title="Alejar">−</button>
                    <span className="zoom-level">{(zoomLevel * 100).toFixed(0)}%</span>
                    <button className="zoom-button" onClick={handleZoomIn} title="Acercar">+</button>
                    <button className="zoom-button reset" onClick={handleResetZoom} title="Resetear zoom">⟲</button>
                  </div>
                </>
              ) : (
                <div className="graph-empty">Ejecuta la simulación para generar la curva de respuesta.</div>
              )}

              <div className="axis-label axis-label-x">t (seg)</div>
              <div className="axis-label axis-label-y">x (m)</div>
            </div>

            <div className="graph-legend">
              <span><i className="legend-dot displacement" /> Desplazamiento</span>
              <span><i className="legend-dot velocity" /> Velocidad</span>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer-bar">
        <div className="footer-copy">GABRIEL AJIN - DIEGO MEJIA - JEFRY MARTINEZ - BANELLY RIVERA </div>
      </footer>
    </div>
  );
}

function buildPlotModel(visibleRows, scaleRows, zoomLevel = 1) {
  if (!visibleRows.length || !scaleRows.length) {
    return {
      displacementLine: "",
      velocityLine: "",
      displacementPoint: null,
      gridLines: [],
      yAxisLabels: [],
      xAxisLabels: [],
      zeroLine: 190,
      fontSize: 12
    };
  }

  const tMin = scaleRows[0].t;
  const tMax = scaleRows[scaleRows.length - 1].t;
  const values = scaleRows.flatMap((row) => [row.x, row.y]);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const pad = Math.max(1e-6, (vMax - vMin) * 0.15);
  const yMin = vMin - pad;
  const yMax = vMax + pad;
  
  // Mapping functions: chart coordinates from 100 to 1000 (width) and 20 to 340 (height)
  const xMap = (t) => 100 + ((t - tMin) / (tMax - tMin || 1)) * 900;
  const yMap = (value) => 340 - ((value - yMin) / (yMax - yMin || 1)) * 320;
  
  // Calculate zero line position
  const zeroValue = 0;
  const zeroLine = yMap(zeroValue);
  
  // Calculate fontSize based on zoom level
  const baseFontSize = 12;
  const fontSize = Math.max(8, Math.min(24, baseFontSize * zoomLevel));

  // Generate grid lines and y-axis labels
  const ySteps = 5;
  const gridLines = [];
  const yAxisLabels = [];
  for (let i = 0; i <= ySteps; i++) {
    const value = yMin + (yMax - yMin) * (i / ySteps);
    const y = yMap(value);
    gridLines.push(y);
    yAxisLabels.push({ y: y + 4, value, fontSize });
  }

  // Generate x-axis labels (5-6 points evenly distributed)
  const xSteps = 5;
  const xAxisLabels = [];
  for (let i = 0; i <= xSteps; i++) {
    const tValue = tMin + (tMax - tMin) * (i / xSteps);
    const x = xMap(tValue);
    xAxisLabels.push({ x, value: tValue, fontSize });
  }

  const displacementLine = visibleRows.map((row) => `${xMap(row.t).toFixed(2)},${yMap(row.x).toFixed(2)}`).join(" ");
  const velocityLine = visibleRows.map((row) => `${xMap(row.t).toFixed(2)},${yMap(row.y).toFixed(2)}`).join(" ");
  const last = visibleRows[visibleRows.length - 1];

  return {
    displacementLine,
    velocityLine,
    displacementPoint: { x: xMap(last.t).toFixed(2), y: yMap(last.x).toFixed(2) },
    gridLines,
    yAxisLabels,
    xAxisLabels,
    zeroLine,
    fontSize
  };
}

function formatValue(value, digits) {
  const numeric = Number(value) || 0;
  return numeric.toFixed(digits);
}
