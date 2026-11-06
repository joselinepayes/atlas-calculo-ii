import { describe, it, expect } from 'vitest';
import katex from 'katex';
import atlas from '../../../data/atlas.json';
import { SOLUTIONS } from '../../../data/solutions';
import { getCategory } from '../solver';

const exercises = (atlas as any).chapters.flatMap((c: any) => c.exercises);

describe('banco de ejercicios', () => {
  it('importa los 60 ejercicios PISA (10 capítulos × 6 niveles)', () => {
    expect(exercises.length).toBe(60);
    for (let c = 1; c <= 10; c++) expect(exercises.filter((e: any) => e.chapter === c).map((e: any) => e.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('cada ejercicio tiene solución, 3 pistas y respuesta', () => {
    for (const e of exercises) {
      const s = SOLUTIONS[e.id];
      expect(s, `falta solución ${e.id}`).toBeTruthy();
      expect(s.hints.length).toBe(3);
      expect(s.answer.length).toBeGreaterThan(5);
    }
  });
  it('las respuestas con Resolutor coinciden con el motor matemático', () => {
    for (const [id, s] of Object.entries(SOLUTIONS)) {
      if (!s.solver) continue;
      const r = getCategory(s.solver.cat)!.solve(s.solver.inputs);
      expect(r.ok, `Resolutor falló en ${id}: ${r.error}`).toBe(true);
      if (!Number.isNaN(s.solver.expect)) expect(Math.abs((r.numeric as number) - s.solver.expect), `ejercicio ${id}`).toBeLessThan(1e-5 * Math.max(1, Math.abs(s.solver.expect)));
    }
  }, 120000);
  it('los valores numéricos de comprobación automática son consistentes con el Resolutor', () => {
    for (const id of ['1.3', '1.4', '1.6', '2.1', '2.2', '2.4', '3.3', '3.4', '6.2', '6.3', '6.4', '7.3', '7.4', '8.1', '8.3', '10.1']) {
      const s = SOLUTIONS[id];
      expect(s.check.kind).toBe('numbers');
      if (s.check.kind === 'numbers' && s.solver && !Number.isNaN(s.solver.expect)) {
        const target = s.check.values[0];
        const ok = Math.abs(target - s.solver.expect) < 1e-3 * Math.max(1, Math.abs(target)) || s.check.unordered;
        expect(ok, id).toBe(true);
      }
    }
  });
});

describe('fórmulas LaTeX', () => {
  const collect = (s: string) => [...s.matchAll(/\$((?:\\.|[^$\\])+)\$/g)].map((m) => m[1]);
  const all: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') all.push(...collect(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(atlas);
  walk(SOLUTIONS);
  it('todas las fórmulas del folleto y las soluciones se renderizan en KaTeX sin error', () => {
    const bad: string[] = [];
    for (const t of new Set(all)) {
      try { katex.renderToString(t, { throwOnError: true, strict: 'ignore' }); } catch (e) { bad.push(t + ' → ' + (e as Error).message); }
    }
    expect(bad, bad.slice(0, 10).join('\n')).toEqual([]);
    expect(all.length).toBeGreaterThan(1000);
  });
});
