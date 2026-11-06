import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Calculator, Check, CheckCircle2, Eye, Lightbulb, RefreshCw, Sigma, Star, X } from 'lucide-react';
import { chapterById, difficultyOf, formulasOf, solutionFor, type Exercise } from '../data/atlas';
import { Blocks, Rich } from './Rich';
import { levelColor } from './ui';
import { checkNumbers, type Verdict } from '../lib/check';
import { actions, useStore } from '../lib/storage';
import { VARIANT_FAMILIES, familyForExercise, makeVariant, type Variant } from '../lib/variants';

export default function ExerciseView({ ex }: { ex: Exercise }) {
  const sol = solutionFor(ex.id)!;
  const fav = useStore((s) => s.favorites.includes(ex.id));
  const attempt = useStore((s) => s.attempts[ex.id]);
  const [hints, setHints] = useState(0);
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showSol, setShowSol] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  useEffect(() => { setHints(0); setInput(''); setVerdict(null); setShowSol(false); setShowFormulas(false); actions.markViewed(ex.id); }, [ex.id]);

  const ch = chapterById(ex.chapter);
  const solverQ = sol.solver ? new URLSearchParams({ cat: sol.solver.cat, ...sol.solver.inputs, run: '1' }).toString() : '';
  const submit = () => {
    const v = checkNumbers(sol.check, input);
    setVerdict(v);
    if (v.ok !== null) { actions.record(ex.id, v.ok); actions.log({ type: 'ejercicio', label: `Ejercicio ${ex.id}: ${v.ok ? 'correcto' : 'incorrecto'}`, ref: ex.id }); }
  };
  const selfEval = (ok: boolean) => { actions.record(ex.id, ok); actions.log({ type: 'ejercicio', label: `Ejercicio ${ex.id}: ${ok ? 'resuelto' : 'por repasar'}`, ref: ex.id }); setVerdict({ ok, message: ok ? 'Registrado como resuelto.' : 'Registrado para repasar.' }); };

  return (
    <article className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`chip ${levelColor(ex.level)}`}>Nivel PISA {ex.level}</span>
          <span className="chip">{difficultyOf(ex.level)}</span>
          <Link className="chip hover:underline" to={`/tema/${ex.chapter}`}>Tema {ch.num}</Link>
          <span className="text-xs text-muted">Ejercicio {ex.id} · {ex.levelName}</span>
          <button className="ml-auto btn btn-ghost !p-2" onClick={() => actions.toggleFavorite(ex.id)} aria-pressed={fav} aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}><Star className={`w-4 h-4 ${fav ? 'fill-gold text-gold' : ''}`} /></button>
        </div>
        <div className="text-lg"><Blocks blocks={[{ t: 'p', x: ex.text }]} /></div>
        {attempt?.solved && <p className="mt-2 text-sm text-ok flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Ya lo resolviste ({attempt.correct} acierto(s) en {attempt.n} intento(s)).</p>}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold flex items-center gap-2 text-brandtext"><Check className="w-4 h-4" /> Tu respuesta</h3>
        {sol.check.kind === 'numbers' ? (
          <form className="mt-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <label className="label"><Rich x={sol.check.prompt} /> — separa con comas si hay varios valores; admite <code>pi</code>, <code>sqrt(2)</code>, fracciones</label>
            <div className="flex gap-2"><input className="input font-mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ej.: 2.5, pi/2" spellCheck={false} /><button className="btn btn-primary" type="submit">Comprobar</button></div>
          </form>
        ) : (
          <p className="text-sm text-muted mt-2">Esta respuesta es abierta (planteamiento, demostración o interpretación) y no puede validarse automáticamente. Escríbela en tu cuaderno, revisa la solución verificada y autoevalúate.</p>
        )}
        {verdict && <p role="status" className={`mt-3 text-sm font-semibold flex items-center gap-2 ${verdict.ok === true ? 'text-ok' : verdict.ok === false ? 'text-bad' : 'text-muted'}`}>{verdict.ok === true ? <CheckCircle2 className="w-4 h-4" /> : verdict.ok === false ? <X className="w-4 h-4" /> : null}{verdict.message}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold flex items-center gap-2 text-brandtext"><Lightbulb className="w-4 h-4" /> Pistas ({hints}/3)</h3>
          <ol className="mt-2 space-y-2 text-sm list-decimal ml-5">{sol.hints.slice(0, hints).map((h, i) => <li key={i}><Rich x={h} /></li>)}</ol>
          {hints < 3 && <button className="btn btn-ghost mt-3" onClick={() => setHints(hints + 1)}><Lightbulb className="w-4 h-4" /> {hints === 0 ? 'Pedir una pista' : 'Otra pista'}</button>}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold flex items-center gap-2 text-brandtext"><Sigma className="w-4 h-4" /> Fórmulas del tema {ch.num}</h3>
          <button className="btn btn-ghost mt-3" onClick={() => setShowFormulas(!showFormulas)}><Eye className="w-4 h-4" /> {showFormulas ? 'Ocultar' : 'Consultar fórmulas'}</button>
          {showFormulas && <Blocks className="mt-2" blocks={formulasOf(ch).map((x) => ({ t: 'formula', x }))} />}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold flex items-center gap-2 text-brandtext"><CheckCircle2 className="w-4 h-4" /> Solución verificada</h3>
        {!showSol ? <button className="btn btn-ghost mt-3" onClick={() => setShowSol(true)}><Eye className="w-4 h-4" /> Ver solución</button> : (
          <div className="mt-3 space-y-3">
            <div className="enun-box"><b>Respuesta: </b><Rich as="div" x={sol.answer} /></div>
            <ul className="list-disc ml-5 text-sm space-y-1">{sol.steps.map((s, i) => <li key={i}><Rich x={s} /></li>)}</ul>
            {sol.solver && <p className="text-xs text-muted">Contrastada con el motor matemático de la plataforma (prueba automática del Resolutor).</p>}
            {sol.check.kind === 'self' && (
              <div className="flex flex-wrap items-center gap-2 pt-1"><span className="text-sm">¿Tu planteamiento coincide?</span>
                <button className="btn btn-primary" onClick={() => selfEval(true)}><Check className="w-4 h-4" /> Lo resolví</button>
                <button className="btn btn-ghost" onClick={() => selfEval(false)}>Necesito repasar</button></div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4 no-print">
          {sol.solver && <Link className="btn btn-ghost" to={`/resolutor?${solverQ}`}><Calculator className="w-4 h-4" /> Abrir en el Resolutor</Link>}
          <Link className="btn btn-ghost" to={`/tutor?q=${encodeURIComponent(`Explícame el ejercicio ${ex.id}`)}`}><Bot className="w-4 h-4" /> Preguntar al tutor</Link>
        </div>
      </div>
      <VariantPanel base={ex.id} />
    </article>
  );
}

function VariantPanel({ base }: { base: string }) {
  const fam = familyForExercise(base);
  const [family, setFamily] = useState(fam ?? VARIANT_FAMILIES[0].id);
  const [v, setV] = useState<Variant | null>(null);
  const [show, setShow] = useState(false);
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setFamily(fam ?? VARIANT_FAMILIES[0].id); setV(null); setShow(false); setInput(''); setMsg(null); }, [base, fam]);
  const gen = () => { try { setV(makeVariant(family, Math.floor(Math.random() * 1e9))); setShow(false); setInput(''); setMsg(null); setErr(null); } catch (e) { setErr((e as Error).message); } };
  const check = useMemo(() => v ? { kind: 'numbers' as const, values: v.value, prompt: '' } : null, [v]);
  return (
    <div className="card p-5">
      <h3 className="font-semibold flex items-center gap-2 text-brandtext"><RefreshCw className="w-4 h-4" /> Generar variante con parámetros comprobados</h3>
      <p className="text-sm text-muted mt-1">Cambia los parámetros del problema; la respuesta se calcula con fórmula cerrada y se contrasta con el motor numérico antes de mostrarse.</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <select className="input w-full sm:!w-auto min-w-0 max-w-full" value={family} onChange={(e) => setFamily(e.target.value)} aria-label="Familia de variantes">{VARIANT_FAMILIES.map((f) => <option key={f.id} value={f.id}>Ej. {f.base} — {f.label.replace(/\$/g, '')}</option>)}</select>
        <button className="btn btn-primary" onClick={gen}><RefreshCw className="w-4 h-4" /> Nueva variante</button>
      </div>
      {err && <p className="text-bad text-sm mt-2">{err}</p>}
      {v && (
        <div className="mt-4 space-y-3">
          <div className="enun-box"><Rich x={v.statement} /></div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (check) setMsg(checkNumbers({ ...check, tol: 5e-3 }, input).message); }}>
            <input className="input font-mono" placeholder={`Tu respuesta (${v.value.length} valor${v.value.length > 1 ? 'es' : ''}, separados por coma)`} value={input} onChange={(e) => setInput(e.target.value)} /><button className="btn btn-ghost">Comprobar</button>
          </form>
          {msg && <p className="text-sm font-semibold" role="status">{msg}</p>}
          <button className="btn btn-ghost" onClick={() => setShow(!show)}><Eye className="w-4 h-4" /> {show ? 'Ocultar solución' : 'Ver solución'}</button>
          {show && <div className="space-y-2"><Rich as="div" x={v.answer} /><ul className="list-disc ml-5 text-sm">{v.steps.map((s, i) => <li key={i}><Rich x={s} /></li>)}</ul><p className="text-xs text-muted">Verificada por: {v.verifiedBy}.</p></div>}
        </div>
      )}
    </div>
  );
}
