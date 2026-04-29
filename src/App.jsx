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
    const durationMs = 9000;

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

  const chartModel = useMemo(() => buildPlotModel(visibleRows, rows), [visibleRows, rows]);
  const currentState = visibleRows[visibleRows.length - 1] ?? { t: 0, x: simConfig.x0, y: simConfig.y0 };

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

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-title-wrap">
          <span className="topbar-title">Ecuaciones Diferenciales: Simulador Masa-Resorte</span>
        </div>

        <div className="topbar-actions">
          <button className="icon-button" onClick={handleReset} type="button" title="Reiniciar">
            <span className="material-symbols-outlined">refresh</span>
          </button>
          <button className="icon-button" onClick={togglePause} type="button" title="Pausar o reanudar">
            <span className="material-symbols-outlined">{isPlaying ? "pause" : "play_arrow"}</span>
          </button>
          <button className="icon-button" type="button" title="Simulación con RK4 sin fuerza externa">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="side-column">
          <section className="panel controls-panel">
            <div className="section-copy">
              <h2>Parámetros del Sistema</h2>
              <p>Ajusta las constantes físicas para resolver la EDO homogénea: mx'' + cx' + kx = 0</p>
            </div>

            <div className="slider-stack">
              {Object.entries(sliderConfig).map(([key, config]) => (
                <div className="slider-group" key={key}>
                  <div className="slider-head">
                    <label>{config.label}</label>
                    <span>{formatValue(form[key], 2)} {config.unit}</span>
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

            <div className="action-stack">
              <button className="primary-action" onClick={runSimulation} type="button">
                <span className="material-symbols-outlined">play_arrow</span>
                Iniciar Simulación
              </button>

              <div className="secondary-actions">
                <button className="secondary-action" onClick={togglePause} type="button">
                  <span className="material-symbols-outlined">pause</span>
                  {isPlaying ? "Pausar" : "Reanudar"}
                </button>
                <button className="secondary-action" onClick={handleReset} type="button">
                  <span className="material-symbols-outlined">restart_alt</span>
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
                <svg className="analysis-chart" viewBox="0 0 1000 260" preserveAspectRatio="none" role="img" aria-label="Desplazamiento versus tiempo">
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
                  <line className="zero-axis" x1="80" y1="130" x2="960" y2="130" />
                  {chartModel.gridLines.map((y) => (
                    <line key={y} className="analysis-gridline" x1="80" y1={y} x2="960" y2={y} />
                  ))}
                  <polyline className="analysis-glow" points={chartModel.displacementLine} />
                  <polyline className="analysis-line" points={chartModel.displacementLine} />
                  <polyline className="velocity-line" points={chartModel.velocityLine} />
                  {chartModel.displacementPoint && (
                    <circle className="analysis-cursor" cx={chartModel.displacementPoint.x} cy={chartModel.displacementPoint.y} r="4.5" />
                  )}
                </svg>
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
        <div className="footer-links">
          <span>Documentación</span>
          <span>Exportar Datos</span>
          <span>Estado del Sistema</span>
        </div>
        <div className="footer-copy">Proyecto Ecuas — Simulador de Escritorio</div>
      </footer>
    </div>
  );
}

function buildPlotModel(visibleRows, scaleRows) {
  if (!visibleRows.length || !scaleRows.length) {
    return {
      displacementLine: "",
      velocityLine: "",
      displacementPoint: null,
      gridLines: [40, 85, 130, 175, 220]
    };
  }

  const tMin = scaleRows[0].t;
  const tMax = scaleRows[scaleRows.length - 1].t;
  const values = scaleRows.flatMap((row) => [row.x, row.y]);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const pad = Math.max(1e-6, (vMax - vMin) * 0.12);
  const yMin = vMin - pad;
  const yMax = vMax + pad;
  const xMap = (t) => 80 + ((t - tMin) / (tMax - tMin || 1)) * 880;
  const yMap = (value) => 220 - ((value - yMin) / (yMax - yMin || 1)) * 180;

  const displacementLine = visibleRows.map((row) => `${xMap(row.t).toFixed(2)},${yMap(row.x).toFixed(2)}`).join(" ");
  const velocityLine = visibleRows.map((row) => `${xMap(row.t).toFixed(2)},${yMap(row.y).toFixed(2)}`).join(" ");
  const last = visibleRows[visibleRows.length - 1];

  return {
    displacementLine,
    velocityLine,
    displacementPoint: { x: xMap(last.t).toFixed(2), y: yMap(last.x).toFixed(2) },
    gridLines: [40, 85, 130, 175, 220]
  };
}

function formatValue(value, digits) {
  const numeric = Number(value) || 0;
  return numeric.toFixed(digits);
}
