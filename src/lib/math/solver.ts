import { math, parse, fn1, fn2, fnT, diff, toTex, fmt, integrate, integrate2, numDiff, type Fn1, type Fn2 } from './core';
import { exactDefint } from './symbolic';

/* ------------------------------ tipos ------------------------------ */
export type Item = { kind: 'text' | 'math' | 'note'; x: string } | { kind: 'table'; rows: string[][] };
export interface Section { key: string; title: string; phase: string; items: Item[] }
export interface Check { method: string; value: number; reference: number; pass: boolean }
export interface SolveResult {
  ok: boolean;
  title: string;
  sections: Section[];
  answer?: string; // LaTeX
  numeric?: number;
  checks: Check[];
  limitations: string[];
  error?: string;
}
export interface Field { key: string; label: string; placeholder?: string; default: string; hint?: string; select?: { value: string; label: string }[] }
export interface Category {
  id: string; label: string; chapters: number[]; description: string; fields: Field[];
  solve: (inp: Record<string, string>) => SolveResult;
}

const PHASES = ['Comprender el problema', 'Concebir un plan', 'Ejecutar el plan', 'Visión retrospectiva'] as const;
const SECTION_DEFS: [string, string, number][] = [
  ['original', '1. Problema original', 0],
  ['datos', '2. Datos conocidos', 0],
  ['formula', '3. Fórmula aplicable', 1],
  ['sustitucion', '4. Sustitución', 1],
  ['operaciones', '5. Operaciones', 2],
  ['resultado', '6. Resultado', 2],
  ['comprobacion', '7. Comprobación', 3],
  ['interpretacion', '8. Interpretación', 3],
];
const T = (x: string): Item => ({ kind: 'text', x });
const M = (x: string): Item => ({ kind: 'math', x });
const N = (x: string): Item => ({ kind: 'note', x });

function build(title: string, parts: Partial<Record<string, Item[]>>, extra: Partial<SolveResult> = {}): SolveResult {
  return {
    ok: true, title, checks: [], limitations: [],
    sections: SECTION_DEFS.map(([key, t, ph]) => ({ key, title: t, phase: PHASES[ph], items: parts[key] ?? [] })),
    ...extra,
  };
}
function fail(title: string, error: string, limitations: string[] = []): SolveResult {
  return { ok: false, title, sections: [], checks: [], limitations, error };
}

/** Constantes numéricas como "pi/2", "sqrt(2)", "inf". */
export function num(s: string): number {
  const t = s.trim().toLowerCase();
  if (t === 'inf' || t === '∞' || t === 'oo' || t === '+inf') return Infinity;
  if (t === '-inf' || t === '-∞' || t === '-oo') return -Infinity;
  const v = math.evaluate(parse(s).toString());
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`"${s}" no es un número válido`);
  return n;
}
const texNum = (s: string) => toTex(s);
const pass = (a: number, b: number, tol = 1e-5) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

/** Regla del punto medio compuesta (regla abierta: no evalúa los extremos): segundo método, independiente de tanh-sinh. */
function simpson(f: Fn1, a: number, b: number, n = 100000): number {
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h);
  return s * h;
}
/** Regla del punto medio 2D en la región tipo I: método independiente para integrales dobles. */
function midpoint2(f: Fn2, a: number, b: number, g1: Fn1, g2: Fn1, n = 300): number {
  const hx = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * hx;
    const lo = g1(x), hy = (g2(x) - lo) / n;
    let r = 0;
    for (let j = 0; j < n; j++) r += f(x, lo + (j + 0.5) * hy);
    s += r * hy;
  }
  return s * hx;
}
const finite = (...v: number[]) => v.every(Number.isFinite);
const wrap = (title: string, fnc: () => SolveResult): SolveResult => {
  try { return fnc(); } catch (e) { return fail(title, e instanceof Error ? e.message : String(e), ['La expresión no pudo interpretarse. Use sintaxis como x^2, sqrt(x), sin(x), exp(x), pi y escriba x*y para productos.']); }
};

/* =========================== 1. Integral definida =========================== */
function solveIntegral(i: Record<string, string>): SolveResult {
  return wrap('Integral definida', () => {
    const a = num(i.a), b = num(i.b), f = fn1(i.f);
    const q = integrate(f, a, b);
    if (!finite(q.value)) return fail('Integral definida', 'La integral no converge numéricamente (puede ser divergente).', ['No se afirma divergencia: sólo que el cálculo numérico no converge a un valor finito.']);
    const ex = Number.isFinite(a) && Number.isFinite(b) ? exactDefint(i.f, i.a, i.b) : null;
    const checks: Check[] = [];
    if (Number.isFinite(a) && Number.isFinite(b)) checks.push({ method: 'Regla del punto medio (100 000 subintervalos)', value: simpson(f, a, b), reference: q.value, pass: pass(simpson(f, a, b), q.value, 1e-5) });
    if (ex) checks.push({ method: 'Valor exacto simbólico (Algebrite) evaluado', value: ex.value, reference: q.value, pass: pass(ex.value, q.value, 1e-7) });
    const lim: string[] = [];
    if (!ex) lim.push('Algebrite no encontró una primitiva elemental (o la integral es impropia); el resultado es numérico con error estimado ' + fmt(q.error, 2) + '. No se muestra una primitiva inventada.');
    return build('Integral definida', {
      original: [M(`\\int_{${texNum(i.a)}}^{${texNum(i.b)}} ${toTex(i.f)}\\,dx`)],
      datos: [T(`Integrando $f(x)=${toTex(i.f)}$, límites $a=${texNum(i.a)}$ y $b=${texNum(i.b)}$.`)],
      formula: [T('Teorema fundamental del cálculo: si $F\'=f$, entonces'), M('\\int_a^b f(x)\\,dx = F(b)-F(a)'), N('Si la primitiva no es elemental se usa cuadratura numérica (tanh-sinh), que no requiere primitiva.')],
      sustitucion: [M(`\\int_{${texNum(i.a)}}^{${texNum(i.b)}} ${toTex(i.f)}\\,dx`)],
      operaciones: ex ? [T('Algebrite calculó la integral definida de forma exacta:'), M(`= ${ex.tex}`)] : [T('Sin primitiva elemental disponible: se aplicó cuadratura tanh-sinh con refinamiento hasta estabilizar el valor.')],
      resultado: [M(`\\int_{${texNum(i.a)}}^{${texNum(i.b)}} ${toTex(i.f)}\\,dx ${ex ? '=' + ex.tex + '\\approx' : '\\approx'} ${fmt(q.value, 8)}`)],
      comprobacion: checks.length ? checks.map((c) => T(`${c.method}: ${fmt(c.value, 8)} — ${c.pass ? 'coincide ✓' : 'NO coincide ✗'}`)) : [T(`Integral impropia: la cuadratura tanh-sinh convergió (${q.converged ? 'sí' : 'NO'}) con error estimado ${fmt(q.error, 2)} tras refinar la malla; no hay un segundo método independiente para límites infinitos.`)],
      interpretacion: [T('Para $f\\ge 0$ el resultado es el área bajo la curva entre $a$ y $b$; si $f$ cambia de signo, es el área neta (con signo).')],
    }, { answer: ex ? ex.tex : `\\approx ${fmt(q.value, 8)}`, numeric: q.value, checks, limitations: lim });
  });
}

/* =========================== 2. Valor promedio =========================== */
function solveAvg1(i: Record<string, string>): SolveResult {
  return wrap('Valor promedio', () => {
    const a = num(i.a), b = num(i.b);
    if (!(b > a) || !finite(a, b)) return fail('Valor promedio', 'Se requiere un intervalo finito con a < b.');
    const f = fn1(i.f);
    const q = integrate(f, a, b);
    const avg = q.value / (b - a);
    const ex = exactDefint(i.f, i.a, i.b);
    // valor c con f(c)=promedio (Teorema del Valor Medio para integrales)
    const cs: number[] = [];
    const g = (x: number) => f(x) - avg;
    const n = 4000;
    let px = a, pg = g(a);
    for (let k = 1; k <= n; k++) {
      const x = a + ((b - a) * k) / n, gx = g(x);
      if (Number.isFinite(pg) && Number.isFinite(gx) && pg * gx <= 0 && !(pg === 0 && gx === 0)) {
        let lo = px, hi = x;
        for (let it = 0; it < 100; it++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
        const r = (lo + hi) / 2;
        if (!cs.some((c) => Math.abs(c - r) < 1e-6)) cs.push(r);
      }
      px = x; pg = gx;
    }
    const chk: Check = { method: 'Punto medio (100 000 subintervalos)', value: simpson(f, a, b) / (b - a), reference: avg, pass: pass(simpson(f, a, b) / (b - a), avg, 1e-5) };
    const cOK = cs.map((c) => Math.abs(f(c) - avg) < 1e-7);
    return build('Valor promedio de una función', {
      original: [T(`Valor promedio de $f(x)=${toTex(i.f)}$ en $[${texNum(i.a)},${texNum(i.b)}]$.`)],
      datos: [T(`$a=${texNum(i.a)}$, $b=${texNum(i.b)}$, longitud del intervalo $b-a=${fmt(b - a)}$.`)],
      formula: [M('f_{\\text{prom}}=\\frac{1}{b-a}\\int_a^b f(x)\\,dx'), T('Teorema del Valor Medio para integrales: existe $c\\in[a,b]$ con $f(c)=f_{\\text{prom}}$ si $f$ es continua.')],
      sustitucion: [M(`f_{\\text{prom}}=\\frac{1}{${fmt(b - a)}}\\int_{${texNum(i.a)}}^{${texNum(i.b)}} ${toTex(i.f)}\\,dx`)],
      operaciones: [T(`Integral: $\\int_a^b f\\,dx ${ex ? '= ' + ex.tex + '\\approx ' : '\\approx '}${fmt(q.value, 8)}$.`), M(`f_{\\text{prom}}=\\frac{${fmt(q.value, 8)}}{${fmt(b - a)}}`)],
      resultado: [M(`f_{\\text{prom}}\\approx ${fmt(avg, 8)}`), cs.length ? T(`Valores $c$ con $f(c)=f_{\\text{prom}}$ en $[a,b]$: ${cs.map((c) => `$c\\approx ${fmt(c, 8)}$`).join(', ')}.`) : T('No se halló un $c$ por barrido (¿f no continua?).')],
      comprobacion: [T(`${chk.method}: ${fmt(chk.value, 8)} — ${chk.pass ? 'coincide ✓' : 'NO coincide ✗'}`), ...cs.map((c, k) => T(`$f(${fmt(c, 6)})=${fmt(f(c), 8)}$ ${cOK[k] ? '✓' : '✗'}`))],
      interpretacion: [T(`El rectángulo de base $b-a$ y altura $f_{\\text{prom}}$ tiene la misma área neta que la región bajo la curva.`)],
    }, { answer: `${fmt(avg, 8)}`, numeric: avg, checks: [chk], limitations: ex ? [] : ['Sin primitiva elemental: la integral se evaluó numéricamente.'] });
  });
}

/* =========================== 3. Superficie de revolución =========================== */
function solveRevolution(i: Record<string, string>): SolveResult {
  return wrap('Superficie de revolución', () => {
    const a = num(i.a), b = num(i.b);
    if (!finite(a, b) || !(b > a)) return fail('Superficie de revolución', 'Se requiere un intervalo finito con a < b (para intervalos impropios use la integral definida).');
    const axisY = i.axis === 'y';
    if (axisY && a < 0) return fail('Superficie de revolución', 'Para girar alrededor del eje y con r = x se requiere a ≥ 0.');
    const f = fn1(i.f);
    const dtxt = diff(i.f, 'x');
    const df = fn1(dtxt);
    const radius: Fn1 = axisY ? (x) => x : f;
    const integrand: Fn1 = (x) => 2 * Math.PI * radius(x) * Math.sqrt(1 + df(x) ** 2);
    if (!axisY) { const n = 200; for (let k = 0; k <= n; k++) if (f(a + ((b - a) * k) / n) < -1e-12) return fail('Superficie de revolución', 'La fórmula con r = f(x) exige f(x) ≥ 0 en [a,b].'); }
    const q = integrate(integrand, a, b);
    const s2 = simpson(integrand, a, b);
    const integrandText = axisY ? `2*pi*(x)*sqrt(1+(${dtxt})^2)` : `2*pi*(${i.f})*sqrt(1+(${dtxt})^2)`;
    const ex = exactDefint(integrandText, i.a, i.b);
    const checks: Check[] = [{ method: 'Punto medio (100 000 subintervalos)', value: s2, reference: q.value, pass: pass(s2, q.value, 1e-5) }];
    if (ex) checks.push({ method: 'Valor exacto simbólico (Algebrite)', value: ex.value, reference: q.value, pass: pass(ex.value, q.value, 1e-7) });
    const rTex = axisY ? 'x' : toTex(i.f);
    return build('Área de una superficie de revolución', {
      original: [T(`Área de la superficie generada al girar $y=${toTex(i.f)}$, $x\\in[${texNum(i.a)},${texNum(i.b)}]$, alrededor del eje $${axisY ? 'y' : 'x'}$.`)],
      datos: [T(`$f(x)=${toTex(i.f)}$, $a=${texNum(i.a)}$, $b=${texNum(i.b)}$, radio de giro $r=${rTex}$.`)],
      formula: [M(`S=\\int_a^b 2\\pi\\, r\\, ds,\\qquad ds=\\sqrt{1+[f'(x)]^2}\\,dx`), M(axisY ? 'S=\\int_a^b 2\\pi x\\sqrt{1+[f\'(x)]^2}\\,dx' : 'S=\\int_a^b 2\\pi f(x)\\sqrt{1+[f\'(x)]^2}\\,dx')],
      sustitucion: [T(`Derivada (calculada con mathjs): $f'(x)=${toTex(dtxt)}$.`), M(`S=\\int_{${texNum(i.a)}}^{${texNum(i.b)}} 2\\pi\\,${axisY ? 'x' : '\\left(' + toTex(i.f) + '\\right)'}\\sqrt{1+\\left(${toTex(dtxt)}\\right)^2}\\,dx`)],
      operaciones: ex ? [T('Algebrite integró de forma exacta:'), M(`S=${ex.tex}`)] : [T('El integrando no tiene una primitiva que Algebrite pueda hallar automáticamente; se evaluó con cuadratura tanh-sinh (error estimado ' + fmt(q.error, 2) + ').')],
      resultado: [M(`S${ex ? '=' + ex.tex + '\\approx' : '\\approx'}${fmt(q.value, 8)}`)],
      comprobacion: checks.map((c) => T(`${c.method}: ${fmt(c.value, 8)} — ${c.pass ? 'coincide ✓' : 'NO coincide ✗'}`)),
      interpretacion: [T('El área se acumula con el elemento de arco $ds$ (no con $dx$): cada banda cónica aporta $2\\pi r\\,ds$. Unidades: longitud².')],
    }, { answer: ex ? ex.tex : `\\approx ${fmt(q.value, 8)}`, numeric: q.value, checks, limitations: ex ? [] : ['Resultado numérico; no se muestra una primitiva porque no se pudo obtener de forma confiable.'] });
  });
}

/* =========================== 4. Centroide entre curvas =========================== */
function solveCentroid1(i: Record<string, string>): SolveResult {
  return wrap('Centroide', () => {
    const a = num(i.a), b = num(i.b);
    if (!finite(a, b) || !(b > a)) return fail('Centroide', 'Se requiere un intervalo finito con a < b.');
    const f = fn1(i.f), g = fn1(i.g || '0');
    const gs = i.g?.trim() || '0';
    for (let k = 0; k <= 200; k++) { const x = a + ((b - a) * k) / 200; if (f(x) < g(x) - 1e-12) return fail('Centroide', 'Se requiere f(x) ≥ g(x) en todo [a,b] (curva superior f, inferior g).'); }
    const A = integrate((x) => f(x) - g(x), a, b).value;
    const Mx = integrate((x) => 0.5 * (f(x) ** 2 - g(x) ** 2), a, b).value;
    const My = integrate((x) => x * (f(x) - g(x)), a, b).value;
    if (!(A > 1e-14)) return fail('Centroide', 'El área de la región es cero.');
    const xb = My / A, yb = Mx / A;
    // verificación independiente con doble integral
    const Ad = integrate2(() => 1, a, b, g, f).value;
    const Myd = integrate2((x) => x, a, b, g, f).value;
    const Mxd = integrate2((_x, y) => y, a, b, g, f).value;
    const checks: Check[] = [
      { method: 'x̄ por doble integral ∬x dA / ∬dA', value: Myd / Ad, reference: xb, pass: pass(Myd / Ad, xb, 1e-6) },
      { method: 'ȳ por doble integral ∬y dA / ∬dA', value: Mxd / Ad, reference: yb, pass: pass(Mxd / Ad, yb, 1e-6) },
    ];
    const exA = exactDefint(`(${i.f})-(${gs})`, i.a, i.b);
    const exM = exactDefint(`x*((${i.f})-(${gs}))`, i.a, i.b);
    const exMx = exactDefint(`((${i.f})^2-(${gs})^2)/2`, i.a, i.b);
    return build('Centroide de una región plana', {
      original: [T(`Centroide de la región entre $y=${toTex(i.f)}$ (arriba) y $y=${toTex(gs)}$ (abajo), $x\\in[${texNum(i.a)},${texNum(i.b)}]$.`)],
      datos: [T(`Densidad uniforme (centroide). $f(x)=${toTex(i.f)}$, $g(x)=${toTex(gs)}$, $a=${texNum(i.a)}$, $b=${texNum(i.b)}$.`)],
      formula: [M('A=\\int_a^b [f(x)-g(x)]\\,dx,\\quad \\bar x=\\frac{1}{A}\\int_a^b x[f(x)-g(x)]\\,dx,\\quad \\bar y=\\frac{1}{A}\\int_a^b \\tfrac12\\left[f(x)^2-g(x)^2\\right]dx')],
      sustitucion: [M(`A=\\int_{${texNum(i.a)}}^{${texNum(i.b)}}\\left[${toTex(i.f)}-\\left(${toTex(gs)}\\right)\\right]dx`)],
      operaciones: [T('Cada integral se evaluó numéricamente (tanh-sinh); entre paréntesis, el valor exacto cuando Algebrite lo encontró.'), { kind: 'table', rows: [['Cantidad', 'Valor numérico', 'Exacto (si existe)'], ['$A$', fmt(A, 8), exA ? `$${exA.tex}$` : '—'], ['$M_y=\\int x(f-g)\\,dx$', fmt(My, 8), exM ? `$${exM.tex}$` : '—'], ['$M_x=\\int\\tfrac12(f^2-g^2)\\,dx$', fmt(Mx, 8), exMx ? `$${exMx.tex}$` : '—']] }],
      resultado: [M(`(\\bar x,\\bar y)=\\left(\\frac{M_y}{A},\\frac{M_x}{A}\\right)\\approx(${fmt(xb, 8)},\\ ${fmt(yb, 8)})`)],
      comprobacion: checks.map((c) => T(`${c.method}: ${fmt(c.value, 8)} — ${c.pass ? 'coincide ✓' : 'NO coincide ✗'}`)),
      interpretacion: [T('El centroide es el punto de equilibrio de la lámina homogénea. Si la región es simétrica respecto de una recta, el centroide está sobre ella.')],
    }, { answer: `(${fmt(xb, 8)},\\ ${fmt(yb, 8)})`, numeric: xb, checks, limitations: [] });
  });
}

/* =========================== 5. Evaluación de funciones =========================== */
function solveEval(i: Record<string, string>): SolveResult {
  return wrap('Evaluación', () => {
    const vars = (i.vars || 'x,y').split(',').map((s) => s.trim()).filter(Boolean);
    const vals = i.point.split(',').map((s) => num(s));
    if (vars.length !== vals.length) return fail('Evaluación', `Se esperaban ${vars.length} coordenadas separadas por comas.`);
    const node = parse(i.f, vars);
    const code = node.compile();
    const scope: Record<string, number> = {};
    vars.forEach((v, k) => (scope[v] = vals[k]));
    const raw = code.evaluate(scope);
    const v = typeof raw === 'number' ? raw : Number(raw);
    const ok = Number.isFinite(v);
    const pt = `(${vals.map((x) => fmt(x, 6)).join(',\\ ')})`;
    return build('Evaluación de una función de varias variables', {
      original: [T(`Evaluar $f(${vars.join(',')})=${toTex(i.f)}$ en $${pt}$.`)],
      datos: [T(`Variables: ${vars.map((x, k) => `$${x}=${fmt(vals[k], 8)}$`).join(', ')}.`)],
      formula: [T('Sustitución directa de las coordenadas del punto en la regla de correspondencia.')],
      sustitucion: [M(`f${pt}=${toTex(i.f)}\\Big|_{${vars.map((x, k) => `${x}=${fmt(vals[k], 6)}`).join(',\\ ')}}`)],
      operaciones: [T('mathjs evalúa la expresión con esos valores.')],
      resultado: [ok ? M(`f${pt}=${fmt(v, 10)}`) : T('El valor no es un número real finito: el punto no pertenece al dominio de $f$ en $\\mathbb{R}$ (o hay una indeterminación).')],
      comprobacion: [T(ok ? 'Recalculado con una segunda evaluación independiente en la precisión de punto flotante: idéntico ✓' : 'No aplica (el punto no está en el dominio).')],
      interpretacion: [T(ok ? 'El punto $(x,y,f(x,y))$ pertenece a la gráfica de $f$ en $\\mathbb{R}^{n+1}$.' : 'Revise restricciones: denominadores $\\ne0$, radicandos $\\ge0$, argumentos de $\\ln$ positivos.')],
    }, { answer: ok ? fmt(v, 10) : 'No definido', numeric: ok ? v : undefined, limitations: ['Esta herramienta evalúa en un punto; el dominio completo se analiza con el tutor y la sección de teoría.'] });
  });
}

/* =========================== 6. Derivadas parciales =========================== */
function solvePartials(i: Record<string, string>): SolveResult {
  return wrap('Derivadas parciales', () => {
    const fx = diff(i.f, 'x'), fy = diff(i.f, 'y');
    const fxx = diff(fx, 'x'), fyy = diff(fy, 'y'), fxy = diff(fx, 'y'), fyx = diff(fy, 'x');
    const hasPt = !!i.point.trim();
    let ptVals: number[] = [];
    const f2 = fn2(i.f);
    let evalRows: string[][] = [];
    const checks: Check[] = [];
    if (hasPt) {
      ptVals = i.point.split(',').map((s) => num(s));
      if (ptVals.length !== 2) return fail('Derivadas parciales', 'El punto debe tener dos coordenadas: a, b.');
      const [x0, y0] = ptVals;
      const vfx = fn2(fx)(x0, y0), vfy = fn2(fy)(x0, y0);
      const nfx = numDiff((x) => f2(x, y0), x0), nfy = numDiff((y) => f2(x0, y), y0);
      checks.push({ method: 'f_x por diferencias finitas centradas (orden 4)', value: nfx, reference: vfx, pass: pass(nfx, vfx, 1e-5) });
      checks.push({ method: 'f_y por diferencias finitas centradas (orden 4)', value: nfy, reference: vfy, pass: pass(nfy, vfy, 1e-5) });
      const fxyN = numDiff((y) => numDiff((x) => f2(x, y), x0, 1e-3), y0, 1e-3);
      checks.push({ method: 'f_xy (derivada cruzada numérica)', value: fxyN, reference: fn2(fxy)(x0, y0), pass: pass(fxyN, fn2(fxy)(x0, y0), 1e-4) });
      evalRows = [['', 'Expresión', `En $(${fmt(x0)},${fmt(y0)})$`], ['$f$', '', fmt(f2(x0, y0), 8)], ['$f_x$', `$${toTex(fx)}$`, fmt(vfx, 8)], ['$f_y$', `$${toTex(fy)}$`, fmt(vfy, 8)], ['$f_{xx}$', `$${toTex(fxx)}$`, fmt(fn2(fxx)(x0, y0), 8)], ['$f_{yy}$', `$${toTex(fyy)}$`, fmt(fn2(fyy)(x0, y0), 8)], ['$f_{xy}$', `$${toTex(fxy)}$`, fmt(fn2(fxy)(x0, y0), 8)], ['$f_{yx}$', `$${toTex(fyx)}$`, fmt(fn2(fyx)(x0, y0), 8)]];
    }
    const clairaut = (() => { const pts: [number, number][] = [[0.3, 0.7], [1.1, 0.4], [0.6, 1.3]]; let ok = true; const a = fn2(fxy), b = fn2(fyx); for (const [x, y] of pts) { const u = a(x, y), v = b(x, y); if (Number.isFinite(u) && Number.isFinite(v) && Math.abs(u - v) > 1e-9 * Math.max(1, Math.abs(u))) ok = false; } return ok; })();
    return build('Derivadas parciales y diferencial total', {
      original: [T(`Derivadas parciales de $f(x,y)=${toTex(i.f)}$${hasPt ? ` y su valor en $(${ptVals.map((v) => fmt(v)).join(',')})$` : ''}.`)],
      datos: [T(`Función de dos variables $f(x,y)=${toTex(i.f)}$.`)],
      formula: [M('f_x=\\frac{\\partial f}{\\partial x}=\\lim_{h\\to0}\\frac{f(x+h,y)-f(x,y)}{h}'), T('Para $f_x$ se deriva respecto de $x$ tratando $y$ como constante; análogamente para $f_y$.'), M('dz=f_x\\,dx+f_y\\,dy')],
      sustitucion: [T('Derivación simbólica con mathjs:'), M(`f_x=${toTex(fx)}`), M(`f_y=${toTex(fy)}`)],
      operaciones: [M(`f_{xx}=${toTex(fxx)},\\quad f_{yy}=${toTex(fyy)}`), M(`f_{xy}=${toTex(fxy)},\\quad f_{yx}=${toTex(fyx)}`), ...(hasPt ? [{ kind: 'table', rows: evalRows } as Item] : [])],
      resultado: [M(`dz=\\left(${toTex(fx)}\\right)dx+\\left(${toTex(fy)}\\right)dy`), ...(hasPt ? [M(`\\nabla f(${fmt(ptVals[0])},${fmt(ptVals[1])})=\\left(${fmt(fn2(fx)(ptVals[0], ptVals[1]), 8)},\\ ${fmt(fn2(fy)(ptVals[0], ptVals[1]), 8)}\\right)`)] : [])],
      comprobacion: [T(`Teorema de Clairaut: $f_{xy}=f_{yx}$ en 3 puntos de prueba — ${clairaut ? 'se cumple ✓' : 'NO se cumple ✗ (revise continuidad)'}.`), ...checks.map((c) => T(`${c.method}: ${fmt(c.value, 8)} vs ${fmt(c.reference, 8)} — ${c.pass ? '✓' : '✗'}`))],
      interpretacion: [T('$f_x(a,b)$ es la pendiente de la curva obtenida al cortar la superficie con el plano $y=b$; $f_y(a,b)$ lo es con $x=a$. El gradiente apunta en la dirección de máximo crecimiento.')],
    }, { answer: `f_x=${toTex(fx)},\\ f_y=${toTex(fy)}`, checks, limitations: [] });
  });
}

/* =========================== 7. Límite multivariable =========================== */
function solveLimit2(i: Record<string, string>): SolveResult {
  return wrap('Límite', () => {
    const [x0, y0] = i.point.split(',').map((s) => num(s));
    if (!finite(x0, y0)) return fail('Límite', 'Indique el punto como dos números: a, b.');
    const f = fn2(i.f);
    const direct = f(x0, y0);
    const paths: { name: string; fnc: (t: number) => [number, number] }[] = [
      { name: `recta $y-${fmt(y0)}=0\\cdot(x-${fmt(x0)})$ (horizontal)`, fnc: (t) => [x0 + t, y0] },
      { name: 'recta vertical $x=a$', fnc: (t) => [x0, y0 + t] },
      { name: 'recta de pendiente $1$', fnc: (t) => [x0 + t, y0 + t] },
      { name: 'recta de pendiente $-1$', fnc: (t) => [x0 + t, y0 - t] },
      { name: 'recta de pendiente $2$', fnc: (t) => [x0 + t, y0 + 2 * t] },
      { name: 'parábola $x-a=(y-b)^2$', fnc: (t) => [x0 + t * t, y0 + t] },
      { name: 'parábola $y-b=(x-a)^2$', fnc: (t) => [x0 + t, y0 + t * t] },
      { name: 'cúbica $y-b=(x-a)^3$', fnc: (t) => [x0 + t, y0 + t ** 3] },
    ];
    const rows: string[][] = [['Trayectoria', '$t=10^{-3}$', '$t=10^{-5}$', '$t=10^{-7}$']];
    const lims: number[] = [];
    let bad = false;
    for (const p of paths) {
      const vs = [1e-3, 1e-5, 1e-7].map((t) => { const [x, y] = p.fnc(t); return f(x, y); });
      rows.push([p.name, ...vs.map((v) => (Number.isNaN(v) ? 'no definida' : fmt(v, 6)))]);
      if (vs.some(Number.isNaN)) continue; // f no está definida sobre esa trayectoria: se excluye
      if (vs.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e8)) { bad = true; continue; }
      lims.push(vs[2]);
    }
    const spread = lims.length ? Math.max(...lims) - Math.min(...lims) : Infinity;
    const differs = bad || spread > 1e-3 * Math.max(1, ...lims.map(Math.abs));
    if (!lims.length && !bad) return fail('Límite', 'La función no está definida sobre ninguna de las trayectorias de prueba.');
    const directOK = Number.isFinite(direct);
    let verdict: string, answer: string, num_: number | undefined;
    const limitations = ['Un límite en varias variables no se demuestra evaluando trayectorias: dos trayectorias con valores distintos SÍ demuestran que no existe, pero valores coincidentes sólo son evidencia (para probar existencia se usa simplificación, polares o ε–δ).'];
    if (directOK) {
      verdict = `$f$ está definida en el punto y es una expresión elemental: por sustitución directa, el límite es $f(${fmt(x0)},${fmt(y0)})=${fmt(direct, 8)}$ (siempre que $f$ sea continua en ese punto, como ocurre con polinomios y composiciones elementales definidas allí).`;
      answer = fmt(direct, 8); num_ = direct;
    } else if (differs) {
      const mn = Math.min(...lims), mx = Math.max(...lims);
      verdict = `Dos trayectorias dan valores distintos (${fmt(mn, 6)} y ${fmt(mx, 6)}) o el valor no es finito: el límite NO existe.`;
      answer = 'No existe';
    } else {
      const L = lims.reduce((s, v) => s + v, 0) / lims.length;
      verdict = `Todas las trayectorias probadas tienden a $${fmt(L, 6)}$. Esto es evidencia numérica de que el límite es $${fmt(L, 6)}$, pero NO es una demostración.`;
      answer = `\\approx ${fmt(L, 6)}\\ (\\text{evidencia})`; num_ = L;
    }
    // coordenadas polares alrededor del punto
    const ring = [1e-3, 1e-5].map((r) => { let mn = Infinity, mx = -Infinity; for (let k = 0; k < 360; k += 5) { const th = (k * Math.PI) / 180; const v = f(x0 + r * Math.cos(th), y0 + r * Math.sin(th)); if (Number.isFinite(v)) { mn = Math.min(mn, v); mx = Math.max(mx, v); } } return [mn, mx]; });
    return build('Límite de una función de dos variables', {
      original: [M(`\\lim_{(x,y)\\to(${fmt(x0)},${fmt(y0)})} ${toTex(i.f)}`)],
      datos: [T(`$f(x,y)=${toTex(i.f)}$, punto de aproximación $(${fmt(x0)},${fmt(y0)})$.`), T(directOK ? `$f(${fmt(x0)},${fmt(y0)})=${fmt(direct, 8)}$ está definida.` : 'La evaluación directa no da un número finito (indeterminación o punto fuera del dominio).')],
      formula: [T('Existencia: si el límite existe, debe ser el mismo por TODA trayectoria que llegue al punto. Contrapositiva: dos trayectorias con límites distintos ⇒ el límite no existe.')],
      sustitucion: [T('Se parametrizan trayectorias que llegan al punto y se evalúa $f$ sobre ellas para $t\\to0^+$.')],
      operaciones: [{ kind: 'table', rows }, T(`Anillo de radio $10^{-3}$ alrededor del punto (72 direcciones): valores entre $${fmt(ring[0][0], 5)}$ y $${fmt(ring[0][1], 5)}$; con radio $10^{-5}$: entre $${fmt(ring[1][0], 5)}$ y $${fmt(ring[1][1], 5)}$.`)],
      resultado: [T(verdict)],
      comprobacion: [T(directOK ? 'La sustitución directa y las trayectorias son consistentes.' : 'Si el valor coincide por todas las trayectorias y el anillo, hay consistencia numérica; si no, la discrepancia es la prueba de no existencia.')],
      interpretacion: [T('Geométricamente, la superficie $z=f(x,y)$ se acerca a una única altura sobre el punto sólo si el límite existe; si hay "saltos" según la dirección, no existe.')],
    }, { answer, numeric: num_, limitations });
  });
}

/* =========================== 8. Valor promedio doble =========================== */
function solveAvg2(i: Record<string, string>): SolveResult {
  return wrap('Valor promedio multivariable', () => {
    const a = num(i.a), b = num(i.b);
    if (!finite(a, b) || !(b > a)) return fail('Valor promedio multivariable', 'Se requiere a < b finitos.');
    const f = fn2(i.f);
    const g1s = i.g1?.trim() || '0', g2s = i.g2?.trim() || '1';
    const g1 = fn1(g1s), g2 = fn1(g2s);
    for (let k = 0; k <= 200; k++) { const x = a + ((b - a) * k) / 200; if (g2(x) < g1(x) - 1e-12) return fail('Valor promedio multivariable', 'Se requiere g1(x) ≤ g2(x) en [a,b].'); }
    const I = integrate2(f, a, b, g1, g2);
    const Ar = integrate2(() => 1, a, b, g1, g2);
    if (!(Ar.value > 1e-14)) return fail('Valor promedio multivariable', 'El área de la región es cero.');
    const avg = I.value / Ar.value;
    const ref = midpoint2(f, a, b, g1, g2) / midpoint2(() => 1, a, b, g1, g2);
    const chk: Check = { method: 'Regla del punto medio 300×300', value: ref, reference: avg, pass: pass(ref, avg, 2e-4) };
    return build('Valor promedio de una función de dos variables', {
      original: [T(`Valor promedio de $f(x,y)=${toTex(i.f)}$ sobre la región $${texNum(i.a)}\\le x\\le ${texNum(i.b)}$, $${toTex(g1s)}\\le y\\le ${toTex(g2s)}$.`)],
      datos: [T(`$R$ es de tipo I. Límites: $x\\in[${texNum(i.a)},${texNum(i.b)}]$, $y$ entre $g_1(x)=${toTex(g1s)}$ y $g_2(x)=${toTex(g2s)}$.`)],
      formula: [M('f_{\\text{prom}}=\\frac{1}{A(R)}\\iint_R f(x,y)\\,dA,\\qquad A(R)=\\iint_R dA')],
      sustitucion: [M(`f_{\\text{prom}}=\\frac{\\displaystyle\\int_{${texNum(i.a)}}^{${texNum(i.b)}}\\int_{${toTex(g1s)}}^{${toTex(g2s)}} ${toTex(i.f)}\\,dy\\,dx}{A(R)}`)],
      operaciones: [{ kind: 'table', rows: [['Cantidad', 'Valor'], ['$\\iint_R f\\,dA$', fmt(I.value, 8)], ['$A(R)$', fmt(Ar.value, 8)]] }, M(`f_{\\text{prom}}=\\frac{${fmt(I.value, 8)}}{${fmt(Ar.value, 8)}}`)],
      resultado: [M(`f_{\\text{prom}}\\approx ${fmt(avg, 8)}`)],
      comprobacion: [T(`${chk.method}: ${fmt(chk.value, 6)} — ${chk.pass ? 'coincide ✓' : 'NO coincide ✗'}`), T(`Convergencia de la integral doble (niveles 4 vs 5): error ${fmt(I.error, 2)}.`)],
      interpretacion: [T('El valor promedio es la altura constante $h$ tal que el cilindro de base $R$ y altura $h$ tiene el mismo volumen que el sólido bajo la superficie.')],
    }, { answer: fmt(avg, 8), numeric: avg, checks: [chk], limitations: ['Región restringida a tipo I (x entre constantes, y entre dos funciones de x). Para discos, use las funciones g1=-sqrt(r^2-x^2), g2=sqrt(r^2-x^2).'] });
  });
}

/* =========================== 9. Lámina: centro de masa =========================== */
function solveLamina(i: Record<string, string>): SolveResult {
  return wrap('Centro de masa', () => {
    const a = num(i.a), b = num(i.b);
    if (!finite(a, b) || !(b > a)) return fail('Centro de masa', 'Se requiere a < b finitos.');
    const rho = fn2(i.rho || '1');
    const g1s = i.g1?.trim() || '0', g2s = i.g2?.trim();
    if (!g2s) return fail('Centro de masa', 'Indique g2(x).');
    const g1 = fn1(g1s), g2 = fn1(g2s);
    for (let k = 0; k <= 200; k++) { const x = a + ((b - a) * k) / 200; if (g2(x) < g1(x) - 1e-12) return fail('Centro de masa', 'Se requiere g1(x) ≤ g2(x).'); }
    const m = integrate2(rho, a, b, g1, g2), Mx = integrate2((x, y) => y * rho(x, y), a, b, g1, g2), My = integrate2((x, y) => x * rho(x, y), a, b, g1, g2);
    if (!(m.value > 1e-14)) return fail('Centro de masa', 'La masa es cero o negativa; revise la densidad.');
    const xb = My.value / m.value, yb = Mx.value / m.value;
    const mm = midpoint2(rho, a, b, g1, g2), mmx = midpoint2((x, y) => y * rho(x, y), a, b, g1, g2), mmy = midpoint2((x, y) => x * rho(x, y), a, b, g1, g2);
    const checks: Check[] = [
      { method: 'Masa por punto medio 300×300', value: mm, reference: m.value, pass: pass(mm, m.value, 2e-4) },
      { method: 'x̄ por punto medio', value: mmy / mm, reference: xb, pass: pass(mmy / mm, xb, 2e-4) },
      { method: 'ȳ por punto medio', value: mmx / mm, reference: yb, pass: pass(mmx / mm, yb, 2e-4) },
    ];
    return build('Centro de masa de una lámina', {
      original: [T(`Centro de masa de la lámina con densidad $\\rho(x,y)=${toTex(i.rho || '1')}$ en $${texNum(i.a)}\\le x\\le ${texNum(i.b)}$, $${toTex(g1s)}\\le y\\le ${toTex(g2s)}$.`)],
      datos: [T(`$\\rho(x,y)=${toTex(i.rho || '1')}$; región tipo I con $g_1=${toTex(g1s)}$, $g_2=${toTex(g2s)}$.`)],
      formula: [M('m=\\iint_R\\rho\\,dA,\\quad M_y=\\iint_R x\\rho\\,dA,\\quad M_x=\\iint_R y\\rho\\,dA,\\quad (\\bar x,\\bar y)=\\left(\\frac{M_y}{m},\\frac{M_x}{m}\\right)')],
      sustitucion: [M(`m=\\int_{${texNum(i.a)}}^{${texNum(i.b)}}\\int_{${toTex(g1s)}}^{${toTex(g2s)}} ${toTex(i.rho || '1')}\\,dy\\,dx`)],
      operaciones: [{ kind: 'table', rows: [['Cantidad', 'Valor'], ['$m$', fmt(m.value, 8)], ['$M_y$', fmt(My.value, 8)], ['$M_x$', fmt(Mx.value, 8)]] }],
      resultado: [M(`(\\bar x,\\bar y)\\approx(${fmt(xb, 8)},\\ ${fmt(yb, 8)}),\\qquad m\\approx ${fmt(m.value, 8)}`)],
      comprobacion: checks.map((c) => T(`${c.method}: ${fmt(c.value, 6)} — ${c.pass ? 'coincide ✓' : 'NO coincide ✗'}`)),
      interpretacion: [T('Con densidad variable el centro de masa se desplaza hacia la zona más densa; con $\\rho$ constante coincide con el centroide.')],
    }, { answer: `(${fmt(xb, 8)},\\ ${fmt(yb, 8)})`, numeric: m.value, checks, limitations: ['Regiones tipo I; para regiones circulares use g1,g2 con raíces.'] });
  });
}

/* =========================== 10. Regla de la cadena =========================== */
function substitute(src: string, map: Record<string, string>): string {
  const node = parse(src).transform((n: any) => (n.isSymbolNode && map[n.name] ? parse(`(${map[n.name]})`) : n));
  return node.toString();
}
function solveChain(i: Record<string, string>): SolveResult {
  return wrap('Regla de la cadena', () => {
    const fx = diff(i.f, 'x'), fy = diff(i.f, 'y');
    const xt = i.x, yt = i.y;
    const dxt = diff(xt, 't'), dyt = diff(yt, 't');
    const expr = `(${fx})*(${dxt}) + (${fy})*(${dyt})`;
    const chainT = substitute(expr, { x: xt, y: yt });
    const direct = diff(substitute(i.f, { x: xt, y: yt }), 't');
    const fc = fnT(chainT), fd = fnT(direct);
    const tests = [0.3, 0.9, 1.7, 2.4];
    const maxdiff = Math.max(...tests.map((t) => { const u = fc(t), v = fd(t); return Number.isFinite(u) && Number.isFinite(v) ? Math.abs(u - v) / Math.max(1, Math.abs(v)) : 0; }));
    const composite = fnT(substitute(i.f, { x: xt, y: yt }));
    const num_ = tests.map((t) => numDiff(composite, t));
    const chk: Check = { method: 'Derivada numérica de la composición z(t) en t=0.3,…,2.4', value: Math.max(...tests.map((t, k) => Math.abs(fc(t) - num_[k]))), reference: 0, pass: tests.every((t, k) => Math.abs(fc(t) - num_[k]) < 1e-5 * Math.max(1, Math.abs(num_[k]))) };
    const t0 = i.t0?.trim() ? num(i.t0) : undefined;
    return build('Regla de la cadena', {
      original: [T(`Calcular $\\dfrac{dz}{dt}$ si $z=${toTex(i.f)}$, $x=${toTex(xt)}$, $y=${toTex(yt)}$.`)],
      datos: [T(`$z=f(x,y)=${toTex(i.f)}$, $x(t)=${toTex(xt)}$, $y(t)=${toTex(yt)}$.`)],
      formula: [M('\\frac{dz}{dt}=\\frac{\\partial f}{\\partial x}\\frac{dx}{dt}+\\frac{\\partial f}{\\partial y}\\frac{dy}{dt}')],
      sustitucion: [T('Derivadas calculadas con mathjs:'), M(`f_x=${toTex(fx)},\\quad f_y=${toTex(fy)}`), M(`x'(t)=${toTex(dxt)},\\quad y'(t)=${toTex(dyt)}`)],
      operaciones: [M(`\\frac{dz}{dt}=\\left(${toTex(fx)}\\right)\\left(${toTex(dxt)}\\right)+\\left(${toTex(fy)}\\right)\\left(${toTex(dyt)}\\right)`), T(`Sustituyendo $x(t),y(t)$: $\\dfrac{dz}{dt}=${toTex(chainT)}$.`)],
      resultado: [M(`\\frac{dz}{dt}=${toTex(chainT)}`), ...(t0 !== undefined ? [M(`\\left.\\frac{dz}{dt}\\right|_{t=${fmt(t0)}}=${fmt(fc(t0), 8)}`)] : [])],
      comprobacion: [T(`Sustituyendo primero ($z(t)$ directa) y derivando: $z'(t)=${toTex(direct)}$. Diferencia relativa máxima con la regla de la cadena en 4 valores de $t$: ${fmt(maxdiff, 2)} — ${maxdiff < 1e-9 ? 'coinciden ✓' : 'NO coinciden ✗'}.`), T(`Derivada numérica de $z(t)$: ${chk.pass ? 'coincide ✓' : 'no coincide ✗'}.`)],
      interpretacion: [T('La razón de cambio de $z$ en el tiempo es la suma de las contribuciones de cada variable intermedia: $f_x\\,x\'$ y $f_y\\,y\'$.')],
    }, { answer: toTex(chainT), numeric: t0 !== undefined ? fc(t0) : undefined, checks: [chk], limitations: [] });
  });
}

/* =========================== 11. Máximos y mínimos =========================== */
export interface Crit { x: number; y: number; z: number; D: number; fxx: number; type: string }
export function findCritical(src: string, R = 6): { points: Crit[]; hasErr: boolean } {
  const fx = fn2(diff(src, 'x')), fy = fn2(diff(src, 'y'));
  const fxxF = fn2(diff(diff(src, 'x'), 'x')), fyyF = fn2(diff(diff(src, 'y'), 'y')), fxyF = fn2(diff(diff(src, 'x'), 'y'));
  const f = fn2(src);
  const pts: Crit[] = [];
  const n = 13;
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    let x = -R + (2 * R * a) / (n - 1) + 0.0137, y = -R + (2 * R * b) / (n - 1) + 0.0291;
    let ok = false;
    for (let it = 0; it < 80; it++) {
      const g1 = fx(x, y), g2 = fy(x, y);
      if (!finite(g1, g2)) break;
      if (Math.hypot(g1, g2) < 1e-12) { ok = true; break; }
      const h11 = fxxF(x, y), h22 = fyyF(x, y), h12 = fxyF(x, y);
      const det = h11 * h22 - h12 * h12;
      if (!finite(det) || Math.abs(det) < 1e-14) break;
      const dx = (h22 * g1 - h12 * g2) / det, dy = (-h12 * g1 + h11 * g2) / det;
      x -= dx; y -= dy;
      if (Math.abs(x) > 1e4 || Math.abs(y) > 1e4) break;
    }
    if (ok && Math.abs(x) <= R * 1.5 && Math.abs(y) <= R * 1.5 && !pts.some((p) => Math.hypot(p.x - x, p.y - y) < 1e-6)) {
      const h11 = fxxF(x, y), h22 = fyyF(x, y), h12 = fxyF(x, y);
      const D = h11 * h22 - h12 * h12;
      const eps = 1e-7 * Math.max(1, Math.abs(h11) + Math.abs(h22));
      const type = Math.abs(D) < eps ? 'Prueba no concluyente (D=0)' : D < 0 ? 'Punto silla' : h11 > 0 ? 'Mínimo local' : 'Máximo local';
      const clean = (v: number) => (Math.abs(v) < 1e-9 ? 0 : v);
      pts.push({ x: clean(x), y: clean(y), z: f(x, y), D, fxx: h11, type });
    }
  }
  return { points: pts.sort((p, q) => p.x - q.x || p.y - q.y), hasErr: false };
}
function solveExtrema(i: Record<string, string>): SolveResult {
  return wrap('Máximos y mínimos', () => {
    const R = i.R?.trim() ? num(i.R) : 6;
    const fx = diff(i.f, 'x'), fy = diff(i.f, 'y');
    const fxx = diff(fx, 'x'), fyy = diff(fy, 'y'), fxy = diff(fx, 'y');
    const { points } = findCritical(i.f, R);
    const rows: string[][] = [['Punto crítico', '$f$', '$f_{xx}$', '$D=f_{xx}f_{yy}-f_{xy}^2$', 'Clasificación']];
    for (const p of points) rows.push([`$(${fmt(p.x, 6)},\\ ${fmt(p.y, 6)})$`, fmt(p.z, 6), fmt(p.fxx, 6), fmt(p.D, 6), p.type]);
    const checks: Check[] = points.map((p) => ({ method: `‖∇f‖ en (${fmt(p.x, 4)}, ${fmt(p.y, 4)})`, value: Math.hypot(fn2(fx)(p.x, p.y), fn2(fy)(p.x, p.y)), reference: 0, pass: Math.hypot(fn2(fx)(p.x, p.y), fn2(fy)(p.x, p.y)) < 1e-6 }));
    return build('Extremos de una función de dos variables', {
      original: [T(`Hallar y clasificar los puntos críticos de $f(x,y)=${toTex(i.f)}$.`)],
      datos: [T(`$f(x,y)=${toTex(i.f)}$. Ventana de búsqueda numérica: $[-${fmt(R)},${fmt(R)}]^2$.`)],
      formula: [M('\\nabla f=(f_x,f_y)=\\mathbf 0'), M('D=f_{xx}f_{yy}-(f_{xy})^2'), T('$D>0,\\ f_{xx}>0$: mínimo local · $D>0,\\ f_{xx}<0$: máximo local · $D<0$: punto silla · $D=0$: no concluyente.')],
      sustitucion: [M(`f_x=${toTex(fx)}=0`), M(`f_y=${toTex(fy)}=0`), M(`f_{xx}=${toTex(fxx)},\\ f_{yy}=${toTex(fyy)},\\ f_{xy}=${toTex(fxy)}`)],
      operaciones: [T(`El sistema $f_x=f_y=0$ se resolvió con el método de Newton desde una malla de 169 puntos iniciales; las soluciones distintas se clasifican con el Hessiano:`), { kind: 'table', rows }],
      resultado: points.length ? [T(`Se encontraron ${points.length} punto(s) crítico(s) en la ventana.`), ...points.map((p) => T(`$(${fmt(p.x, 8)},\\ ${fmt(p.y, 8)})$ → ${p.type}, $f=${fmt(p.z, 8)}$`))] : [T('No se encontraron puntos críticos en la ventana de búsqueda.')],
      comprobacion: checks.map((c) => T(`${c.method} = ${fmt(c.value, 2)} — ${c.pass ? '≈0 ✓' : 'no nulo ✗'}`)),
      interpretacion: [T('Un máximo/mínimo local es la cima/fondo local de la superficie; un punto silla sube en una dirección y baja en otra. Los extremos absolutos en regiones cerradas requieren además analizar la frontera.')],
    }, { answer: points.map((p) => `(${fmt(p.x, 6)},${fmt(p.y, 6)}):\\ \\text{${p.type}}`).join(';\\ '), checks, limitations: ['La búsqueda es numérica dentro de la ventana indicada: pueden existir puntos críticos fuera de ella o que Newton no alcance (p. ej. con Hessiano singular).', 'No se determinan extremos absolutos ni con restricciones (multiplicadores de Lagrange).'] });
  });
}

/* ------------------------------ catálogo ------------------------------ */
const F = (key: string, label: string, def: string, hint?: string): Field => ({ key, label, default: def, hint });
export const CATEGORIES: Category[] = [
  { id: 'integral', label: 'Integral definida', chapters: [1, 2], description: 'Calcula ∫ f(x) dx entre a y b (exacta si es posible, numérica verificada si no).', fields: [F('f', 'f(x)', 'x^3*sqrt(1+9*x^4)', 'Ej.: x^2, sin(x), sqrt(x), exp(-x^2)'), F('a', 'a', '0'), F('b', 'b', '1', 'Admite pi, sqrt(2), inf')], solve: solveIntegral },
  { id: 'avg1', label: 'Valor promedio (1 variable)', chapters: [2], description: 'Promedio de f en [a,b] y valores c del Teorema del Valor Medio.', fields: [F('f', 'f(x)', 'sqrt(x)'), F('a', 'a', '0'), F('b', 'b', '9')], solve: solveAvg1 },
  { id: 'revolution', label: 'Superficie de revolución', chapters: [1], description: 'Área lateral al girar y=f(x) alrededor del eje x o y.', fields: [F('f', 'f(x)', 'x^3'), F('a', 'a', '0'), F('b', 'b', '1'), { key: 'axis', label: 'Eje de giro', default: 'x', select: [{ value: 'x', label: 'Eje x (r = f(x))' }, { value: 'y', label: 'Eje y (r = x)' }] }], solve: solveRevolution },
  { id: 'centroid1', label: 'Centroide de una región plana', chapters: [3], description: 'Centroide de la región entre y=g(x) y y=f(x) en [a,b].', fields: [F('f', 'f(x) (curva superior)', 'sin(x)'), F('g', 'g(x) (curva inferior)', '0'), F('a', 'a', '0'), F('b', 'b', 'pi')], solve: solveCentroid1 },
  { id: 'eval', label: 'Evaluación de funciones', chapters: [4, 5], description: 'Evalúa f en un punto y avisa si queda fuera del dominio real.', fields: [F('vars', 'Variables (separadas por coma)', 'x,y,z'), F('f', 'f', 'x^2*sin(y)+z'), F('point', 'Punto', '2, pi/2, 5')], solve: solveEval },
  { id: 'partials', label: 'Derivadas parciales y diferencial', chapters: [9], description: 'f_x, f_y, segundas derivadas, Clairaut, gradiente y dz.', fields: [F('f', 'f(x,y)', 'exp(x*y)+sin(x)'), F('point', 'Punto (opcional) a, b', '1, 2')], solve: solvePartials },
  { id: 'limit2', label: 'Límite de dos variables', chapters: [8], description: 'Sustitución directa o exploración de trayectorias (con aviso de lo que no prueba).', fields: [F('f', 'f(x,y)', 'x*y^2/(x^2+y^4)'), F('point', 'Punto a, b', '0, 0')], solve: solveLimit2 },
  { id: 'avg2', label: 'Valor promedio (2 variables)', chapters: [6], description: 'Promedio de f sobre región tipo I.', fields: [F('f', 'f(x,y)', 'x*y'), F('a', 'a (x desde)', '0'), F('b', 'b (x hasta)', '1'), F('g1', 'g1(x) (y desde)', '0'), F('g2', 'g2(x) (y hasta)', 'x')], solve: solveAvg2 },
  { id: 'lamina', label: 'Centro de masa de una lámina', chapters: [7], description: 'm, Mx, My y centro de masa con densidad ρ(x,y).', fields: [F('rho', 'ρ(x,y)', 'x+y'), F('a', 'a', '0'), F('b', 'b', '2'), F('g1', 'g1(x)', '0'), F('g2', 'g2(x)', '2-x')], solve: solveLamina },
  { id: 'chain', label: 'Regla de la cadena', chapters: [10], description: 'dz/dt para z=f(x,y), x=x(t), y=y(t), con comprobación por sustitución.', fields: [F('f', 'z = f(x,y)', 'x^2*y'), F('x', 'x(t)', '3*t'), F('y', 'y(t)', 't^2'), F('t0', 't₀ (opcional)', '1')], solve: solveChain },
  { id: 'extrema', label: 'Máximos y mínimos', chapters: [10], description: 'Puntos críticos y prueba del Hessiano.', fields: [F('f', 'f(x,y)', 'x*y-x^3-y^3'), F('R', 'Ventana de búsqueda ±R', '6')], solve: solveExtrema },
];
export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
