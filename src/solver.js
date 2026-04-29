import { compile } from "mathjs";

export function solveSystemRK4({ fExpr, gExpr, t0, tf, x0, y0, h }) {
  const fCompiled = compile(fExpr);
  const gCompiled = compile(gExpr);

  const results = [];

  let t = Number(t0);
  let x = Number(x0);
  let y = Number(y0);
  const end = Number(tf);
  const step = Number(h);

  if (!Number.isFinite(step) || step <= 0) {
    throw new Error("El paso h debe ser un numero mayor que 0.");
  }

  if (t >= end) {
    throw new Error("Se requiere que tf sea mayor que t0.");
  }

  const maxIterations = 100000;
  let iterations = 0;

  while (t <= end + 1e-9) {
    results.push({ t, x, y });

    const k1x = step * evalExpr(fCompiled, t, x, y);
    const k1y = step * evalExpr(gCompiled, t, x, y);

    const k2x = step * evalExpr(fCompiled, t + step / 2, x + k1x / 2, y + k1y / 2);
    const k2y = step * evalExpr(gCompiled, t + step / 2, x + k1x / 2, y + k1y / 2);

    const k3x = step * evalExpr(fCompiled, t + step / 2, x + k2x / 2, y + k2y / 2);
    const k3y = step * evalExpr(gCompiled, t + step / 2, x + k2x / 2, y + k2y / 2);

    const k4x = step * evalExpr(fCompiled, t + step, x + k3x, y + k3y);
    const k4y = step * evalExpr(gCompiled, t + step, x + k3x, y + k3y);

    x += (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
    y += (k1y + 2 * k2y + 2 * k3y + k4y) / 6;
    t += step;

    iterations += 1;
    if (iterations > maxIterations) {
      throw new Error("Demasiadas iteraciones. Revisa el intervalo o el valor de h.");
    }
  }

  return results;
}

function evalExpr(compiled, t, x, y) {
  const out = compiled.evaluate({ t, x, y });
  const numeric = Number(out);

  if (!Number.isFinite(numeric)) {
    throw new Error("Una ecuacion produjo un resultado no numerico.");
  }

  return numeric;
}
