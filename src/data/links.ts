/** Enlaces entre ejemplos del folleto, el Resolutor y el laboratorio de gráficas. */
export interface SolverLink { cat: string; inputs: Record<string, string>; note?: string }

export const EXAMPLE_SOLVER: Record<string, SolverLink> = {
  '1.1': { cat: 'revolution', inputs: { f: 'sqrt(4-x^2)', a: '-2', b: '2', axis: 'x' }, note: 'Instancia con R = 2: el resultado debe ser 4π·2² = 16π ≈ 50.2655.' },
  '1.2': { cat: 'revolution', inputs: { f: 'x^3', a: '0', b: '1', axis: 'x' } },
  '2.1': { cat: 'avg1', inputs: { f: '20+4*sin(pi*x/12)', a: '0', b: '12' }, note: 'La variable independiente se escribe x (en el folleto es t).' },
  '2.2': { cat: 'avg1', inputs: { f: '60/x', a: '1', b: '4' } },
  '3.1': { cat: 'centroid1', inputs: { f: '4-x^2', g: '0', a: '-2', b: '2' } },
  '3.2': { cat: 'centroid1', inputs: { f: 'sqrt(x)', g: 'x^2', a: '0', b: '1' } },
  '5.1': { cat: 'eval', inputs: { vars: 'x,y', f: '300+10*x+15*y-0.01*x*y', point: '100, 200' } },
  '5.3': { cat: 'eval', inputs: { vars: 'x,y', f: 'sqrt(x)*ln(y-x)', point: '4, 5' } },
  '6.1': { cat: 'avg2', inputs: { f: 'x^2*y', a: '0', b: '2', g1: '0', g2: '3' } },
  '6.2': { cat: 'avg2', inputs: { f: 'x*y', a: '0', b: '1', g1: 'x^2', g2: 'x' } },
  '7.1': { cat: 'lamina', inputs: { rho: '1', a: '-1', b: '1', g1: '0', g2: 'sqrt(1-x^2)' }, note: 'Instancia con a = 1: el centroide es (0, 4/(3π)) ≈ (0, 0.4244).' },
  '7.2': { cat: 'lamina', inputs: { rho: '1+3*x+y', a: '0', b: '1', g1: '0', g2: '2-2*x' } },
  '8.1': { cat: 'limit2', inputs: { f: 'x*y/(x^2+y^2)', point: '0, 0' } },
  '8.2': { cat: 'limit2', inputs: { f: 'x^2*y/(x^2+y^2)', point: '0, 0' } },
  '9.1': { cat: 'partials', inputs: { f: 'pi*x^2*y', point: '10, 25' }, note: 'Con x = r, y = h: V_r = 2πrh y V_h = πr².' },
  '9.3': { cat: 'partials', inputs: { f: 'sqrt(x^2+y^2)', point: '3, 4' } },
  '10.1': { cat: 'extrema', inputs: { f: 'x^3-3*x+3*x*y^2', R: '4' } },
  '10.2': { cat: 'chain', inputs: { f: 'pi*x^2*y', x: '5+0.1*t', y: '10-0.2*t', t0: '0' }, note: 'x = r(t), y = h(t); t = 0 corresponde a r = 5, h = 10.' },
};

export interface GraphState {
  mode: 'curve2d' | 'surface' | 'contour' | 'revolution' | 'region';
  f1: string; f2: string; f3: string; fxy: string; g1: string; g2: string; rho: string;
  a: string; b: string; R: string; axis: 'x' | 'y'; x0: string; y0: string;
  tangent: boolean; critical: boolean; roots: boolean; shade: boolean; coords: boolean;
  p: number; q: number; k: number;
}
export const DEFAULT_GRAPH: GraphState = {
  mode: 'surface', f1: 'sin(x)', f2: '', f3: '', fxy: 'x^2-y^2', g1: 'x^2', g2: 'sqrt(x)', rho: '',
  a: '0', b: '1', R: '3', axis: 'x', x0: '1', y0: '1', tangent: false, critical: true, roots: false, shade: false, coords: true, p: 1, q: 1, k: 1,
};
export const GRAPH_PRESETS: { id: string; label: string; chapter: number; state: Partial<GraphState> }[] = [
  { id: 'ch1', label: 'Superficie de revolución de y = x³', chapter: 1, state: { mode: 'revolution', f1: 'x^3', a: '0', b: '1', axis: 'x' } },
  { id: 'ch2', label: 'Temperatura y su promedio (Ej. 2.1)', chapter: 2, state: { mode: 'curve2d', f1: '20+4*sin(pi*x/12)', f2: '20+8/pi', a: '0', b: '12', R: '12', shade: true } },
  { id: 'ch3', label: 'Región entre y=√x y y=x² con centroide (Ej. 3.2)', chapter: 3, state: { mode: 'region', g1: 'x^2', g2: 'sqrt(x)', a: '0', b: '1', rho: '' } },
  { id: 'ch4', label: 'Curvas de nivel de x² + 4y²', chapter: 4, state: { mode: 'contour', fxy: 'x^2+4*y^2', R: '4', critical: true } },
  { id: 'ch5', label: 'Cuádrica: paraboloide hiperbólico', chapter: 5, state: { mode: 'surface', fxy: 'x^2-y^2', R: '3', critical: true } },
  { id: 'ch6', label: 'Superficie f = x²y sobre [0,2]×[0,3]', chapter: 6, state: { mode: 'surface', fxy: 'x^2*y', R: '3', critical: false } },
  { id: 'ch7', label: 'Lámina triangular con ρ = 1+3x+y (Ej. 7.2)', chapter: 7, state: { mode: 'region', g1: '0', g2: '2-2*x', a: '0', b: '1', rho: '1+3*x+y' } },
  { id: 'ch8', label: 'f = xy/(x²+y²): discontinuidad en el origen', chapter: 8, state: { mode: 'surface', fxy: 'x*y/(x^2+y^2)', R: '2', critical: false } },
  { id: 'ch9', label: 'Plano tangente de √(x²+y²) en (3,4)', chapter: 9, state: { mode: 'surface', fxy: 'sqrt(x^2+y^2)', R: '6', tangent: true, x0: '3', y0: '4', critical: false } },
  { id: 'ch10', label: 'Puntos críticos de x³−3x+3xy² (Ej. 10.1)', chapter: 10, state: { mode: 'surface', fxy: 'x^3-3*x+3*x*y^2', R: '2.5', critical: true } },
];
