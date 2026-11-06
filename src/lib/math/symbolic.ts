import Algebrite from 'algebrite';
import { normalize } from './core';

/** Adapta una expresión (sintaxis mathjs) a Algebrite. */
export function toAlgebrite(src: string): string {
  return normalize(src)
    .replace(/\bln\(/g, 'log(')
    .replace(/\bsen\(/g, 'sin(')
    .replace(/\be\b(?!\()/g, 'exp(1)')
    .replace(/\binf\b|Infinity/g, 'oo');
}

function run(code: string): string | null {
  try {
    const out = String(Algebrite.run(code)).trim();
    if (!out || /^Stop:|^Error|could not|integral\(|defint\(|oo|nil|NaN|Cannot/i.test(out)) return null;
    return out;
  } catch {
    return null;
  }
}

export interface Exact { text: string; tex: string; value: number }

/** Integral definida exacta (si Algebrite la encuentra). Nunca inventa: devuelve null si falla. */
export function exactDefint(expr: string, a: string, b: string, v = 'x'): Exact | null {
  if (expr.length > 160) return null;
  const e = toAlgebrite(expr), A = toAlgebrite(a), B = toAlgebrite(b);
  const text = run(`defint(${e},${v},${A},${B})`);
  if (!text) return null;
  const val = Number(run(`float(defint(${e},${v},${A},${B}))`));
  if (!Number.isFinite(val)) return null;
  const tex = run(`printlatex(defint(${e},${v},${A},${B}))`) ?? text;
  return { text, tex: tidyTex(tex), value: val };
}

export function exactAntiderivative(expr: string, v = 'x'): { text: string; tex: string } | null {
  if (expr.length > 160) return null;
  const e = toAlgebrite(expr);
  const text = run(`integral(${e},${v})`);
  if (!text) return null;
  const tex = run(`printlatex(integral(${e},${v}))`) ?? text;
  return { text, tex: tidyTex(tex) };
}

function tidyTex(s: string): string {
  return s.replace(/^\$+|\$+$/g, '').replace(/([0-9a-z)])\s*(sin|cos|tan|exp|log)\b/g, '$1\\,$2');
}
