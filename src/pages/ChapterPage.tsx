import { useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Bot, Calculator, CheckCircle2, ChevronDown, Circle, ListChecks, LineChart, Sparkles } from 'lucide-react';
import { CHAPTERS, difficultyOf, objectivesOf, chapterById } from '../data/atlas';
import { EXAMPLE_SOLVER, GRAPH_PRESETS } from '../data/links';
import { actions, useStore } from '../lib/storage';
import { Blocks, Rich } from '../components/Rich';
import { ChapterIcon, Empty, Tabs, levelColor } from '../components/ui';

type Tab = 'teoria' | 'ejemplos' | 'ejercicios' | 'aplicaciones' | 'resumen';

export default function ChapterPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const n = parseInt(id ?? '', 10);
  const done = useStore((s) => s.chaptersDone);
  const attempts = useStore((s) => s.attempts);
  const valid = n >= 1 && n <= 10;
  useEffect(() => { if (valid) { actions.visitChapter(n); actions.log({ type: 'tema', label: `Tema ${String(n).padStart(2, '0')}`, ref: String(n) }); } }, [n, valid]);
  if (!valid) return <Empty title="Tema no encontrado"><Link to="/temas" className="underline">Volver al temario</Link></Empty>;

  const c = chapterById(n);
  const tab = (sp.get('tab') as Tab) || 'teoria';
  const setTab = (t: Tab) => setSp({ tab: t }, { replace: true });
  const isDone = done.includes(n);
  const preset = GRAPH_PRESETS.find((p) => p.chapter === n);
  const objectives = objectivesOf(c);
  const askUrl = `/tutor?q=${encodeURIComponent(`Explícame el capítulo ${n}: ${c.title}`)}`;

  return (
    <div>
      <Link to="/temas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg mb-4"><ArrowLeft className="w-4 h-4" /> Temario</Link>
      <header className="card p-6 mb-6 bg-gradient-to-br from-lav/60 to-surface">
        <div className="flex flex-wrap items-start gap-5">
          <span className="font-display text-6xl font-bold text-gold leading-none">{c.num}</span>
          <div className="flex-1 min-w-[16rem]">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-brandtext leading-tight flex items-center gap-3"><ChapterIcon id={n} className="w-7 h-7 shrink-0" />{c.title}</h1>
            {objectives.length > 0 && (
              <details className="mt-3 group">
                <summary className="cursor-pointer text-sm font-semibold text-brandtext flex items-center gap-1 list-none"><ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" /> Objetivos de aprendizaje</summary>
                <ul className="list-disc ml-5 mt-2 text-sm space-y-1">{objectives.map((o, i) => <li key={i}><Rich x={o} /></li>)}</ul>
              </details>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={`btn ${isDone ? 'btn-primary' : 'btn-ghost'}`} onClick={() => actions.toggleChapter(n)} aria-pressed={isDone}>{isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />} {isDone ? 'Completado' : 'Marcar completado'}</button>
            <Link to={askUrl} className="btn btn-ghost"><Bot className="w-4 h-4" /> Preguntar al tutor</Link>
            {preset && <Link to={`/graficas?preset=${preset.id}`} className="btn btn-ghost"><LineChart className="w-4 h-4" /> Graficar</Link>}
          </div>
        </div>
      </header>

      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: 'teoria', label: 'Teoría', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'ejemplos', label: `Ejemplos (${c.examples.length})`, icon: <Sparkles className="w-4 h-4" /> },
        { id: 'ejercicios', label: 'Ejercicios PISA', icon: <ListChecks className="w-4 h-4" /> },
        { id: 'aplicaciones', label: 'Aplicaciones' },
        { id: 'resumen', label: 'Resumen' },
      ]} />

      <div className="mt-6 max-w-4xl">
        {tab === 'teoria' && (<>
          <Blocks blocks={c.intro} />
          <h2 className="font-display text-2xl font-bold text-brandtext mt-8 mb-1">Desarrollo teórico</h2>
          <Blocks blocks={c.theory} />
          {c.figures.length > 0 && <><h2 className="font-display text-2xl font-bold text-brandtext mt-8 mb-1">Representaciones gráficas</h2><Blocks blocks={c.figures} /></>}
        </>)}

        {tab === 'ejemplos' && (
          <div className="space-y-4">
            {c.examples.map((e, i) => {
              const link = EXAMPLE_SOLVER[e.id];
              const q = link ? new URLSearchParams({ cat: link.cat, ...link.inputs, run: '1' }).toString() : '';
              return (
                <details key={e.id} open={i === 0} className="card p-5 group">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                    <span className="font-display text-xl font-bold text-brandtext">Ejemplo {e.id}: {e.title}</span>
                    <ChevronDown className="w-5 h-5 text-muted transition-transform group-open:rotate-180 shrink-0" />
                  </summary>
                  <div className="mt-3">
                    <Blocks blocks={e.statement} />
                    {e.phases.map((p) => (<div key={p.title}><h4 className="mt-4 mb-1 text-sm font-bold uppercase tracking-wider text-gold">{p.title}</h4><Blocks blocks={p.blocks} /></div>))}
                    <div className="mt-5 flex flex-wrap gap-2 no-print">
                      {link ? <Link to={`/resolutor?${q}`} className="btn btn-primary"><Calculator className="w-4 h-4" /> Verificar con el Resolutor</Link> : <span className="chip">Este ejemplo es conceptual/discreto: sin plantilla del Resolutor</span>}
                      <Link to={`/tutor?q=${encodeURIComponent(`Explícame el ejemplo ${e.id}`)}`} className="btn btn-ghost"><Bot className="w-4 h-4" /> Preguntar al tutor</Link>
                    </div>
                    {link?.note && <p className="text-xs text-muted mt-2">{link.note}</p>}
                  </div>
                </details>
              );
            })}
          </div>
        )}

        {tab === 'ejercicios' && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Un ejercicio por cada nivel de competencia PISA. Ábrelos en la biblioteca para pedir pistas, comprobar tu respuesta y ver la solución verificada.</p>
            {c.exercises.map((e) => (
              <Link key={e.id} to={`/ejercicios/${e.id}`} className="card p-4 flex gap-4 hover:border-violet transition-colors">
                <span className={`chip shrink-0 h-fit ${levelColor(e.level)}`}>Nivel {e.level}</span>
                <span className="min-w-0 flex-1"><span className="block text-xs text-muted mb-1">{e.levelName} · {difficultyOf(e.level)}</span><span className="block"><Rich x={e.text} /></span></span>
                {attempts[e.id]?.solved && <CheckCircle2 className="w-5 h-5 text-ok shrink-0" aria-label="Resuelto" />}
              </Link>
            ))}
          </div>
        )}
        {tab === 'aplicaciones' && <Blocks blocks={c.applications} />}
        {tab === 'resumen' && (<>
          <Blocks blocks={c.summary} />
          <h4 className="mt-6 text-sm font-bold uppercase tracking-wider text-gold">Referencias bibliográficas</h4>
          <ul className="list-disc ml-5 text-sm space-y-1 mt-2">{c.references.map((r, i) => <li key={i}><Rich x={r} /></li>)}</ul>
        </>)}
      </div>

      <nav className="mt-10 flex justify-between gap-3 no-print" aria-label="Capítulo anterior y siguiente">
        {n > 1 ? <button className="btn btn-ghost" onClick={() => nav(`/tema/${n - 1}`)}><ArrowLeft className="w-4 h-4" /> Tema {CHAPTERS[n - 2].num}</button> : <span />}
        {n < 10 ? <button className="btn btn-primary" onClick={() => nav(`/tema/${n + 1}`)}>Tema {CHAPTERS[n].num} <ArrowRight className="w-4 h-4" /></button> : <span />}
      </nav>
    </div>
  );
}
