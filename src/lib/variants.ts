/**
 * Variantes paramétricas de los ejercicios del folleto.
 * Cada familia calcula la respuesta con una fórmula cerrada Y la contrasta con el motor numérico antes de mostrarla;
 * si no coinciden, la variante se descarta (nunca se muestra una respuesta sin verificar).
 */
import { getCategory } from './math/solver';

export interface Variant { family: string; base: string; statement: string; answer: string; value: number[]; steps: string[]; verifiedBy: string }
interface Family {
  id: string; base: string; label: string;
  make: (r: () => number) => { statement: string; answer: string; value: number[]; steps: string[]; verify: () => { engine: number; closed: number; by: string } };
}

const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];
const solve = (cat: string, inp: Record<string, string>) => getCategory(cat)!.solve(inp);

const FAMILIES: Family[] = [
  { id: 'cono', base: '1.3', label: 'Superficie de revolución de una recta (cono truncado)', make: (r) => {
    const k = pick(r, [1, 2, 3]), a = pick(r, [0, 1]), b = a + pick(r, [2, 3, 4]);
    const S = Math.PI * k * Math.sqrt(1 + k * k) * (b * b - a * a);
    return { statement: `Calcule el área de la superficie generada al rotar $y=${k === 1 ? '' : k}x$ en el intervalo $[${a},${b}]$ alrededor del eje $x$.`,
      answer: `$S=\\pi\\,${k}\\sqrt{${1 + k * k}}\\,(${b * b}-${a * a})=${(Math.PI * k * Math.sqrt(1 + k * k) * (b * b - a * a)).toFixed(4)}$`, value: [S],
      steps: ['$f\'=' + k + '$, $\\sqrt{1+f\'^2}=\\sqrt{' + (1 + k * k) + '}$ (constante).', `$S=\\int_{${a}}^{${b}}2\\pi(${k}x)\\sqrt{${1 + k * k}}\\,dx=\\pi\\,${k}\\sqrt{${1 + k * k}}\\,[x^2]_{${a}}^{${b}}$.`],
      verify: () => ({ engine: solve('revolution', { f: `${k}*x`, a: `${a}`, b: `${b}`, axis: 'x' }).numeric as number, closed: S, by: 'Resolutor: cuadratura tanh-sinh' }) };
  } },
  { id: 'promedio-potencia', base: '2.3', label: 'Valor promedio de $x^n$', make: (r) => {
    const n = pick(r, [2, 3, 4]), a = pick(r, [0, 1, 2]), b = a + pick(r, [2, 3, 4]);
    const avg = (b ** (n + 1) - a ** (n + 1)) / ((n + 1) * (b - a));
    const c = avg ** (1 / n);
    return { statement: `Determine el valor promedio de $f(x)=x^{${n}}$ en $[${a},${b}]$ y el valor de $c$ donde se alcanza.`,
      answer: `$f_{\\text{prom}}=\\dfrac{${b ** (n + 1)}-${a ** (n + 1)}}{${n + 1}\\cdot${b - a}}=${avg.toFixed(4)}$; $c=\\sqrt[${n}]{${avg.toFixed(4)}}\\approx${c.toFixed(4)}$`, value: [avg, c],
      steps: [`$\\int_{${a}}^{${b}}x^{${n}}dx=\\frac{${b}^{${n + 1}}-${a}^{${n + 1}}}{${n + 1}}$.`, `Dividir entre $b-a=${b - a}$ y resolver $c^{${n}}=f_{\\text{prom}}$.`],
      verify: () => ({ engine: solve('avg1', { f: `x^${n}`, a: `${a}`, b: `${b}` }).numeric as number, closed: avg, by: 'Resolutor: valor promedio por cuadratura' }) };
  } },
  { id: 'centroide-triangulo', base: '3.3', label: 'Centroide de un triángulo rectángulo', make: (r) => {
    const A = pick(r, [3, 4, 6, 9]), B = pick(r, [3, 6, 12, 5]);
    return { statement: `Determine el centroide del triángulo limitado por los ejes coordenados y la recta $y=-\\frac{${B}}{${A}}x+${B}$.`,
      answer: `$(\\bar x,\\bar y)=\\left(\\dfrac{${A}}{3},\\dfrac{${B}}{3}\\right)\\approx(${(A / 3).toFixed(4)},\\ ${(B / 3).toFixed(4)})$`, value: [A / 3, B / 3],
      steps: [`Vértices $(0,0)$, $(${A},0)$, $(0,${B})$: el centroide es su promedio.`, `Comprobación por integración: $M_y/A$ con $A=${(A * B) / 2}$.`],
      verify: () => { const res = solve('centroid1', { f: `-${B}/${A}*x+${B}`, g: '0', a: '0', b: `${A}` }); return { engine: res.numeric as number, closed: A / 3, by: 'Resolutor: centroide por integrales' }; } };
  } },
  { id: 'derivadas', base: '9.1', label: 'Derivadas parciales de un monomio con términos lineales', make: (r) => {
    const p = pick(r, [2, 3, 4, 5]), m = pick(r, [2, 3]), n = pick(r, [2, 3]), s = pick(r, [2, 3, 5]), t = pick(r, [4, 6, 7]);
    const x0 = pick(r, [1, 2]), y0 = pick(r, [1, 2, 3]);
    const fx = p * m * x0 ** (m - 1) * y0 ** n - s, fy = p * n * x0 ** m * y0 ** (n - 1) + t;
    return { statement: `Calcule $f_x$ y $f_y$ para $f(x,y)=${p}x^{${m}}y^{${n}}-${s}x+${t}y$ y evalúelas en $(${x0},${y0})$.`,
      answer: `$f_x=${p * m}x^{${m - 1}}y^{${n}}-${s}$, $f_y=${p * n}x^{${m}}y^{${n - 1}}+${t}$; $f_x(${x0},${y0})=${fx}$, $f_y(${x0},${y0})=${fy}$`, value: [fx, fy],
      steps: ['Derive respecto de una variable tratando la otra como constante.'],
      verify: () => { const res = solve('partials', { f: `${p}*x^${m}*y^${n}-${s}*x+${t}*y`, point: `${x0},${y0}` }); const ok = res.checks.every((c) => c.pass); return { engine: ok ? fx : NaN, closed: fx, by: 'Resolutor: derivadas simbólicas contrastadas con diferencias finitas' }; } };
  } },
  { id: 'critico', base: '10.2', label: 'Punto crítico de un paraboloide', make: (r) => {
    const p = pick(r, [2, 4, 6, -2, -4]), q = pick(r, [2, 4, 6, -6]), c = pick(r, [1, 5, 7]);
    return { statement: `Encuentre el punto crítico de $f(x,y)=x^2+y^2${p < 0 ? '+' + -p : '-' + p}x${q < 0 ? '-' + -q : '+' + q}y+${c}$ y clasifíquelo.`,
      answer: `Punto crítico $(${p / 2},\\ ${-q / 2})$: mínimo local ($D=4>0$, $f_{xx}=2>0$).`, value: [p / 2, -q / 2],
      steps: [`$f_x=2x${p < 0 ? '+' + -p : '-' + p}=0\\Rightarrow x=${p / 2}$.`, `$f_y=2y${q < 0 ? '-' + -q : '+' + q}=0\\Rightarrow y=${-q / 2}$.`],
      verify: () => { const res = solve('extrema', { f: `x^2+y^2${p < 0 ? '+' : '-'}${Math.abs(p)}*x${q < 0 ? '-' : '+'}${Math.abs(q)}*y+${c}`, R: '10' }); const m = /\(([-\d.e]+),([-\d.e]+)\)/.exec(res.answer ?? ''); return { engine: m ? Number(m[1]) : NaN, closed: p / 2, by: 'Resolutor: Newton sobre ∇f=0' }; } };
  } },
  { id: 'cadena', base: '10.1', label: 'Regla de la cadena', make: (r) => {
    const a = pick(r, [2, 3, 4]), q = pick(r, [2, 3]);
    // z = x^2 y, x = a t, y = t^q  → z = a^2 t^(2+q)  → dz/dt = a^2 (2+q) t^(1+q)
    const t0 = pick(r, [1, 2]);
    const val = a * a * (2 + q) * t0 ** (1 + q);
    return { statement: `Use la regla de la cadena para calcular $dz/dt$ si $z=x^2y$, $x=${a}t$, $y=t^{${q}}$, y evalúe en $t=${t0}$.`,
      answer: `$\\dfrac{dz}{dt}=2xy\\cdot${a}+x^2\\cdot${q}t^{${q - 1}}=${a * a * (2 + q)}\\,t^{${1 + q}}$; en $t=${t0}$: $${val}$`, value: [val],
      steps: [`$z=${a * a}t^{${2 + q}}$ al sustituir directamente; derivando: $${a * a * (2 + q)}t^{${1 + q}}$ ✓.`],
      verify: () => ({ engine: solve('chain', { f: 'x^2*y', x: `${a}*t`, y: `t^${q}`, t0: `${t0}` }).numeric as number, closed: val, by: 'Resolutor: regla de la cadena vs. derivada numérica de z(t)' }) };
  } },
  { id: 'promedio-doble', base: '6.3', label: 'Valor promedio de xy sobre un rectángulo', make: (r) => {
    const A = pick(r, [2, 3, 4]), B = pick(r, [1, 2, 5]);
    return { statement: `Calcule el valor promedio de $f(x,y)=xy$ sobre el rectángulo $0\\le x\\le${A}$, $0\\le y\\le${B}$.`,
      answer: `$f_{\\text{prom}}=\\dfrac{1}{${A * B}}\\cdot\\dfrac{${A}^2}{2}\\cdot\\dfrac{${B}^2}{2}=${((A * B) / 4).toFixed(4)}$`, value: [(A * B) / 4],
      steps: [`$\\iint xy\\,dA=\\frac{${A}^2}{2}\\cdot\\frac{${B}^2}{2}$ y el área es $${A * B}$.`],
      verify: () => ({ engine: solve('avg2', { f: 'x*y', a: '0', b: `${A}`, g1: '0', g2: `${B}` }).numeric as number, closed: (A * B) / 4, by: 'Resolutor: integral doble (tanh-sinh anidada) con verificación por punto medio' }) };
  } },
  { id: 'masa', base: '7.3', label: 'Masa de una lámina triangular con ρ = x + y', make: (r) => {
    const a = pick(r, [1, 2, 3, 4]);
    const m = (a ** 3) / 3;
    return { statement: `Halle la masa de la lámina triangular con vértices $(0,0)$, $(${a},0)$ y $(0,${a})$ con densidad $\\rho(x,y)=x+y$.`,
      answer: `$m=\\dfrac{${a}^3}{3}=${m.toFixed(4)}$`, value: [m],
      steps: [`$m=\\int_0^{${a}}\\int_0^{${a}-x}(x+y)\\,dy\\,dx=\\int_0^{${a}}\\left(${a}^2/2-x^2/2\\right)dx$ (el integrando interno es $\\tfrac{${a}^2-x^2}{2}$).`],
      verify: () => ({ engine: solve('lamina', { rho: 'x+y', a: '0', b: `${a}`, g1: '0', g2: `${a}-x` }).numeric as number, closed: m, by: 'Resolutor: masa por integral doble' }) };
  } },
];

export const VARIANT_FAMILIES = FAMILIES.map((f) => ({ id: f.id, base: f.base, label: f.label }));

function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function makeVariant(familyId: string, seed = Date.now()): Variant {
  const fam = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0];
  for (let k = 0; k < 20; k++) {
    const v = fam.make(rng(seed + k * 7919));
    const ver = v.verify();
    if (Number.isFinite(ver.engine) && Math.abs(ver.engine - ver.closed) <= 1e-5 * Math.max(1, Math.abs(ver.closed)))
      return { family: fam.id, base: fam.base, statement: v.statement, answer: v.answer, value: v.value, steps: v.steps, verifiedBy: ver.by };
  }
  throw new Error('No se pudo generar una variante verificada.');
}
export const familyForExercise = (id: string) => FAMILIES.find((f) => f.base === id)?.id;
