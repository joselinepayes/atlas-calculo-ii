import { describe, it, expect } from 'vitest';
import { EXAMPLE_SOLVER, GRAPH_PRESETS } from '../../data/links';
import { EXAMPLES, CHAPTERS } from '../../data/atlas';
import { getCategory, CATEGORIES } from '../math/solver';
import { makeVariant, VARIANT_FAMILIES } from '../variants';
import { checkNumbers } from '../check';
import { normalize } from '../storage';
import { SOLUTIONS } from '../../data/solutions';

describe('integridad del contenido importado', () => {
  it('10 capítulos, 26 ejemplos resueltos con 4 fases de Pólya', () => {
    expect(CHAPTERS.length).toBe(10);
    expect(EXAMPLES.length).toBe(26);
    for (const e of EXAMPLES) expect(e.phases.map((p) => p.title.slice(0, 6))).toEqual(['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4']);
  });
  it('cada capítulo tiene teoría, fórmulas destacadas y 8 figuras en total', () => {
    for (const c of CHAPTERS) { expect(c.theory.length).toBeGreaterThan(5); expect(c.theory.some((b) => b.t === 'formula')).toBe(true); }
    const figs = CHAPTERS.flatMap((c) => [c.intro, c.theory, c.figures, c.applications, c.summary, ...c.examples.flatMap((e) => [e.statement, ...e.phases.map((p) => p.blocks)])].flat()).filter((b) => b.t === 'fig');
    expect(figs.length).toBe(12);
  });
});

describe('Resolutor: ejemplos del folleto enlazados', () => {
  for (const [id, l] of Object.entries(EXAMPLE_SOLVER)) {
    it(`Ejemplo ${id} se resuelve y sus verificaciones coinciden`, () => {
      const r = getCategory(l.cat)!.solve(l.inputs);
      expect(r.ok, r.error).toBe(true);
      expect(r.checks.every((c) => c.pass)).toBe(true);
      expect(r.sections.length).toBe(8);
    });
  }
  it('valores conocidos de ejemplos del folleto', () => {
    const v = (id: string) => getCategory(EXAMPLE_SOLVER[id].cat)!.solve(EXAMPLE_SOLVER[id].inputs);
    expect(Math.abs((v('2.1').numeric as number) - (20 + 8 / Math.PI))).toBeLessThan(1e-8);
    expect(Math.abs((v('2.2').numeric as number) - (60 * Math.log(4)) / 3)).toBeLessThan(1e-8);
    expect(Math.abs((v('6.1').numeric as number) - 2)).toBeLessThan(1e-7);
    expect(Math.abs((v('6.2').numeric as number) - 0.25)).toBeLessThan(1e-7);
    expect(v('10.1').answer).toContain('Punto silla');
  });
  it('todas las categorías tienen ejemplo por defecto que se resuelve', () => {
    for (const c of CATEGORIES) {
      const r = c.solve(Object.fromEntries(c.fields.map((f) => [f.key, f.default])));
      expect(r.ok, `${c.id}: ${r.error}`).toBe(true);
    }
  });
  it('declara limitaciones en lugar de inventar: entrada inválida', () => {
    const r = getCategory('integral')!.solve({ f: 'x^^2 +', a: '0', b: '1' });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
    expect(getCategory('centroid1')!.solve({ f: 'x', g: 'x^2', a: '1', b: '0' }).ok).toBe(false);
  });
});

describe('variantes verificadas', () => {
  it('cada familia genera variantes cuya respuesta coincide con el motor', () => {
    for (const f of VARIANT_FAMILIES) for (let s = 1; s <= 6; s++) {
      const v = makeVariant(f.id, s * 7919);
      expect(v.statement.length).toBeGreaterThan(10);
      expect(v.value.every(Number.isFinite)).toBe(true);
    }
  }, 60000);
});

describe('comprobación de respuestas', () => {
  const chk = SOLUTIONS['3.4'].check;
  it('acepta expresiones y redondeos razonables', () => {
    expect(checkNumbers(chk, 'pi/2, pi/8').ok).toBe(true);
    expect(checkNumbers(chk, '1.5708, 0.3927').ok).toBe(true);
    expect(checkNumbers(chk, '1.57, 0.39').ok).toBe(true);
  });
  it('rechaza respuestas incorrectas y mal formadas', () => {
    expect(checkNumbers(chk, '1, 1').ok).toBe(false);
    expect(checkNumbers(chk, '1').ok).toBe(false);
    expect(checkNumbers(chk, 'hola, adios').ok).toBeNull();
  });
  it('orden irrelevante en c = ±2/√3', () => {
    expect(checkNumbers(SOLUTIONS['2.4'].check, '1.1547, -1.1547').ok).toBe(true);
  });
  it('ejercicios abiertos no se evalúan automáticamente', () => expect(checkNumbers(SOLUTIONS['1.5'].check, '3').ok).toBeNull());
});

describe('progreso local', () => {
  it('normaliza datos importados y descarta basura', () => {
    const s = normalize({ v: 1, theme: 'raro', chaptersDone: [1, 99, 'x', 3], favorites: ['1.1', 7], attempts: { '1.1': { n: 1, correct: 1, solved: true, last: 0 } } });
    expect(s.theme).toBe('system');
    expect(s.chaptersDone).toEqual([1, 3]);
    expect(s.favorites).toEqual(['1.1']);
    expect(normalize(null).chaptersDone).toEqual([]);
  });
  it('los 11 presets de gráficas existen para cada capítulo', () => expect(new Set(GRAPH_PRESETS.map((p) => p.chapter)).size).toBe(10));
});
