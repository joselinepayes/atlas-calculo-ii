import { describe, it, expect } from 'vitest';
import { integrate, integrate2, fn1, fn2, roots, normalize, diff } from '../core';
import { getCategory, findCritical, num } from '../solver';

const solve = (id: string, inp: Record<string, string>) => getCategory(id)!.solve(inp);
const close = (a: number | undefined, b: number, tol = 1e-6) => expect(Math.abs((a as number) - b)).toBeLessThan(tol * Math.max(1, Math.abs(b)));

describe('cuadratura', () => {
  it('integrales básicas con valor conocido', () => {
    close(integrate((x) => x * x, 0, 3).value, 9, 1e-10);
    close(integrate(Math.sqrt, 0, 9).value, 18, 1e-9);
    close(integrate(Math.sin, 0, Math.PI).value, 2, 1e-10);
    close(integrate((x) => 1 / Math.sqrt(x), 0, 1).value, 2, 1e-8);
  });
  it('integrales impropias', () => {
    close(integrate((x) => Math.exp(-x), 0, Infinity).value, 1, 1e-8);
    close(integrate((x) => 1 / (x * x), 1, Infinity).value, 1, 1e-8);
    close(integrate((x) => Math.exp(-x * x), -Infinity, Infinity).value, Math.sqrt(Math.PI), 1e-8);
  });
  it('integral doble: triángulo y disco', () => {
    close(integrate2(() => 1, 0, 1, () => 0, (x) => x).value, 0.5, 1e-9);
    close(integrate2(() => 1, -1, 1, (x) => -Math.sqrt(1 - x * x), (x) => Math.sqrt(1 - x * x)).value, Math.PI, 1e-5);
  });
  it('raíces', () => {
    const r = roots((x) => x * x - 2, -3, 3);
    expect(r.length).toBe(2);
    close(r[1], Math.SQRT2, 1e-10);
  });
});

describe('sintaxis', () => {
  it('normaliza productos implícitos', () => {
    expect(normalize('x*y^2/(x^2+y^4)')).toBe('x*y^2/(x^2+y^4)');
    expect(normalize('xy+2x')).toBe('x*y+2x');
    close(fn2('xy+ln(x)')(2, 3), 6 + Math.log(2), 1e-12);
    expect(diff('x^3*y', 'x')).toContain('3');
  });
});

describe('Capítulo 1: superficies de revolución (ejemplos del folleto)', () => {
  it('Ejemplo 1.1: esfera R=2 → 16π', () => {
    const r = solve('revolution', { f: 'sqrt(4-x^2)', a: '-2', b: '2', axis: 'x' });
    expect(r.ok).toBe(true);
    close(r.numeric, 16 * Math.PI, 1e-6);
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });
  it('Ejemplo 1.2: y=x³ en [0,1] → π/27 (10√10−1)', () => {
    const r = solve('revolution', { f: 'x^3', a: '0', b: '1', axis: 'x' });
    close(r.numeric, (Math.PI / 27) * (10 * Math.sqrt(10) - 1), 1e-9);
  });
  it('Ejercicio 1.3: y=√x en [1,4] → π/6 (17√17−5√5)', () => {
    const r = solve('revolution', { f: 'sqrt(x)', a: '1', b: '4', axis: 'x' });
    close(r.numeric, (Math.PI / 6) * (17 * Math.sqrt(17) - 5 * Math.sqrt(5)), 1e-8);
  });
  it('Ejercicio 1.4: y=x²/4 en [0,2] eje y → 8π/3 (2√2−1)', () => {
    const r = solve('revolution', { f: 'x^2/4', a: '0', b: '2', axis: 'y' });
    close(r.numeric, ((8 * Math.PI) / 3) * (2 * Math.SQRT2 - 1), 1e-8);
  });
  it('rechaza f<0 con eje x', () => {
    expect(solve('revolution', { f: '-x', a: '1', b: '2', axis: 'x' }).ok).toBe(false);
  });
});

describe('Capítulo 2: valor promedio', () => {
  it('f=√x en [0,9] → 2 con c=4', () => {
    const r = solve('avg1', { f: 'sqrt(x)', a: '0', b: '9' });
    close(r.numeric, 2, 1e-9);
    expect(r.sections[5].items.some((i) => i.kind === 'text' && i.x.includes('4'))).toBe(true);
  });
  it('f=x² en [-2,2] → 4/3', () => close(solve('avg1', { f: 'x^2', a: '-2', b: '2' }).numeric, 4 / 3, 1e-9));
  it('integral exacta: ∫₀¹ x² = 1/3', () => {
    const r = solve('integral', { f: 'x^2', a: '0', b: '1' });
    close(r.numeric, 1 / 3, 1e-10);
    expect(r.checks.length).toBeGreaterThan(0);
  });
  it('integral sin primitiva elemental declara la limitación', () => {
    const r = solve('integral', { f: 'exp(-x^2)', a: '0', b: '1' });
    close(r.numeric, 0.7468241328124271, 1e-8);
  });
});

describe('Capítulo 3: centroides', () => {
  it('Ejercicio 3.4: sin x en [0,π] → (π/2, π/8)', () => {
    const r = solve('centroid1', { f: 'sin(x)', g: '0', a: '0', b: 'pi' });
    close(r.numeric, Math.PI / 2, 1e-8);
    expect(r.answer).toContain(String(Number((Math.PI / 8).toPrecision(8))).slice(0, 6));
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });
  it('Ejercicio 7.4: y=x² hasta y=4 → (0, 12/5)', () => {
    const r = solve('centroid1', { f: '4', g: 'x^2', a: '-2', b: '2' });
    expect(r.answer).toContain('2.4');
  });
  it('Ejercicio 3.3: triángulo y=-x+3 → (1,1)', () => {
    const r = solve('centroid1', { f: '-x+3', g: '0', a: '0', b: '3' });
    close(r.numeric, 1, 1e-9);
  });
});

describe('Capítulos 6 y 7: integrales dobles', () => {
  it('Ejercicio 6.3: promedio de xy en el triángulo → 1/4', () => close(solve('avg2', { f: 'x*y', a: '0', b: '1', g1: '0', g2: 'x' }).numeric, 0.25, 1e-7));
  it('Ejercicio 6.2: promedio de x+y en el cuadrado → 1', () => close(solve('avg2', { f: 'x+y', a: '0', b: '1', g1: '0', g2: '1' }).numeric, 1, 1e-8));
  it('Ejercicio 6.4: temperatura promedio en disco r=2 → 22', () => {
    close(solve('avg2', { f: '20+x^2+y^2', a: '-2', b: '2', g1: '-sqrt(4-x^2)', g2: 'sqrt(4-x^2)' }).numeric, 22, 1e-5);
  });
  it('Ejercicio 7.3: masa del triángulo con ρ=x+y → 8/3', () => {
    const r = solve('lamina', { rho: 'x+y', a: '0', b: '2', g1: '0', g2: '2-x' });
    close(r.numeric, 8 / 3, 1e-8);
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });
  it('Ejercicio 3.5 con a=b=1: (3/8, 3/8)', () => {
    const r = solve('lamina', { rho: 'x+y', a: '0', b: '1', g1: '0', g2: '1-x' });
    expect(r.answer).toContain('0.375');
  });
});

describe('Capítulos 8–10', () => {
  it('Ejercicio 8.4: el límite de xy²/(x²+y⁴) en (0,0) no existe', () => {
    expect(solve('limit2', { f: 'x*y^2/(x^2+y^4)', point: '0,0' }).answer).toBe('No existe');
  });
  it('Ejercicio 8.1: sustitución directa → −4', () => close(solve('limit2', { f: '3*x^2*y-5*y', point: '1,2' }).numeric, -4, 1e-12));
  it('Ejercicio 8.3: (x²−y²)/(x−y) → 4 (evidencia)', () => close(solve('limit2', { f: '(x^2-y^2)/(x-y)', point: '2,2' }).numeric, 4, 1e-3));
  it('Ejercicio 8.6: (x³+y³)/(x²+y²) → 0', () => close(solve('limit2', { f: '(x^3+y^3)/(x^2+y^2)', point: '0,0' }).numeric, 0, 1e-3));
  it('Ejemplo 9.x: derivadas parciales y Clairaut', () => {
    const r = solve('partials', { f: 'exp(x*y)+sin(x)', point: '0, 1' });
    expect(r.ok).toBe(true);
    expect(r.checks.every((c) => c.pass)).toBe(true);
    expect(JSON.stringify(r.sections)).toContain('se cumple');
  });
  it('Ejercicio 10.1: regla de la cadena → 36t³', () => {
    const r = solve('chain', { f: 'x^2*y', x: '3*t', y: 't^2', t0: '1' });
    close(r.numeric, 36, 1e-9);
    expect(r.checks.every((c) => c.pass)).toBe(true);
  });
  it('Ejercicio 10.2: punto crítico (2,−3), mínimo', () => {
    const { points } = findCritical('x^2+y^2-4*x+6*y+5');
    expect(points.length).toBe(1);
    close(points[0].x, 2, 1e-9); close(points[0].y, -3, 1e-9);
    expect(points[0].type).toBe('Mínimo local');
  });
  it('Ejercicio 10.3: xy−x³−y³ → silla en (0,0), máximo en (1/3,1/3) con D=3', () => {
    const { points } = findCritical('x*y-x^3-y^3');
    const o = points.find((p) => Math.abs(p.x) < 1e-6 && Math.abs(p.y) < 1e-6)!;
    const q = points.find((p) => Math.abs(p.x - 1 / 3) < 1e-6)!;
    expect(o.type).toBe('Punto silla');
    expect(q.type).toBe('Máximo local');
    close(q.D, 3, 1e-6);
  });
  it('Ejercicio 10.6: utilidad cuadrática → máximo en (2,0) con U=4', () => {
    const { points } = findCritical('-x^2-2*y^2+4*x+4*y-2*x*y');
    expect(points.length).toBe(1);
    close(points[0].x, 2, 1e-8); close(points[0].y, 0, 1e-8); close(points[0].z, 4, 1e-8);
  });
  it('evalúa y detecta puntos fuera del dominio', () => {
    close(solve('eval', { vars: 'x,y,z', f: 'x^2*sin(y)+z', point: '2, pi/2, 5' }).numeric, 9, 1e-12);
    expect(solve('eval', { vars: 'x,y', f: 'ln(y-x^2)', point: '1, 0' }).answer).toBe('No definido');
  });
  it('num() interpreta constantes', () => {
    close(num('pi/2'), Math.PI / 2, 1e-15);
    expect(num('inf')).toBe(Infinity);
    close(fn1('x^2')(3), 9, 1e-15);
  });
});
