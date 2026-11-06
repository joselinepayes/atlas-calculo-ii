import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bot, CheckCircle2, Play, Sparkles, XCircle } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { Blocks, Rich, Tex } from '../components/Rich';
import { CATEGORIES, getCategory, type Item, type SolveResult } from '../lib/math/solver';
import { actions } from '../lib/storage';

const PHASE_STYLE = ['border-sky-500', 'border-amber-500', 'border-violet', 'border-emerald-500'];
const PHASES = ['Comprender el problema', 'Concebir un plan', 'Ejecutar el plan', 'Visión retrospectiva'];

function ItemView({ it }: { it: Item }) {
  if (it.kind === 'math') return <div className="math-display my-1"><Tex x={it.x} display /></div>;
  if (it.kind === 'note') return <p className="text-sm text-muted italic"><Rich x={it.x} /></p>;
  if (it.kind === 'table') return <Blocks blocks={[{ t: 'table', rows: it.rows.map((r, i) => (i === 0 ? r.map((c) => `**${c}**`) : r)) }]} />;
  return <p className="my-1"><Rich x={it.x} /></p>;
}

export function ResultView({ r }: { r: SolveResult }) {
  if (!r.ok) {
    return (
      <div className="card p-5 border-bad" role="alert">
        <p className="font-semibold text-bad flex items-center gap-2"><XCircle className="w-5 h-5" /> No se puede resolver de manera confiable</p>
        <p className="mt-2">{r.error}</p>
        {r.limitations.map((l, i) => <p key={i} className="mt-2 text-sm text-muted">{l}</p>)}
        <p className="mt-3 text-sm">Sugerencia: pruebe un ejemplo compatible con el botón <b>Cargar ejemplo</b> o consulte la teoría relacionada en el <Link className="underline" to="/tutor">Atlas Tutor</Link>.</p>
      </div>
    );
  }
  const phases = PHASES.map((p) => ({ p, secs: r.sections.filter((s) => s.phase === p) }));
  const allPass = r.checks.length > 0 && r.checks.every((c) => c.pass);
  return (
    <div className="space-y-4">
      <div className="card p-5 bg-gradient-to-br from-lav to-surface">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Resultado</p>
        <h2 className="font-display text-2xl font-bold text-brandtext">{r.title}</h2>
        {r.answer && <div className="mt-2 text-lg"><Tex x={r.answer} display /></div>}
        {r.checks.length > 0 && (
          <p className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold ${allPass ? 'text-ok' : 'text-bad'}`}>
            {allPass ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {allPass ? `Verificado por ${r.checks.length} método(s) independiente(s)` : 'Las verificaciones no coinciden: no confíe en este resultado sin revisarlo'}
          </p>
        )}
      </div>
      {r.limitations.length > 0 && (
        <div className="card p-4 border-gold bg-goldsoft" role="note">
          <p className="font-semibold flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-gold" /> Alcance y limitaciones</p>
          <ul className="list-disc ml-5 mt-1 text-sm space-y-1">{r.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
      )}
      {phases.map(({ p, secs }, i) => (
        <div key={p} className={`card p-5 border-l-4 ${PHASE_STYLE[i]}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Fase {i + 1} de Pólya</p>
          <h3 className="font-display text-xl font-bold text-brandtext mb-2">{p}</h3>
          {secs.map((s) => (
            <div key={s.key} className="mt-3">
              <h4 className="font-semibold text-sm text-brandtext">{s.title}</h4>
              <div className="atlas-prose">{s.items.length ? s.items.map((it, k) => <ItemView key={k} it={it} />) : <p className="text-muted text-sm">—</p>}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Solver() {
  const [params, setParams] = useSearchParams();
  const catId = params.get('cat') ?? CATEGORIES[0].id;
  const cat = getCategory(catId) ?? CATEGORIES[0];
  const initial = useMemo(() => Object.fromEntries(cat.fields.map((f) => [f.key, params.get(f.key) ?? f.default])), [cat, params]);
  const [vals, setVals] = useState<Record<string, string>>(initial);
  const [res, setRes] = useState<SolveResult | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setVals(initial); setRes(null); }, [initial]);

  const run = (v = vals) => {
    setBusy(true);
    setTimeout(() => {
      const r = cat.solve(v);
      setRes(r); setBusy(false);
      actions.log({ type: 'resolutor', label: `${cat.label}: ${Object.values(v).filter(Boolean).slice(0, 2).join(' · ')}`, ref: cat.id });
    }, 30);
  };
  // abre con resultado si viene de un ejercicio/ejemplo (?run=1)
  useEffect(() => { if (params.get('run') === '1') run(initial); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [initial]);

  return (
    <div>
      <PageHeader eyebrow="Herramienta" title="Resolutor paso a paso" desc="Cada categoría usa un procedimiento verificado y organiza el resultado con el método de Pólya. Si un problema no puede resolverse de forma confiable, la herramienta lo dice en lugar de inventar pasos." />
      <div className="grid lg:grid-cols-[20rem_1fr] gap-5">
        <div className="space-y-4 self-start">
          <div className="card p-3">
            <p className="label px-1">Tipo de problema</p>
            <div className="flex flex-col">{CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setParams({ cat: c.id })} aria-pressed={c.id === cat.id}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${c.id === cat.id ? 'bg-brand text-brandfg font-semibold' : 'hover:bg-lav'}`}>
                {c.label}<span className={`block text-[11px] ${c.id === cat.id ? 'text-white/80' : 'text-muted'}`}>Tema{c.chapters.length > 1 ? 's' : ''} {c.chapters.join(', ')}</span>
              </button>))}
            </div>
          </div>
        </div>

        <div className="space-y-5 min-w-0">
          <form className="card p-5" onSubmit={(e) => { e.preventDefault(); run(); }}>
            <h2 className="font-display text-xl font-bold text-brandtext">{cat.label}</h2>
            <p className="text-sm text-muted mb-4">{cat.description}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {cat.fields.map((f) => (
                <label key={f.key} className={f.key === 'f' || f.key === 'rho' ? 'sm:col-span-2' : ''}>
                  <span className="label">{f.label}{f.hint ? <span className="font-normal"> — {f.hint}</span> : null}</span>
                  {f.select ? (
                    <select className="input" value={vals[f.key] ?? f.default} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}>{f.select.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  ) : (
                    <input className="input font-mono" value={vals[f.key] ?? ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} spellCheck={false} autoComplete="off" />
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted mt-3">Sintaxis: <code>x^2</code>, <code>sqrt(x)</code>, <code>sin(x)</code>, <code>exp(x)</code>, <code>ln(x)</code>, <code>pi</code>; escriba <code>x*y</code> para productos y <code>inf</code> para ∞.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary" disabled={busy}><Play className="w-4 h-4" /> {busy ? 'Calculando…' : 'Resolver'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setVals(Object.fromEntries(cat.fields.map((f) => [f.key, f.default]))); setRes(null); }}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>
              <Link className="btn btn-ghost" to={`/tutor?q=${encodeURIComponent(cat.label)}`}><Bot className="w-4 h-4" /> Preguntar al tutor</Link>
            </div>
          </form>
          {res && <ResultView r={res} />}
          {!res && <p className="text-sm text-muted">Pulse <b>Resolver</b> para ver el desarrollo completo: problema original, datos, fórmula, sustitución, operaciones, resultado, comprobación e interpretación.</p>}
        </div>
      </div>
    </div>
  );
}
