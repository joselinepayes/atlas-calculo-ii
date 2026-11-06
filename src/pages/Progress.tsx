import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Download, History, Info, Trash2, Upload } from 'lucide-react';
import { CHAPTERS, EXERCISES, SHORT } from '../data/atlas';
import { actions, selectors, useStore } from '../lib/storage';
import { Bar, PageHeader, ProgressRing } from '../components/ui';

const TYPE: Record<string, string> = { ejercicio: 'Ejercicio', resolutor: 'Resolutor', tutor: 'Tutor', examen: 'Examen', tema: 'Tema', practica: 'Práctica' };

export default function Progress() {
  const done = useStore((s) => s.chaptersDone);
  const attempts = useStore((s) => s.attempts);
  const exams = useStore((s) => s.exams);
  const history = useStore((s) => s.history);
  const solved = useStore(selectors.solvedCount);
  const tried = useStore(selectors.attemptedCount);
  const total = useStore(selectors.totalAttempts);
  const correct = useStore(selectors.totalCorrect);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const progress = (done.length / 10) * 40 + (solved / EXERCISES.length) * 60;
  const pending = CHAPTERS.filter((c) => !done.includes(c.id));
  const acc = total ? Math.round((correct / total) * 100) : 0;

  const exportJson = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `atlas-calculo-ii-progreso-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importJson = async (f?: File) => {
    if (!f) return;
    const r = actions.importJson(await f.text());
    setMsg({ ok: r.ok, t: r.ok ? 'Progreso importado correctamente.' : r.error ?? 'Error' });
  };

  return (
    <div>
      <PageHeader eyebrow="Mi avance" title="Progreso y estadísticas" desc="Todo se guarda localmente en este navegador. No hay cuentas ni sincronización entre dispositivos: usa exportar/importar para llevar tu progreso a otro equipo." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4"><ProgressRing value={progress} label="Progreso general" /><div><p className="text-xs uppercase tracking-wider text-muted">Progreso general</p><p className="text-sm text-muted mt-1">40 % temas + 60 % ejercicios</p></div></div>
        {[['Temas completados', `${done.length} / 10`, (done.length / 10) * 100], ['Ejercicios correctos', `${solved} / ${EXERCISES.length}`, (solved / EXERCISES.length) * 100], ['Precisión', total ? `${acc}%` : '—', acc]].map(([k, v, p]) => (
          <div key={k as string} className="card p-5"><p className="text-xs uppercase tracking-wider text-muted">{k}</p><p className="font-display text-3xl font-bold text-brandtext my-1">{v}</p><Bar value={p as number} /></div>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="card p-4"><b>{tried}</b> ejercicios realizados · <b>{total}</b> intentos · <b>{correct}</b> aciertos</div>
        <div className="card p-4"><b>{exams.length}</b> sesiones de práctica/examen</div>
        <div className="card p-4"><b>{pending.length}</b> temas pendientes</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 [&>section]:min-w-0">
        <section className="card p-5" aria-labelledby="h-temas">
          <h2 id="h-temas" className="font-display text-xl font-bold text-brandtext mb-3">Temas</h2>
          <ul className="divide-y divide-line">{CHAPTERS.map((c) => {
            const sv = c.exercises.filter((e) => attempts[e.id]?.solved).length;
            const isDone = done.includes(c.id);
            return (
              <li key={c.id} className="py-2.5 flex items-center gap-3">
                <button onClick={() => actions.toggleChapter(c.id)} aria-pressed={isDone} aria-label={`Marcar tema ${c.num} como ${isDone ? 'pendiente' : 'completado'}`}>{isDone ? <CheckCircle2 className="w-5 h-5 text-ok" /> : <Circle className="w-5 h-5 text-muted" />}</button>
                <Link to={`/tema/${c.id}`} className="flex-1 min-w-0 hover:underline"><span className="font-semibold">{c.num}</span> {SHORT[c.id]}</Link>
                <span className="text-xs text-muted w-16 text-right">{sv}/6 ej.</span>
              </li>);
          })}</ul>
          {pending.length > 0 && <p className="text-sm text-muted mt-3">Pendientes: {pending.map((c) => c.num).join(', ')}.</p>}
        </section>

        <section className="card p-5" aria-labelledby="h-ex">
          <h2 id="h-ex" className="font-display text-xl font-bold text-brandtext mb-3">Resultados de práctica y exámenes</h2>
          {exams.length ? (
            <>
              <div className="flex items-end gap-1.5 h-28 mb-3" role="img" aria-label="Porcentaje de aciertos por sesión">
                {exams.slice(0, 14).reverse().map((e) => { const p = (e.correct / Math.max(1, e.total)) * 100; return <div key={e.t} className="flex-1 flex flex-col justify-end h-full" title={`${new Date(e.t).toLocaleString()}: ${e.correct}/${e.total}`}><div className={`rounded-t ${e.mode === 'examen' ? 'bg-gold' : 'bg-violet'}`} style={{ height: `${Math.max(4, p)}%` }} /></div>; })}
              </div>
              <p className="text-xs text-muted mb-2"><span className="inline-block w-2 h-2 bg-violet rounded-sm" /> práctica · <span className="inline-block w-2 h-2 bg-gold rounded-sm" /> examen</p>
              <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">{exams.slice(0, 12).map((e) => <li key={e.t} className="flex flex-wrap justify-between gap-x-3"><span>{new Date(e.t).toLocaleString()} · {e.mode === 'examen' ? 'Examen' : 'Práctica'}</span><b>{e.correct}/{e.total} ({Math.round((e.correct / Math.max(1, e.total)) * 100)}%)</b></li>)}</ul>
            </>
          ) : <p className="text-sm text-muted">Aún no hay sesiones. <Link to="/practica" className="underline">Inicia una práctica o un examen</Link>.</p>}
        </section>

        <section className="card p-5" aria-labelledby="h-hist">
          <div className="flex items-center justify-between mb-3"><h2 id="h-hist" className="font-display text-xl font-bold text-brandtext flex items-center gap-2"><History className="w-5 h-5" /> Historial de estudio</h2>{history.length > 0 && <button className="text-xs underline text-muted" onClick={() => actions.clearHistory()}>Borrar historial</button>}</div>
          {history.length ? <ul className="text-sm space-y-1.5 max-h-72 overflow-y-auto">{history.slice(0, 40).map((h) => <li key={h.t + h.label} className="flex gap-2"><span className="chip !py-0 shrink-0">{TYPE[h.type]}</span><span className="truncate flex-1">{h.label}</span><span className="text-xs text-muted shrink-0">{new Date(h.t).toLocaleDateString()}</span></li>)}</ul> : <p className="text-sm text-muted">Tu actividad aparecerá aquí.</p>}
        </section>

        <section className="card p-5" aria-labelledby="h-data">
          <h2 id="h-data" className="font-display text-xl font-bold text-brandtext mb-2">Tus datos</h2>
          <p className="text-sm text-muted flex gap-2"><Info className="w-4 h-4 shrink-0 mt-0.5" /> Se guardan sólo en el almacenamiento local de este navegador. No se sincronizan automáticamente entre dispositivos y borrar los datos del sitio los elimina.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn btn-primary" onClick={exportJson}><Download className="w-4 h-4" /> Exportar JSON</button>
            <button className="btn btn-ghost" onClick={() => file.current?.click()}><Upload className="w-4 h-4" /> Importar JSON</button>
            <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void importJson(e.target.files?.[0]); e.target.value = ''; }} />
            <button className="btn btn-ghost" onClick={() => { if (confirm('¿Borrar todo tu progreso local? Esta acción no se puede deshacer.')) actions.reset(); }}><Trash2 className="w-4 h-4" /> Reiniciar</button>
          </div>
          {msg && <p className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`} role="status">{msg.t}</p>}
        </section>
      </div>
    </div>
  );
}
