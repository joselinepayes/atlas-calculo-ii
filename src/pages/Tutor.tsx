import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bot, Cpu, Download, Info, Send, Square, Trash2, User, Zap } from 'lucide-react';
import { chapterById, exerciseById, type Block } from '../data/atlas';
import { buildContext, newCtx, reply, type Ctx, type Part, type Reply, type Source } from '../lib/tutor';
import * as llm from '../lib/webllm';
import { actions } from '../lib/storage';
import { Blocks, Rich } from '../components/Rich';
import { PageHeader, levelColor } from '../components/ui';

interface Msg { role: 'user' | 'assistant'; text?: string; reply?: Reply; mode?: 'A' | 'B'; sources?: Source[]; streaming?: boolean; note?: string }

const START = ['¿Qué es una derivada parcial?', '¿Cómo encuentro un centroide?', 'Explícame las integrales dobles', '¿Cómo funciona el Hessiano?', 'Dame un ejercicio de nivel PISA 3', 'Explícame el ejemplo 1.2', '¿Por qué mi respuesta es incorrecta?'];

function ErrorsPart({ chapter }: { chapter: number }) {
  const t = chapterById(chapter).summary.filter((b) => b.t === 'table').find((b) => /errores/i.test((b.rows?.[0] ?? []).join(' ')));
  const rows = (t?.rows ?? []).slice(1).map((r) => r[1]).filter(Boolean);
  return rows.length ? <ul className="list-disc ml-5 space-y-1 text-sm">{rows.map((r, i) => <li key={i}><Rich x={r} /></li>)}</ul> : <p className="text-sm text-muted">Este capítulo no lista errores frecuentes en su resumen.</p>;
}
function PartView({ p }: { p: Part }) {
  if (p.type === 'rich') return <Rich as="div" x={p.x} />;
  if (p.type === 'blocks') return <div className="my-2 rounded-xl bg-surface2 p-3 border border-line"><Blocks blocks={p.blocks as Block[]} /></div>;
  if (p.type === 'errors') return <ErrorsPart chapter={p.chapter} />;
  const e = exerciseById(p.id)!;
  return (
    <div className="enun-box">
      <p className="text-xs mb-1 flex items-center gap-2"><span className={`chip !py-0 ${levelColor(e.level)}`}>Nivel {e.level}</span> Ejercicio {e.id} — {e.levelName}</p>
      <Rich as="div" x={e.text} />
      <Link to={`/ejercicios/${e.id}`} className="text-sm font-semibold underline mt-2 inline-block">Abrir en la biblioteca →</Link>
    </div>
  );
}

export default function Tutor() {
  const [params, setParams] = useSearchParams();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const ctx = useRef<Ctx>(newCtx());
  const endRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const autoAsked = useRef(false);
  const [panel, setPanel] = useState(false);
  const [gpu, setGpu] = useState<llm.GpuStatus | null>(null);
  const [model, setModel] = useState(llm.MODELS[1].id);
  const [loading, setLoading] = useState<{ progress: number; text: string } | null>(null);
  const [loaded, setLoaded] = useState(llm.isLoaded());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const histRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const sel = llm.MODELS.find((m) => m.id === model)!;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);
  useEffect(() => { if (panel && !gpu) llm.detectWebGPU().then(setGpu); }, [panel, gpu]);

  const ask = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', text: t }]);
    actions.log({ type: 'tutor', label: t.slice(0, 80) });
    const r = reply(t, ctx.current);
    ctx.current = r.ctx;
    if (llm.isLoaded()) {
      // Modalidad B: la IA local recibe fragmentos recuperados del folleto como contexto.
      setBusy(true);
      const { system, sources } = buildContext(t, ctx.current.chapter);
      histRef.current.push({ role: 'user', content: t });
      setMsgs((m) => [...m, { role: 'assistant', text: '', mode: 'B', sources, streaming: true }]);
      abort.current = new AbortController();
      try {
        const full = await llm.generate(system, histRef.current, (txt) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: txt } : x))), abort.current.signal);
        histRef.current.push({ role: 'assistant', content: full });
        setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, streaming: false } : x)));
      } catch (e) {
        setErr('La IA local falló; se usó el tutor académico (modalidad A). ' + (e instanceof Error ? e.message : ''));
        setMsgs((m) => [...m.slice(0, -1), { role: 'assistant', reply: r, mode: 'A', sources: r.sources, note: 'La IA local no respondió; respuesta del tutor académico.' }]);
      } finally { setBusy(false); abort.current = null; }
    } else {
      setMsgs((m) => [...m, { role: 'assistant', reply: r, mode: 'A', sources: r.sources }]);
    }
  }, [busy]);

  useEffect(() => {
    const q = params.get('q');
    if (q && !autoAsked.current) { autoAsked.current = true; setParams({}, { replace: true }); void ask(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activate = async () => {
    setErr(null); setLoading({ progress: 0, text: 'Preparando…' });
    try { await llm.loadModel(model, setLoading); setLoaded(true); setLoading(null); }
    catch (e) { setLoading(null); setErr('No se pudo activar la IA local: ' + (e instanceof Error ? e.message : String(e)) + ' — el sitio sigue funcionando con el tutor académico.'); }
  };
  const deactivate = async () => { llm.stopGeneration(); await llm.unloadModel(); setLoaded(false); histRef.current = []; };
  const clearCache = async () => { const n = await llm.clearModelCache(); setErr(n ? `Se borraron ${n} caché(s) de modelos del navegador.` : 'No había modelos en caché.'); };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader eyebrow="Tutor" title="Atlas Tutor" desc="Responde con contenido verificable del folleto y te dice de qué capítulo viene. No es una IA generativa; la IA local (opcional) se activa por separado." right={
        <button className="btn btn-ghost" onClick={() => setPanel(!panel)} aria-expanded={panel}><Cpu className="w-4 h-4" /> IA local {loaded ? '(activa)' : '(opcional)'}</button>} />

      {panel && (
        <section className="card p-5 mb-5 space-y-3" aria-label="IA local con WebLLM">
          <h2 className="font-semibold text-brandtext flex items-center gap-2"><Cpu className="w-4 h-4" /> Modalidad B · IA local real (WebLLM, sin API)</h2>
          <p className="text-sm">El modelo se ejecuta <b>en tu dispositivo</b> con WebGPU. No se piden claves ni se envían tus preguntas a ningún servidor de IA. Sólo se <b>descargan los archivos del modelo</b> (una vez; luego quedan en la caché del navegador) y únicamente cuando pulsas “Activar”.</p>
          {!gpu ? <p className="text-sm text-muted">Comprobando WebGPU…</p> : gpu.supported ? <p className="text-sm text-ok flex items-center gap-2"><Zap className="w-4 h-4" /> WebGPU disponible ({gpu.adapter}).</p> : (
            <p className="text-sm text-bad flex items-start gap-2" role="alert"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {gpu.reason} Seguirás usando el tutor académico (modalidad A), que funciona en cualquier dispositivo.</p>)}
          <label className="block"><span className="label">Modelo</span>
            <select className="input" value={model} onChange={(e) => setModel(e.target.value)} disabled={loaded || !!loading}>{llm.MODELS.map((m) => <option key={m.id} value={m.id}>{m.label} — descarga ≈ {m.approxDownloadMB >= 1000 ? (m.approxDownloadMB / 1000).toFixed(1) + ' GB' : m.approxDownloadMB + ' MB'}</option>)}</select></label>
          <ul className="text-sm text-muted list-disc ml-5 space-y-1">
            <li>Descarga aproximada: <b>{sel.approxDownloadMB >= 1000 ? (sel.approxDownloadMB / 1000).toFixed(1) + ' GB' : sel.approxDownloadMB + ' MB'}</b> · memoria de GPU requerida ≈ <b>{(sel.approxVramMB / 1000).toFixed(1)} GB</b> (valores aproximados). {sel.note}</li>
            <li>Rendimiento: en GPU integrada puede generar pocas palabras por segundo; use el modelo de 0.5B si va lento. Cierre otras pestañas pesadas.</li>
            <li>Los pesos provienen de repositorios públicos de modelos abiertos (Hugging Face / GitHub); es sólo descarga de archivos, sin cuenta ni costo.</li>
          </ul>
          <div className="enun-box text-sm flex gap-2"><Info className="w-4 h-4 mt-0.5 shrink-0" /><span><b>Aviso:</b> las respuestas de la IA local <b>pueden contener errores</b>, sobre todo en cálculos. Verifica siempre con el folleto, el Resolutor o el tutor académico.</span></div>
          {loading && <div><div className="h-2 rounded-full bg-lav overflow-hidden"><div className="h-full bg-violet transition-all" style={{ width: `${Math.round(loading.progress * 100)}%` }} /></div><p className="text-xs text-muted mt-1">{Math.round(loading.progress * 100)}% · {loading.text}</p></div>}
          <div className="flex flex-wrap gap-2">
            {!loaded ? <button className="btn btn-primary" disabled={!gpu?.supported || !!loading} onClick={activate}><Download className="w-4 h-4" /> Activar y descargar el modelo</button> : <button className="btn btn-ghost" onClick={deactivate}><Square className="w-4 h-4" /> Desactivar y liberar memoria</button>}
            <button className="btn btn-ghost" onClick={clearCache}><Trash2 className="w-4 h-4" /> Borrar modelos descargados</button>
          </div>
          {err && <p className="text-sm text-bad" role="alert">{err}</p>}
        </section>
      )}

      <div className="card p-4 sm:p-5 min-h-[50vh] flex flex-col">
        <div className="flex-1 space-y-5" aria-live="polite">
          {!msgs.length && (
            <div className="text-center py-8">
              <span className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-brand text-brandfg"><Bot className="w-7 h-7" /></span>
              <h2 className="font-display text-2xl font-bold text-brandtext mt-3">¿Qué quieres repasar hoy?</h2>
              <p className="text-sm text-muted mt-1 max-w-md mx-auto">Pregunta por conceptos, pide ejemplos o ejercicios por nivel PISA, o escribe “ejemplo 1.2”.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">{START.map((s) => <button key={s} className="chip cursor-pointer hover:bg-gold/20" onClick={() => ask(s)}>{s}</button>)}</div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className={`grid place-items-center w-8 h-8 rounded-full shrink-0 ${m.role === 'user' ? 'bg-gold text-[#1d1033]' : 'bg-brand text-brandfg'}`}>{m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}</span>
              <div className={`max-w-[88%] min-w-0 rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-brand text-brandfg' : 'bg-surface2 border border-line'}`}>
                {m.role === 'user' ? <p>{m.text}</p> : (<>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gold mb-1">{m.mode === 'B' ? 'IA local (WebLLM) · puede contener errores' : 'Tutor académico · contenido del folleto'}</p>
                  {m.note && <p className="text-xs text-muted mb-1">{m.note}</p>}
                  {m.mode === 'B' ? <Rich as="div" x={m.text || '…'} /> : m.reply!.parts.map((p, k) => <PartView key={k} p={p} />)}
                  {m.streaming && <button className="btn btn-ghost mt-2 !py-1" onClick={() => llm.stopGeneration()}><Square className="w-3.5 h-3.5" /> Detener</button>}
                  {m.sources && m.sources.length > 0 && <p className="mt-2 text-xs text-muted flex flex-wrap gap-2 items-center">Fuentes: {m.sources.map((s) => <Link key={s.href + s.label} to={s.href} className="chip hover:underline">{s.label}</Link>)}</p>}
                  {i === msgs.length - 1 && m.reply && m.reply.suggestions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{m.reply.suggestions.map((s) => <button key={s} className="chip cursor-pointer hover:bg-gold/20" onClick={() => ask(s)}>{s}</button>)}</div>}
                </>)}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void ask(input); }}>
          <input className="input !py-3" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta de Cálculo II…" aria-label="Pregunta para el tutor" disabled={busy} />
          <button className="btn btn-primary" disabled={busy || !input.trim()} aria-label="Enviar"><Send className="w-4 h-4" /></button>
        </form>
        <p className="text-[11px] text-muted mt-2">El tutor académico recupera y muestra contenido del folleto; no genera texto nuevo ni resuelve problemas por su cuenta. Para resolver, usa el <Link className="underline" to="/resolutor">Resolutor</Link>.</p>
      </div>
    </div>
  );
}
