import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, RotateCcw } from 'lucide-react';
import { PageHeader, Spinner } from '../components/ui';
import { DEFAULT_GRAPH, GRAPH_PRESETS, type GraphState } from '../data/links';
import { diff, fmt, fn1, fn2, integrate, integrate2, roots as findRoots } from '../lib/math/core';
import { findCritical, num } from '../lib/math/solver';
import { Tex } from '../components/Rich';

type PlotlyT = typeof import('plotly.js-dist-min');
let plotlyP: Promise<PlotlyT> | null = null;
const loadPlotly = () => (plotlyP ??= import('plotly.js-dist-min').then((m) => (m as any).default ?? m));

const MODES: { id: GraphState['mode']; label: string }[] = [
  { id: 'surface', label: 'Superficie 3D' }, { id: 'contour', label: 'Curvas de nivel' }, { id: 'curve2d', label: 'Funciones 2D' },
  { id: 'revolution', label: 'Superficie de revolución' }, { id: 'region', label: 'Región de integración y centroide' },
];

function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  const g = (v: string) => cs.getPropertyValue(v).trim();
  return { fg: g('--fg'), muted: g('--muted'), line: g('--line'), brand: g('--violet'), gold: g('--gold'), bad: g('--formula'), surface: g('--surface') };
}

const linspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

interface Built { data: any[]; layout: any; info: string[]; error?: string }

function build(s: GraphState, c: ReturnType<typeof themeColors>): Built {
  const extra = { p: s.p, q: s.q, k: s.k };
  const info: string[] = [];
  const base = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: c.fg, family: 'ui-sans-serif, system-ui, sans-serif' },
    margin: { l: 50, r: 20, t: 30, b: 45 }, hovermode: s.coords ? 'closest' : false, legend: { orientation: 'h', y: -0.15 },
  };
  const axis2d = (t: string) => ({ title: t, gridcolor: c.line, zerolinecolor: c.muted });
  try {
    const R = num(s.R || '3');
    if (s.mode === 'curve2d') {
      const a = num(s.a), b = num(s.b);
      const lo = Math.min(a, -R), hi = Math.max(b, R);
      const xs = linspace(s.shade ? Math.min(a, b) - 0.01 : -R, s.shade ? Math.max(a, b) + 0.01 : R, 500);
      const exprs = [s.f1, s.f2, s.f3].filter((e) => e.trim());
      const cols = [c.brand, c.gold, c.bad];
      const data: any[] = exprs.map((e, i) => {
        const f = fn1(e, extra);
        return { x: xs, y: xs.map((x) => { const v = f(x); return Number.isFinite(v) ? v : null; }), type: 'scatter', mode: 'lines', name: `y = ${e}`, line: { color: cols[i], width: 3 }, hovertemplate: 'x=%{x:.4f}<br>y=%{y:.4f}<extra></extra>' };
      });
      if (s.shade && exprs.length >= 2) {
        const f = fn1(exprs[0], extra), g = fn1(exprs[1], extra);
        const xx = linspace(a, b, 200);
        data.push({ x: [...xx, ...xx.slice().reverse()], y: [...xx.map(f), ...xx.slice().reverse().map(g)], fill: 'toself', fillcolor: 'rgba(124,58,237,0.18)', line: { width: 0 }, name: 'Región entre f₁ y f₂', hoverinfo: 'skip', type: 'scatter' });
        const area = integrate((x) => Math.abs(f(x) - g(x)), a, b).value;
        info.push(`Área entre f₁ y f₂ en [${fmt(a)}, ${fmt(b)}] = ${fmt(area, 8)}`);
        if (exprs.length >= 1) info.push(`Valor promedio de f₁ en [${fmt(a)}, ${fmt(b)}] = ${fmt(integrate(f, a, b).value / (b - a), 8)}`);
      }
      if (s.roots && exprs[0]) {
        const f = fn1(exprs[0], extra);
        const r = findRoots(f, xs[0], xs[xs.length - 1]);
        const df = (x: number) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
        const crit = findRoots(df, xs[0], xs[xs.length - 1]);
        if (r.length) data.push({ x: r, y: r.map(() => 0), mode: 'markers', type: 'scatter', name: 'Raíces de f₁', marker: { size: 11, color: c.bad, symbol: 'diamond' }, hovertemplate: 'raíz x=%{x:.5f}<extra></extra>' });
        if (crit.length) data.push({ x: crit, y: crit.map(f), mode: 'markers', type: 'scatter', name: 'Extremos de f₁', marker: { size: 11, color: c.gold, symbol: 'star' }, hovertemplate: 'x=%{x:.5f}<br>y=%{y:.5f}<extra></extra>' });
        info.push(`Raíces de f₁: ${r.map((v) => fmt(v, 5)).join(', ') || 'ninguna en la ventana'}`);
      }
      void lo; void hi;
      return { data, layout: { ...base, xaxis: axis2d('x'), yaxis: axis2d('y') }, info };
    }
    if (s.mode === 'region') {
      const a = num(s.a), b = num(s.b);
      const g1 = fn1(s.g1 || '0', extra), g2 = fn1(s.g2, extra);
      const xs = linspace(a, b, 300);
      const rho = s.rho.trim() ? fn2(s.rho, extra) : () => 1;
      const m = integrate2(rho, a, b, g1, g2).value;
      const My = integrate2((x, y) => x * rho(x, y), a, b, g1, g2).value;
      const Mx = integrate2((x, y) => y * rho(x, y), a, b, g1, g2).value;
      const A = integrate2(() => 1, a, b, g1, g2).value;
      const data: any[] = [
        { x: xs, y: xs.map(g1), mode: 'lines', type: 'scatter', name: `y = ${s.g1 || '0'}`, line: { color: c.brand, width: 3 } },
        { x: xs, y: xs.map(g2), mode: 'lines', type: 'scatter', name: `y = ${s.g2}`, line: { color: c.gold, width: 3 }, fill: 'tonexty', fillcolor: 'rgba(124,58,237,0.2)' },
      ];
      if (m > 1e-12) {
        data.push({ x: [My / m], y: [Mx / m], mode: 'markers+text', type: 'scatter', name: s.rho.trim() ? 'Centro de masa' : 'Centroide', marker: { size: 14, color: c.bad, symbol: 'x', line: { width: 3, color: c.bad } }, text: [`(${fmt(My / m, 4)}, ${fmt(Mx / m, 4)})`], textposition: 'top right', hovertemplate: 'x̄=%{x:.5f}<br>ȳ=%{y:.5f}<extra></extra>' });
        info.push(`Área = ${fmt(A, 8)}`, s.rho.trim() ? `Masa = ${fmt(m, 8)}` : '', `${s.rho.trim() ? 'Centro de masa' : 'Centroide'} = (${fmt(My / m, 8)}, ${fmt(Mx / m, 8)})`);
      }
      return { data, layout: { ...base, xaxis: axis2d('x'), yaxis: { ...axis2d('y'), scaleanchor: 'x' } }, info: info.filter(Boolean) };
    }
    if (s.mode === 'revolution') {
      const a = num(s.a), b = num(s.b);
      const f = fn1(s.f1, extra);
      const n = 70, m = 60;
      const xs = linspace(a, b, n), th = linspace(0, 2 * Math.PI, m);
      const X: number[][] = [], Y: number[][] = [], Z: number[][] = [];
      for (const x of xs) {
        const r = s.axis === 'x' ? f(x) : x;
        const px = s.axis === 'x' ? x : undefined;
        X.push(th.map((t) => (px !== undefined ? px : r * Math.cos(t)))); Y.push(th.map((t) => (s.axis === 'x' ? r * Math.cos(t) : f(x)))); Z.push(th.map((t) => r * Math.sin(t)));
      }
      const curve = { x: xs.map((x) => (s.axis === 'x' ? x : x)), y: xs.map((x) => f(x)), z: xs.map(() => 0), type: 'scatter3d', mode: 'lines', line: { color: c.bad, width: 7 }, name: 'Curva generatriz' };
      const dstr = diff(s.f1, 'x');
      const df = fn1(dstr, extra);
      const S = integrate((x) => 2 * Math.PI * (s.axis === 'x' ? f(x) : x) * Math.sqrt(1 + df(x) ** 2), a, b).value;
      info.push(`Área de la superficie S = ${fmt(S, 8)}`);
      return { data: [{ type: 'surface', x: X, y: Y, z: Z, colorscale: 'Viridis', showscale: false, opacity: 0.92, name: 'Superficie', hovertemplate: 'x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>' }, curve], layout: { ...base, margin: { l: 0, r: 0, t: 10, b: 0 }, scene: sceneStyle(c, s.axis === 'x' ? 'x (eje de giro)' : 'x', s.axis === 'y' ? 'y (eje de giro)' : 'y', 'z') }, info };
    }
    // surface / contour
    const f = fn2(s.fxy, extra);
    const n = s.mode === 'surface' ? 70 : 120;
    const xs = linspace(-R, R, n), ys = linspace(-R, R, n);
    const Z = ys.map((y) => xs.map((x) => { const v = f(x, y); return Number.isFinite(v) ? v : null; }));
    const { points } = s.critical ? findCritical(s.fxy, Math.max(R, 1)) : { points: [] as ReturnType<typeof findCritical>['points'] };
    const inWin = points.filter((p) => Math.abs(p.x) <= R && Math.abs(p.y) <= R);
    if (s.critical) info.push(inWin.length ? 'Puntos críticos: ' + inWin.map((p) => `(${fmt(p.x, 4)}, ${fmt(p.y, 4)}) ${p.type.toLowerCase()}`).join(' · ') : 'No hay puntos críticos en la ventana.');
    const colorOf = (t: string) => (t.startsWith('Mín') ? '#22c55e' : t.startsWith('Máx') ? '#ef4444' : t.startsWith('Punto silla') ? '#f59e0b' : '#a78bfa');
    if (s.mode === 'contour') {
      const data: any[] = [{ type: 'contour', x: xs, y: ys, z: Z, colorscale: 'Viridis', contours: { showlabels: true, labelfont: { color: '#fff' } }, line: { width: 1.4 }, colorbar: { title: 'f(x,y)', tickfont: { color: c.fg } }, hovertemplate: 'x=%{x:.3f}<br>y=%{y:.3f}<br>f=%{z:.4f}<extra></extra>' }];
      if (inWin.length) data.push({ x: inWin.map((p) => p.x), y: inWin.map((p) => p.y), mode: 'markers', type: 'scatter', name: 'Puntos críticos', marker: { size: 12, color: inWin.map((p) => colorOf(p.type)), line: { width: 2, color: '#fff' } }, text: inWin.map((p) => p.type), hovertemplate: '%{text}<br>(%{x:.4f}, %{y:.4f})<extra></extra>' });
      return { data, layout: { ...base, xaxis: { ...axis2d('x'), scaleanchor: 'y' }, yaxis: axis2d('y') }, info };
    }
    const data: any[] = [{ type: 'surface', x: xs, y: ys, z: Z, colorscale: 'Viridis', opacity: 0.93, contours: { z: { show: true, usecolormap: true, project: { z: true } } }, colorbar: { title: 'z', tickfont: { color: c.fg }, len: 0.6 }, name: 'z = f(x,y)', hovertemplate: 'x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.4f}<extra></extra>' }];
    if (inWin.length) data.push({ type: 'scatter3d', mode: 'markers', x: inWin.map((p) => p.x), y: inWin.map((p) => p.y), z: inWin.map((p) => p.z), name: 'Puntos críticos', marker: { size: 6, color: inWin.map((p) => colorOf(p.type)), line: { width: 2, color: '#fff' } }, text: inWin.map((p) => p.type), hovertemplate: '%{text}<br>(%{x:.4f}, %{y:.4f}, %{z:.4f})<extra></extra>' });
    if (s.tangent) {
      const x0 = num(s.x0), y0 = num(s.y0);
      const fx = fn2(diff(s.fxy, 'x'), extra), fy = fn2(diff(s.fxy, 'y'), extra);
      const z0 = f(x0, y0), ax = fx(x0, y0), ay = fy(x0, y0);
      if ([z0, ax, ay].every(Number.isFinite)) {
        const w = Math.max(R / 3, 0.5);
        const tx = linspace(x0 - w, x0 + w, 12), ty = linspace(y0 - w, y0 + w, 12);
        data.push({ type: 'surface', x: tx, y: ty, z: ty.map((y) => tx.map((x) => z0 + ax * (x - x0) + ay * (y - y0))), showscale: false, opacity: 0.8, colorscale: [[0, '#f59e0b'], [1, '#f59e0b']], name: 'Plano tangente', hoverinfo: 'skip' });
        data.push({ type: 'scatter3d', mode: 'markers', x: [x0], y: [y0], z: [z0], marker: { size: 7, color: c.bad }, name: 'Punto de tangencia', hovertemplate: `(${fmt(x0)}, ${fmt(y0)}, ${fmt(z0, 5)})<extra></extra>` });
        info.push(`Plano tangente: z = ${fmt(z0, 6)} + ${fmt(ax, 6)}(x − ${fmt(x0)}) + ${fmt(ay, 6)}(y − ${fmt(y0)})`);
      } else info.push('No se pudo construir el plano tangente: f no es derivable en ese punto.');
    }
    return { data, layout: { ...base, margin: { l: 0, r: 0, t: 10, b: 0 }, scene: sceneStyle(c, 'x', 'y', 'z') }, info };
  } catch (e) {
    return { data: [], layout: base, info: [], error: e instanceof Error ? e.message : String(e) };
  }
}
const sceneStyle = (c: ReturnType<typeof themeColors>, x: string, y: string, z: string) => ({
  xaxis: { title: x, gridcolor: c.line, color: c.fg, backgroundcolor: 'rgba(0,0,0,0)' }, yaxis: { title: y, gridcolor: c.line, color: c.fg, backgroundcolor: 'rgba(0,0,0,0)' }, zaxis: { title: z, gridcolor: c.line, color: c.fg, backgroundcolor: 'rgba(0,0,0,0)' },
  camera: { eye: { x: 1.6, y: 1.6, z: 0.9 } },
});

function Field({ label, value, onChange, wide, hint }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; hint?: string }) {
  return (
    <label className={wide ? 'col-span-2' : ''}>
      <span className="label">{label}</span>
      <input className="input font-mono" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} aria-label={label} title={hint} />
    </label>
  );
}

export default function Graphs() {
  const [params] = useSearchParams();
  const initial = useMemo(() => {
    const preset = GRAPH_PRESETS.find((p) => p.id === params.get('preset'));
    return { ...DEFAULT_GRAPH, ...(preset?.state ?? {}) } as GraphState;
  }, [params]);
  const [s, setS] = useState<GraphState>(initial);
  const [dark, setDark] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const divRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof GraphState>(k: K, v: GraphState[K]) => setS((o) => ({ ...o, [k]: v }));
  useEffect(() => setS(initial), [initial]);
  useEffect(() => {
    const mo = new MutationObserver(() => setDark((d) => d + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  const built = useMemo(() => build(s, themeColors()), [s, dark]);

  useEffect(() => {
    let cancelled = false;
    loadPlotly().then((Plotly) => {
      if (cancelled || !divRef.current) return;
      (Plotly as any).react(divRef.current, built.data, { ...built.layout, autosize: true }, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['sendDataToCloud'] });
      setStatus('ready');
    }).catch(() => setStatus('error'));
    return () => { cancelled = true; };
  }, [built]);
  useEffect(() => () => { loadPlotly().then((P) => divRef.current && (P as any).purge(divRef.current)).catch(() => undefined); }, []);

  const png = async () => { const P: any = await loadPlotly(); if (divRef.current) P.downloadImage(divRef.current, { format: 'png', filename: `atlas-${s.mode}`, width: 1400, height: 900, scale: 2 }); };
  const needsXY = s.mode === 'surface' || s.mode === 'contour';

  return (
    <div>
      <PageHeader eyebrow="Laboratorio" title="Laboratorio de gráficas" desc="Funciones 2D, superficies 3D, curvas de nivel, superficies de revolución, regiones de integración, planos tangentes, centros de masa y puntos críticos. Todo se calcula en tu navegador con Plotly y mathjs." />
      <div className="grid xl:grid-cols-[22rem_1fr] gap-5">
        <div className="card p-4 space-y-4 self-start">
          <div>
            <span className="label">Tipo de gráfica</span>
            <div className="flex flex-wrap gap-2">{MODES.map((m) => <button key={m.id} onClick={() => set('mode', m.id)} aria-pressed={s.mode === m.id} className={`chip cursor-pointer ${s.mode === m.id ? '!bg-brand !text-brandfg' : ''}`}>{m.label}</button>)}</div>
          </div>
          <div>
            <span className="label">Ejemplos del folleto</span>
            <select className="input" value="" onChange={(e) => { const p = GRAPH_PRESETS.find((x) => x.id === e.target.value); if (p) setS({ ...DEFAULT_GRAPH, ...p.state } as GraphState); }} aria-label="Cargar ejemplo">
              <option value="">Cargar un ejemplo…</option>
              {GRAPH_PRESETS.map((p) => <option key={p.id} value={p.id}>Tema {p.chapter}: {p.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {needsXY && <Field wide label="z = f(x, y)" value={s.fxy} onChange={(v) => set('fxy', v)} hint="Use x, y, y parámetros p, q, k" />}
            {needsXY && <Field label="Ventana ±R" value={s.R} onChange={(v) => set('R', v)} />}
            {s.mode === 'curve2d' && (<>
              <Field wide label="f₁(x)" value={s.f1} onChange={(v) => set('f1', v)} /><Field wide label="f₂(x) (comparar, opcional)" value={s.f2} onChange={(v) => set('f2', v)} /><Field wide label="f₃(x) (opcional)" value={s.f3} onChange={(v) => set('f3', v)} />
              <Field label="Ventana ±R" value={s.R} onChange={(v) => set('R', v)} /><span />
              <Field label="a" value={s.a} onChange={(v) => set('a', v)} /><Field label="b" value={s.b} onChange={(v) => set('b', v)} />
            </>)}
            {s.mode === 'revolution' && (<>
              <Field wide label="y = f(x)" value={s.f1} onChange={(v) => set('f1', v)} /><Field label="a" value={s.a} onChange={(v) => set('a', v)} /><Field label="b" value={s.b} onChange={(v) => set('b', v)} />
              <label className="col-span-2"><span className="label">Eje de giro</span><select className="input" value={s.axis} onChange={(e) => set('axis', e.target.value as 'x' | 'y')}><option value="x">Eje x</option><option value="y">Eje y</option></select></label>
            </>)}
            {s.mode === 'region' && (<>
              <Field label="y inferior g₁(x)" value={s.g1} onChange={(v) => set('g1', v)} /><Field label="y superior g₂(x)" value={s.g2} onChange={(v) => set('g2', v)} />
              <Field label="a" value={s.a} onChange={(v) => set('a', v)} /><Field label="b" value={s.b} onChange={(v) => set('b', v)} />
              <Field wide label="Densidad ρ(x,y) (vacío = uniforme)" value={s.rho} onChange={(v) => set('rho', v)} />
            </>)}
          </div>
          {(['p', 'q', 'k'] as const).map((n) => (
            <label key={n} className="block"><span className="label">Parámetro {n} = {s[n].toFixed(1)} <span className="font-normal">(úsalo en las fórmulas)</span></span>
              <input type="range" min={-5} max={5} step={0.1} value={s[n]} onChange={(e) => set(n, parseFloat(e.target.value))} className="w-full accent-[var(--violet)]" aria-label={`Parámetro ${n}`} /></label>
          ))}
          <div className="space-y-2 text-sm">
            {s.mode === 'surface' && <label className="flex items-center gap-2"><input type="checkbox" checked={s.tangent} onChange={(e) => set('tangent', e.target.checked)} /> Plano tangente en (x₀, y₀)</label>}
            {s.mode === 'surface' && s.tangent && <div className="grid grid-cols-2 gap-3"><Field label="x₀" value={s.x0} onChange={(v) => set('x0', v)} /><Field label="y₀" value={s.y0} onChange={(v) => set('y0', v)} /></div>}
            {needsXY && <label className="flex items-center gap-2"><input type="checkbox" checked={s.critical} onChange={(e) => set('critical', e.target.checked)} /> Mostrar puntos críticos</label>}
            {s.mode === 'curve2d' && <label className="flex items-center gap-2"><input type="checkbox" checked={s.roots} onChange={(e) => set('roots', e.target.checked)} /> Raíces y extremos de f₁</label>}
            {s.mode === 'curve2d' && <label className="flex items-center gap-2"><input type="checkbox" checked={s.shade} onChange={(e) => set('shade', e.target.checked)} /> Sombrear entre f₁ y f₂ en [a, b]</label>}
            <label className="flex items-center gap-2"><input type="checkbox" checked={s.coords} onChange={(e) => set('coords', e.target.checked)} /> Mostrar coordenadas al pasar el cursor</label>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={png}><Download className="w-4 h-4" /> Exportar PNG</button>
            <button className="btn btn-ghost" onClick={() => setS(DEFAULT_GRAPH)} aria-label="Restablecer"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="card p-2 relative">
            {status === 'loading' && <div className="absolute inset-0 grid place-items-center"><Spinner label="Cargando Plotly…" /></div>}
            {status === 'error' && <p className="p-6 text-bad">No se pudo cargar el motor gráfico.</p>}
            {built.error && <p className="p-4 text-sm text-bad" role="alert">Error en la expresión: {built.error}</p>}
            <div ref={divRef} className="w-full h-[62vh] min-h-[380px]" role="img" aria-label="Gráfica interactiva" />
          </div>
          <div className="card p-4 text-sm space-y-1">
            <p className="font-semibold flex items-center gap-2 text-brandtext"><Eye className="w-4 h-4" /> Lectura de la gráfica</p>
            {built.info.length ? built.info.map((t, i) => <p key={i} className="font-mono text-[13px]">{t}</p>) : <p className="text-muted">Arrastra para rotar (3D), rueda del ratón para acercar y alejar; pasa el cursor sobre un punto para ver sus coordenadas.</p>}
            {s.mode === 'surface' && <p className="text-muted pt-1">Superficie: <Tex x={`z=${s.fxy.replace(/\^/g, '^').replace(/\*/g, '\\cdot ')}`} /></p>}
          </div>
        </div>
      </div>
    </div>
  );
}
