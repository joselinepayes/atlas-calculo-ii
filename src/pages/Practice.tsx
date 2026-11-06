import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Flag, GraduationCap, Lightbulb, Play, RotateCcw, Timer, X } from 'lucide-react';
import { EXERCISES, PISA_LEVELS, SHORT, chapterById, formulasOf, solutionFor, type Exercise } from '../data/atlas';
import { checkNumbers } from '../lib/check';
import { actions, type ExamAnswer } from '../lib/storage';
import { Blocks, Rich } from '../components/Rich';
import { PageHeader, levelColor } from '../components/ui';

type Phase = 'config' | 'run' | 'review' | 'done';
interface Ans { given: string; auto: boolean | null; self: boolean | null; hints: number }
const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Practice() {
  const [phase, setPhase] = useState<Phase>('config');
  const [mode, setMode] = useState<'practica' | 'examen'>('practica');
  const [chapters, setChapters] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [levels, setLevels] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [count, setCount] = useState(10);
  const [timerOn, setTimerOn] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [qs, setQs] = useState<Exercise[]>([]);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<Record<string, Ans>>({});
  const [left, setLeft] = useState(0);
  const [started, setStarted] = useState(0);
  const [input, setInput] = useState('');
  const [fb, setFb] = useState<string | null>(null);
  const [showSol, setShowSol] = useState(false);
  const [showF, setShowF] = useState(false);
  const [hints, setHints] = useState(0);

  const pool = useMemo(() => EXERCISES.filter((e) => chapters.includes(e.chapter) && levels.includes(e.level)), [chapters, levels]);
  const cur = qs[idx];
  const toggle = (arr: number[], v: number, set: (a: number[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v].sort((a, b) => a - b));

  const start = () => {
    const sel = shuffle(pool).slice(0, Math.min(count, pool.length));
    setQs(sel); setIdx(0); setAns({}); setInput(''); setFb(null); setShowSol(false); setShowF(false); setHints(0);
    setLeft(minutes * 60); setStarted(Date.now()); setPhase('run');
  };
  const saveCurrent = (): Record<string, Ans> => {
    if (!cur) return ans;
    const sol = solutionFor(cur.id)!;
    const blank = !input.trim();
    const v = blank ? { ok: false as boolean | null } : checkNumbers(sol.check, input);
    const next = { ...ans, [cur.id]: { given: input, auto: blank ? false : sol.check.kind === 'numbers' ? v.ok : null, self: ans[cur.id]?.self ?? null, hints: Math.max(hints, ans[cur.id]?.hints ?? 0) } };
    setAns(next);
    return next;
  };
  const go = (to: number) => {
    const a = saveCurrent();
    const nxt = qs[to];
    setIdx(to); setInput(a[nxt?.id]?.given ?? ''); setFb(null); setShowSol(false); setShowF(false); setHints(a[nxt?.id]?.hints ?? 0);
  };
  const finish = () => {
    const a = saveCurrent();
    const needReview = qs.some((q) => a[q.id]?.auto === null);
    setPhase(needReview ? 'review' : 'done');
    if (!needReview) record(a);
  };
  const outcome = (q: Exercise, a: Record<string, Ans>): boolean | null => { const x = a[q.id]; if (!x) return false; if (x.auto !== null) return x.auto; return x.self; };
  const record = (a: Record<string, Ans>) => {
    const answers: ExamAnswer[] = qs.map((q) => ({ id: q.id, given: a[q.id]?.given ?? '', correct: outcome(q, a), chapter: q.chapter, level: q.level }));
    qs.forEach((q) => { const o = outcome(q, a); if (o !== null) actions.record(q.id, o); });
    actions.addExam({ t: Date.now(), mode, chapters, levels, total: qs.length, correct: answers.filter((x) => x.correct).length, seconds: Math.round((Date.now() - started) / 1000), answers });
    actions.log({ type: mode === 'examen' ? 'examen' : 'practica', label: `${mode === 'examen' ? 'Examen' : 'Práctica'}: ${answers.filter((x) => x.correct).length}/${qs.length} correctas` });
  };

  const finishRef = useRef(finish); finishRef.current = finish;
  useEffect(() => {
    if (phase !== 'run' || !timerOn) return;
    const t = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(t); setTimeout(() => finishRef.current(), 0); return 0; } return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase, timerOn]);

  /* ----------------------------- configuración ----------------------------- */
  if (phase === 'config') {
    return (
      <div className="max-w-4xl">
        <PageHeader eyebrow="Preparación" title="Práctica y examen final" desc="Elige capítulos, niveles PISA y cantidad de preguntas. En práctica tienes pistas y soluciones; en examen se ocultan, se registran tus respuestas y se evalúa al final." />
        <div className="card p-5 space-y-6">
          <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Modo">
            {([['practica', 'Modo práctica', 'Pistas, fórmulas, explicaciones, solución paso a paso y comprobación inmediata.', GraduationCap], ['examen', 'Modo examen', 'Sin pistas ni soluciones. Se registran tus respuestas y se evalúa al final.', Flag]] as const).map(([id, t, d, Ic]) => (
              <button key={id} role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={`text-left p-4 rounded-xl border-2 transition-colors ${mode === id ? 'border-violet bg-lav' : 'border-line hover:border-violet/50'}`}>
                <span className="font-semibold flex items-center gap-2 text-brandtext"><Ic className="w-5 h-5" /> {t}</span><span className="block text-sm text-muted mt-1">{d}</span>
              </button>))}
          </div>
          <fieldset><legend className="label">Capítulos <button className="underline ml-2" onClick={() => setChapters(chapters.length === 10 ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}>{chapters.length === 10 ? 'ninguno' : 'todos'}</button></legend>
            <div className="flex flex-wrap gap-2">{Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <button key={c} aria-pressed={chapters.includes(c)} onClick={() => toggle(chapters, c, setChapters)} className={`chip cursor-pointer ${chapters.includes(c) ? '!bg-brand !text-brandfg' : ''}`} title={SHORT[c]}>Tema {String(c).padStart(2, '0')}</button>)}</div></fieldset>
          <fieldset><legend className="label">Niveles PISA</legend>
            <div className="flex flex-wrap gap-2">{PISA_LEVELS.map((l) => <button key={l.level} aria-pressed={levels.includes(l.level)} onClick={() => toggle(levels, l.level, setLevels)} className={`chip cursor-pointer ${levels.includes(l.level) ? '!bg-brand !text-brandfg' : ''}`} title={l.name}>Nivel {l.level}</button>)}</div></fieldset>
          <div className="grid sm:grid-cols-2 gap-5">
            <label><span className="label">Cantidad de preguntas: {Math.min(count, pool.length)} (disponibles: {pool.length})</span>
              <input type="range" min={1} max={Math.max(1, pool.length)} value={Math.min(count, Math.max(1, pool.length))} onChange={(e) => setCount(+e.target.value)} className="w-full accent-[var(--violet)]" disabled={!pool.length} /></label>
            <div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={timerOn} onChange={(e) => setTimerOn(e.target.checked)} /> <Timer className="w-4 h-4" /> Temporizador</label>
              {timerOn && <label className="block mt-2"><span className="label">Minutos totales</span><input type="number" min={1} max={300} className="input" value={minutes} onChange={(e) => setMinutes(Math.max(1, +e.target.value))} /></label>}</div>
          </div>
          <button className="btn btn-primary" disabled={!pool.length} onClick={start}><Play className="w-4 h-4" /> Iniciar {mode === 'examen' ? 'examen' : 'práctica'}</button>
          {!pool.length && <p className="text-sm text-bad">Selecciona al menos un capítulo y un nivel.</p>}
        </div>
      </div>
    );
  }

  /* ----------------------------- ejecución ----------------------------- */
  if (phase === 'run' && cur) {
    const sol = solutionFor(cur.id)!;
    const exam = mode === 'examen';
    const answered = qs.filter((q) => (ans[q.id]?.given ?? '').trim() || q.id === cur.id && input.trim()).length;
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="chip">{exam ? 'Examen' : 'Práctica'}</span><span className="text-sm text-muted">Pregunta {idx + 1} de {qs.length} · respondidas {answered}</span>
          {timerOn && <span className={`ml-auto chip ${left < 60 ? '!text-bad' : ''}`} role="timer" aria-label="Tiempo restante"><Clock className="w-3.5 h-3.5" /> {mmss(left)}</span>}
        </div>
        <div className="h-1.5 rounded-full bg-lav mb-5"><div className="h-full bg-gold rounded-full transition-all" style={{ width: `${((idx + 1) / qs.length) * 100}%` }} /></div>
        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted mb-2"><span className={`chip ${levelColor(cur.level)}`}>Nivel {cur.level}</span> Tema {cur.chapter} · {SHORT[cur.chapter]} {!exam && <span>· ej. {cur.id}</span>}</div>
          <div className="text-lg"><Blocks blocks={[{ t: 'p', x: cur.text }]} /></div>
          <form className="mt-4" onSubmit={(e) => { e.preventDefault(); if (!exam && sol.check.kind === 'numbers') setFb(checkNumbers(sol.check, input).message); }}>
            {sol.check.kind === 'numbers' ? <label className="label"><Rich x={sol.check.prompt} /> (comas si hay varios)</label> : <label className="label">Tu respuesta o planteamiento (se revisará con una autoevaluación guiada)</label>}
            {sol.check.kind === 'numbers' ? <input className="input font-mono" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} /> : <textarea className="input min-h-24" value={input} onChange={(e) => setInput(e.target.value)} />}
            {!exam && sol.check.kind === 'numbers' && <button className="btn btn-primary mt-3">Comprobar</button>}
            {fb && !exam && <p className="mt-2 text-sm font-semibold" role="status">{fb}</p>}
          </form>
          {!exam && (
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-ghost" disabled={hints >= 3} onClick={() => setHints(hints + 1)}><Lightbulb className="w-4 h-4" /> Pista ({hints}/3)</button>
                <button className="btn btn-ghost" onClick={() => setShowF(!showF)}>Fórmulas</button>
                <button className="btn btn-ghost" onClick={() => setShowSol(!showSol)}>{showSol ? 'Ocultar' : 'Resolver paso a paso'}</button>
              </div>
              {hints > 0 && <ol className="list-decimal ml-5 text-sm space-y-1">{sol.hints.slice(0, hints).map((h, i) => <li key={i}><Rich x={h} /></li>)}</ol>}
              {showF && <Blocks blocks={formulasOf(chapterById(cur.chapter)).map((x) => ({ t: 'formula', x }))} />}
              {showSol && <div className="enun-box"><b>Respuesta:</b> <Rich as="div" x={sol.answer} /><ul className="list-disc ml-5 mt-2 text-sm">{sol.steps.map((s, i) => <li key={i}><Rich x={s} /></li>)}</ul></div>}
            </div>
          )}
        </div>
        <div className="flex justify-between mt-5">
          <button className="btn btn-ghost" disabled={idx === 0} onClick={() => go(idx - 1)}>← Anterior</button>
          {idx < qs.length - 1 ? <button className="btn btn-primary" onClick={() => go(idx + 1)}>Siguiente <ArrowRight className="w-4 h-4" /></button> : <button className="btn btn-gold" onClick={finish}><Flag className="w-4 h-4" /> Terminar</button>}
        </div>
        <button className="text-xs text-muted underline mt-4" onClick={() => { if (confirm('¿Terminar ahora y evaluar?')) finish(); }}>Terminar ahora</button>
      </div>
    );
  }

  /* ----------------------------- revisión guiada ----------------------------- */
  if (phase === 'review') {
    const open = qs.filter((q) => ans[q.id]?.auto === null);
    const pending = open.filter((q) => ans[q.id]?.self === null || ans[q.id]?.self === undefined);
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader eyebrow="Examen" title="Revisión guiada" desc="Estas respuestas no pueden validarse automáticamente. Compara con la respuesta de referencia y marca si tu respuesta era correcta." />
        <div className="space-y-4">
          {open.map((q) => { const s = solutionFor(q.id)!; const a = ans[q.id]; return (
            <div key={q.id} className="card p-5">
              <p className="text-xs text-muted mb-1">Tema {q.chapter} · Nivel {q.level}</p>
              <Blocks blocks={[{ t: 'p', x: q.text }]} />
              <p className="label mt-3">Tu respuesta</p><p className="text-sm whitespace-pre-wrap rounded-lg bg-surface2 p-2">{a?.given.trim() || <i className="text-muted">(en blanco)</i>}</p>
              <p className="label mt-3">Respuesta de referencia</p><div className="enun-box text-sm"><Rich as="div" x={s.answer} /></div>
              <div className="flex gap-2 mt-3"><button className={`btn ${a?.self === true ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAns((p) => ({ ...p, [q.id]: { ...p[q.id], self: true } }))}><CheckCircle2 className="w-4 h-4" /> Correcta</button><button className={`btn ${a?.self === false ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAns((p) => ({ ...p, [q.id]: { ...p[q.id], self: false } }))}><X className="w-4 h-4" /> Incorrecta</button></div>
            </div>); })}
        </div>
        <button className="btn btn-gold mt-5" disabled={pending.length > 0} onClick={() => { record(ans); setPhase('done'); }}>{pending.length ? `Faltan ${pending.length} por evaluar` : 'Ver resultados'}</button>
      </div>
    );
  }

  /* ----------------------------- resultados ----------------------------- */
  const results = qs.map((q) => ({ q, ok: outcome(q, ans) }));
  const correct = results.filter((r) => r.ok).length;
  const pct = qs.length ? (correct / qs.length) * 100 : 0;
  const weak = Object.entries(results.filter((r) => !r.ok).reduce<Record<number, number>>((m, r) => ({ ...m, [r.q.chapter]: (m[r.q.chapter] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader eyebrow={mode === 'examen' ? 'Examen finalizado' : 'Práctica finalizada'} title={`${correct} de ${qs.length} correctas (${Math.round(pct)}%)`} desc={`Tiempo empleado: ${mmss(Math.round((Date.now() - started) / 1000))}. Los resultados quedaron guardados en tu progreso.`} />
      <div className="card p-5">
        <h2 className="font-semibold text-brandtext mb-3">Detalle por pregunta</h2>
        <ul className="space-y-3">{results.map(({ q, ok }) => (
          <li key={q.id} className="flex gap-3 items-start">
            {ok ? <CheckCircle2 className="w-5 h-5 text-ok shrink-0 mt-0.5" aria-label="Correcta" /> : <X className="w-5 h-5 text-bad shrink-0 mt-0.5" aria-label="Incorrecta" />}
            <div className="min-w-0 text-sm"><p className="text-xs text-muted">Tema {q.chapter} · Nivel {q.level} · ej. {q.id}</p><p className="line-clamp-2"><Rich x={q.text} /></p>
              {!ok && <details className="mt-1"><summary className="cursor-pointer text-brandtext font-semibold">Ver respuesta correcta</summary><div className="enun-box mt-1"><Rich as="div" x={solutionFor(q.id)!.answer} /></div></details>}</div>
          </li>))}</ul>
      </div>
      <div className="card p-5">
        <h2 className="font-semibold text-brandtext mb-2">Temas recomendados para estudiar</h2>
        {weak.length ? <ul className="space-y-2">{weak.map(([c, n]) => <li key={c} className="flex items-center justify-between gap-3 text-sm"><span>Tema {String(c).padStart(2, '0')} · {SHORT[+c]} <span className="text-muted">({n} error{n > 1 ? 'es' : ''})</span></span><Link className="btn btn-ghost !py-1" to={`/tema/${c}`}>Repasar</Link></li>)}</ul> : <p className="text-sm text-ok">¡Sin errores! Prueba con niveles PISA más altos.</p>}
      </div>
      <div className="flex gap-2"><button className="btn btn-primary" onClick={() => setPhase('config')}><RotateCcw className="w-4 h-4" /> Nueva sesión</button><Link to="/progreso" className="btn btn-ghost">Ver progreso</Link></div>
    </div>
  );
}
