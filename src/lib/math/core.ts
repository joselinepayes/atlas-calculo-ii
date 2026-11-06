import { create, all, type MathNode } from 'mathjs';

const math = create(all, {});
math.import({ ln: Math.log, sen: Math.sin, tg: Math.tan }, { override: true });

const KNOWN = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh', 'asin', 'acos', 'atan', 'exp', 'log', 'ln', 'sqrt', 'abs',
  'sen', 'tg', 'pi', 'e', 'cbrt', 'sign', 'floor', 'ceil', 'min', 'max', 'atan2', 'pow', 'i', 'Infinity', 'NaN', 'log10', 'log2',
]);

/** Normaliza notación escolar: π, √, xy → x*y, ^ y 2x. */
export function normalize(src: string, vars: string[] = ['x', 'y', 'z', 't']): string {
  let s = src.trim().replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/[−–]/g, '-').replace(/·|⋅/g, '*').replace(/×/g, '*').replace(/\^\s*\(/g, '^(');
  s = s.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (tok) => {
    if (KNOWN.has(tok) || tok.length < 2) return tok;
    if ([...tok].every((c) => vars.includes(c))) return [...tok].join('*');
    return tok;
  });
  return s;
}

export function parse(src: string, vars?: string[]): MathNode {
  return math.parse(normalize(src, vars));
}

export type Fn1 = (x: number) => number;
export type Fn2 = (x: number, y: number) => number;

function compileNode(node: MathNode, names: string[], extra: Record<string, number> = {}) {
  const code = node.compile();
  return (...args: number[]) => {
    const scope: Record<string, number> = { ...extra };
    names.forEach((n, i) => (scope[n] = args[i]));
    const v = code.evaluate(scope);
    return typeof v === 'number' ? v : Number(v);
  };
}

export function fn1(src: string, extra?: Record<string, number>): Fn1 {
  const f = compileNode(parse(src), ['x'], extra);
  return (x) => f(x);
}
export function fn2(src: string, extra?: Record<string, number>): Fn2 {
  const f = compileNode(parse(src), ['x', 'y'], extra);
  return (x, y) => f(x, y);
}
export function fnT(src: string, extra?: Record<string, number>): Fn1 {
  const f = compileNode(parse(src, ['t']), ['t'], extra);
  return (t) => f(t);
}

/** Derivada simbólica (mathjs). Devuelve la expresión como texto mathjs. */
export function diff(src: string, v: string): string {
  const d = math.derivative(parse(src), v, { simplify: true });
  return d.toString({ parenthesis: 'auto', implicit: 'show' });
}
export function toTex(src: string): string {
  try {
    return parse(src).toTex({ parenthesis: 'keep', implicit: 'hide' }).replace(/\\mathrm\{pi\}/g, '\\pi').replace(/\\cdot\s*\\left\(/g, '\\left(');
  } catch {
    return src;
  }
}

export function fmt(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < 1e-12) return '0';
  const s = Number(n.toPrecision(digits));
  if (Math.abs(s) >= 1e6 || Math.abs(s) < 1e-4) return s.toExponential(digits - 2).replace(/\.?0+e/, 'e');
  return String(s);
}

/* ------------------------- Cuadratura tanh-sinh ------------------------- */
export interface Quad { value: number; error: number; converged: boolean }

function tanhSinhRaw(f: Fn1, a: number, b: number, levels: number): number {
  const c = (a + b) / 2;
  const d = (b - a) / 2;
  const h = 1 / 2 ** levels;
  let sum = 0;
  for (let k = -Math.ceil(3.4 / h); k <= Math.ceil(3.4 / h); k++) {
    const t = k * h;
    const u = (Math.PI / 2) * Math.sinh(t);
    const x = Math.tanh(u);
    const w = ((Math.PI / 2) * Math.cosh(t)) / Math.cosh(u) ** 2;
    if (w === 0 || !Number.isFinite(w)) continue;
    // cerca de los extremos, calcular la distancia al borde con precisión
    const dist = 1 / (Math.exp(2 * Math.abs(u)) + 1) * 2; // 1-|x| ≈ 2/(e^{2|u|}+1)
    const xx = x >= 0 ? b - d * dist : a + d * dist;
    const px = Math.abs(x) > 0.5 ? xx : c + d * x;
    if (px <= a && x < 0 && px < a) continue;
    if (px >= b && x > 0 && px > b) continue;
    const v = f(px);
    if (!Number.isFinite(v)) continue;
    sum += w * v;
  }
  return sum * d * h;
}

export function integrate(f: Fn1, a: number, b: number): Quad {
  if (a === b) return { value: 0, error: 0, converged: true };
  if (a > b) {
    const q = integrate(f, b, a);
    return { ...q, value: -q.value };
  }
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    if (Number.isFinite(a)) {
      // [a,∞): x = a + t/(1-t)
      const g: Fn1 = (t) => f(a + t / (1 - t)) / (1 - t) ** 2;
      return integrate(g, 0, 1);
    }
    if (Number.isFinite(b)) {
      const g: Fn1 = (t) => f(b - t / (1 - t)) / (1 - t) ** 2;
      return integrate(g, 0, 1);
    }
    const l = integrate(f, -Infinity, 0);
    const r = integrate(f, 0, Infinity);
    return { value: l.value + r.value, error: l.error + r.error, converged: l.converged && r.converged };
  }
  let prev = tanhSinhRaw(f, a, b, 2);
  let cur = prev;
  let err = Infinity;
  for (let lv = 3; lv <= 7; lv++) {
    cur = tanhSinhRaw(f, a, b, lv);
    err = Math.abs(cur - prev);
    if (err < 1e-11 * Math.max(1, Math.abs(cur))) return { value: cur, error: err, converged: true };
    prev = cur;
  }
  return { value: cur, error: err, converged: err < 1e-7 * Math.max(1, Math.abs(cur)) };
}

/** Integral doble sobre a≤x≤b, g1(x)≤y≤g2(x). */
export function integrate2(f: Fn2, a: number, b: number, g1: Fn1 = () => 0, g2: Fn1 = () => 1, level = 4): Quad {
  const outer: Fn1 = (x) => tanhSinhRaw((y) => f(x, y), g1(x), g2(x), level);
  const outerHi: Fn1 = (x) => tanhSinhRaw((y) => f(x, y), g1(x), g2(x), level + 1);
  const v1 = tanhSinhRaw(outer, a, b, level);
  const v2 = tanhSinhRaw(outerHi, a, b, level + 1);
  const err = Math.abs(v1 - v2);
  return { value: v2, error: err, converged: err < 1e-6 * Math.max(1, Math.abs(v2)) };
}

/* ------------------------- Derivadas numéricas ------------------------- */
export function numDiff(f: Fn1, x: number, h = 1e-5): number {
  return (-f(x + 2 * h) + 8 * f(x + h) - 8 * f(x - h) + f(x - 2 * h)) / (12 * h);
}

/** Raíz por bisección en [a,b] si hay cambio de signo. */
export function bisect(f: Fn1, a: number, b: number, tol = 1e-12): number | null {
  let fa = f(a), fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) return null;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (fm === 0 || Math.abs(b - a) < tol) return m;
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

/** Todas las raíces de f en [a,b] por barrido + bisección. */
export function roots(f: Fn1, a: number, b: number, n = 2000): number[] {
  const out: number[] = [];
  let px = a, pf = f(a);
  for (let i = 1; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    const fx = f(x);
    if (Number.isFinite(pf) && Number.isFinite(fx)) {
      if (pf === 0) out.push(px);
      else if (pf * fx < 0) {
        const r = bisect(f, px, x);
        if (r !== null) out.push(r);
      }
    }
    px = x; pf = fx;
  }
  if (f(b) === 0) out.push(b);
  return out.filter((r, i) => i === 0 || Math.abs(r - out[i - 1]) > 1e-8);
}

export { math };
