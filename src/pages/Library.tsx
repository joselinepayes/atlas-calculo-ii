import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bot, Download, Printer, Search, Sigma } from 'lucide-react';
import { BIBLIOGRAFIA, CHAPTERS, CONCLUSIONES, GLOSSARY, INTRO, META, formulasOf, PRESENTACION, type Block } from '../data/atlas';
import { fold, search } from '../lib/search';
import { Blocks, Rich, Tex, asset } from '../components/Rich';
import { PageHeader, Tabs } from '../components/ui';

type Tab = 'leer' | 'formulas' | 'glosario' | 'buscar';
type Section = { id: string; label: string };
const SECTIONS: Section[] = [
  { id: 'pres', label: 'Créditos y presentación' }, { id: 'intro', label: 'Introducción y marco metodológico' },
  ...CHAPTERS.map((c) => ({ id: `c${c.id}`, label: `${c.num} — ${c.title}` })),
  { id: 'concl', label: 'Conclusiones' }, { id: 'glos', label: 'Glosario' }, { id: 'bib', label: 'Bibliografía general' },
];

function ChapterReader({ id }: { id: string }) {
  if (id === 'pres') return <Blocks blocks={PRESENTACION} />;
  if (id === 'intro') return <Blocks blocks={INTRO} />;
  if (id === 'concl') return <Blocks blocks={CONCLUSIONES} />;
  if (id === 'bib') return <Blocks blocks={BIBLIOGRAFIA as Block[]} />;
  if (id === 'glos') return <GlossaryList />;
  const c = CHAPTERS[parseInt(id.slice(1), 10) - 1];
  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-brandtext">{c.num} — {c.title}</h2>
      <Blocks blocks={c.intro} />
      <h3 className="font-display text-2xl font-bold text-brandtext mt-6">Desarrollo teórico</h3><Blocks blocks={c.theory} />
      {c.figures.length > 0 && <Blocks blocks={c.figures} />}
      <h3 className="font-display text-2xl font-bold text-brandtext mt-6">Ejemplos resueltos</h3>
      {c.examples.map((e) => <div key={e.id}><h4 className="font-bold text-lg mt-5 text-brandtext">Ejemplo {e.id}: {e.title}</h4><Blocks blocks={e.statement} />{e.phases.map((p) => <div key={p.title}><h5 className="font-bold text-sm uppercase tracking-wider text-gold mt-3">{p.title}</h5><Blocks blocks={p.blocks} /></div>)}</div>)}
      <h3 className="font-display text-2xl font-bold text-brandtext mt-6">Banco de ejercicios PISA</h3>
      <ul className="list-disc ml-5 space-y-2 mt-2">{c.exercises.map((e) => <li key={e.id}><b>Nivel {e.level}</b> ({e.levelName}): <Rich x={e.text} /> <Link to={`/ejercicios/${e.id}`} className="text-sm underline ml-1 no-print">abrir</Link></li>)}</ul>
      <h3 className="font-display text-2xl font-bold text-brandtext mt-6">Aplicaciones</h3><Blocks blocks={c.applications} />
      <h3 className="font-display text-2xl font-bold text-brandtext mt-6">Resumen</h3><Blocks blocks={c.summary} />
      <h4 className="font-bold text-sm uppercase tracking-wider text-gold mt-5">Referencias</h4><ul className="list-disc ml-5 text-sm">{c.references.map((r, i) => <li key={i}><Rich x={r} /></li>)}</ul>
    </div>
  );
}

function GlossaryList() {
  const [q, setQ] = useState('');
  const list = GLOSSARY.filter((g) => !q || fold(g.term + ' ' + g.def).includes(fold(q)));
  return (
    <div>
      <div className="relative max-w-md mb-4"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input !pl-9" placeholder="Filtrar términos…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filtrar glosario" /></div>
      <dl className="grid md:grid-cols-2 gap-3">{list.map((g) => <div key={g.term} className="card p-4"><dt className="font-semibold text-brandtext">{g.term}</dt><dd className="text-sm mt-1"><Rich x={g.def} /></dd></div>)}</dl>
      {!list.length && <p className="text-muted">Sin términos.</p>}
    </div>
  );
}

function FormulaIndex() {
  const [q, setQ] = useState('');
  return (
    <div>
      <div className="relative max-w-md mb-4"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input !pl-9" placeholder="Filtrar por tema (ej.: hessiano, centroide)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filtrar fórmulas" /></div>
      <div className="space-y-6">{CHAPTERS.filter((c) => !q || fold(c.title + ' ' + formulasOf(c).join(' ')).includes(fold(q))).map((c) => (
        <section key={c.id}><h3 className="font-display text-xl font-bold text-brandtext flex items-center gap-2"><Sigma className="w-5 h-5 text-gold" /> {c.num} — {c.title}</h3>
          <div className="grid lg:grid-cols-2 gap-2 mt-2">{formulasOf(c).map((f, i) => <div key={i} className="formula-red"><Tex x={f.replace(/^\$|\$$/g, '')} display /></div>)}</div></section>))}</div>
    </div>
  );
}

function ContentSearch() {
  const [q, setQ] = useState('');
  const hits = useMemo(() => (q.trim().length > 1 ? search(q, 15) : []), [q]);
  return (
    <div>
      <div className="relative max-w-xl mb-4"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input !pl-9" placeholder="Buscar en todo el folleto…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el folleto" /></div>
      <ul className="space-y-2">{hits.map((h) => <li key={h.chunk.id}><Link to={h.chunk.href} className="card p-3 block hover:border-violet"><span className="text-xs text-muted">{h.chunk.label}</span><span className="block font-semibold">{h.chunk.title.replace(/\$/g, '')}</span><span className="block text-sm text-muted line-clamp-2">{h.chunk.text.slice(0, 200)}…</span></Link></li>)}</ul>
      {q.trim().length > 1 && !hits.length && <p className="text-muted">Sin resultados.</p>}
    </div>
  );
}

export default function Library() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'leer';
  const sec = sp.get('s') || 'c1';
  const idx = SECTIONS.findIndex((s) => s.id === sec);
  return (
    <div>
      <PageHeader eyebrow="Biblioteca digital" title="Folleto: Cálculo II — Atlas del Cálculo" desc={`${META.author} · ${META.university}. Licencia ${META.license}.`} right={
        <div className="flex flex-wrap gap-2 no-print">
          <a className="btn btn-primary" href={asset('docs/Calculo_II_Atlas_del_Calculo.docx')} download><Download className="w-4 h-4" /> Descargar original (.docx)</a>
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer className="w-4 h-4" /> Imprimir / guardar PDF</button>
        </div>} />
      <Tabs<Tab> value={tab} onChange={(t) => setSp({ tab: t })} tabs={[{ id: 'leer', label: 'Leer' }, { id: 'formulas', label: 'Fórmulas' }, { id: 'glosario', label: 'Glosario' }, { id: 'buscar', label: 'Buscar' }]} />
      <div className="mt-6">
        {tab === 'leer' && (
          <div className="grid lg:grid-cols-[18rem_1fr] gap-6">
            <nav className="card p-2 self-start lg:sticky lg:top-20 max-h-[70vh] overflow-y-auto no-print" aria-label="Capítulos del folleto">
              {SECTIONS.map((s) => <button key={s.id} onClick={() => setSp({ tab: 'leer', s: s.id })} aria-current={s.id === sec} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${s.id === sec ? 'bg-brand text-brandfg font-semibold' : 'hover:bg-lav'}`}>{s.label}</button>)}
            </nav>
            <article className="min-w-0 max-w-4xl">
              <ChapterReader id={sec} />
              <div className="mt-8 flex flex-wrap gap-2 justify-between no-print">
                <button className="btn btn-ghost" disabled={idx <= 0} onClick={() => setSp({ tab: 'leer', s: SECTIONS[idx - 1].id })}>← Anterior</button>
                {sec.startsWith('c') && sec !== 'concl' && <Link to={`/tutor?q=${encodeURIComponent(`Explícame el capítulo ${sec.slice(1)}`)}`} className="btn btn-ghost"><Bot className="w-4 h-4" /> Preguntar al chatbot sobre este capítulo</Link>}
                <button className="btn btn-primary" disabled={idx >= SECTIONS.length - 1} onClick={() => setSp({ tab: 'leer', s: SECTIONS[idx + 1].id })}>Siguiente →</button>
              </div>
            </article>
          </div>
        )}
        {tab === 'formulas' && <FormulaIndex />}
        {tab === 'glosario' && <GlossaryList />}
        {tab === 'buscar' && <ContentSearch />}
      </div>
    </div>
  );
}
