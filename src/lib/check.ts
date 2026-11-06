import type { Check } from '../data/solutions';
import { num } from './math/solver';

export interface Verdict { ok: boolean | null; message: string }

/** Compara una respuesta numérica del estudiante con la esperada. Admite expresiones (pi/2, sqrt(3)/3, 2/3). */
export function checkNumbers(check: Check, input: string): Verdict {
  if (check.kind !== 'numbers') return { ok: null, message: 'Esta respuesta es abierta: compárala con la solución y autoevalúate.' };
  const parts = input.split(/[;,](?![^()]*\))/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { ok: null, message: 'Escribe tu respuesta.' };
  if (parts.length !== check.values.length) return { ok: false, message: `Se esperaban ${check.values.length} valor(es) separados por comas; escribiste ${parts.length}.` };
  let got: number[];
  try { got = parts.map((p) => num(p)); } catch (e) { return { ok: null, message: 'No pude interpretar tu respuesta: ' + (e instanceof Error ? e.message : String(e)) + '. Usa números o expresiones como pi/2, sqrt(3), 2/3.' }; }
  const tol = Math.max(check.tol ?? 5e-3, 1e-6);
  const want = check.values.slice();
  const g = check.unordered ? got.slice().sort((a, b) => a - b) : got;
  const w = check.unordered ? want.slice().sort((a, b) => a - b) : want;
  const bad = g.map((v, i) => Math.abs(v - w[i]) <= tol * Math.max(1, Math.abs(w[i]))).map((ok, i) => (ok ? -1 : i)).filter((i) => i >= 0);
  if (!bad.length) return { ok: true, message: '¡Correcto! Tu respuesta coincide con la solución verificada.' };
  return { ok: false, message: bad.length === g.length ? 'No coincide con la solución. Revisa el planteamiento; puedes pedir una pista.' : `Coinciden algunos valores, pero revisa: ${bad.map((i) => `el valor ${i + 1}`).join(', ')}.` };
}
