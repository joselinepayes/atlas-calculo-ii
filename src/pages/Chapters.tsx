import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { CHAPTERS, SHORT, blurbOf } from '../data/atlas';
import { useStore } from '../lib/storage';
import { Bar, ChapterIcon, PageHeader } from '../components/ui';

const BLOCKS = [
  { title: 'Aplicaciones de la integral en una variable', ids: [1, 2, 3] },
  { title: 'Funciones de varias variables', ids: [4, 5] },
  { title: 'Integración múltiple aplicada', ids: [6, 7] },
  { title: 'Cálculo diferencial en varias variables', ids: [8, 9, 10] },
];

export default function Chapters() {
  const done = useStore((s) => s.chaptersDone);
  const attempts = useStore((s) => s.attempts);
  return (
    <div>
      <PageHeader eyebrow="Temario" title="Los diez temas de Cálculo II" desc="Cada tema incluye teoría con fórmulas destacadas, representaciones gráficas, ejemplos resueltos con el método de Pólya, seis ejercicios por nivel PISA, aplicaciones a Ingeniería en Sistemas y un resumen." />
      <div className="space-y-10">
        {BLOCKS.map((b) => (
          <section key={b.title}>
            <h2 className="font-display text-xl font-bold text-brandtext mb-3">{b.title}</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {b.ids.map((id) => {
                const c = CHAPTERS[id - 1];
                const sv = c.exercises.filter((e) => attempts[e.id]?.solved).length;
                return (
                  <Link key={id} to={`/tema/${id}`} className="card p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:border-violet transition-all">
                    <div className="flex items-start gap-4">
                      <span className="font-display text-4xl font-bold text-gold leading-none">{c.num}</span>
                      <div className="min-w-0 flex-1"><p className="font-semibold leading-snug">{c.title}</p><p className="text-xs text-muted mt-1">{SHORT[id]} · {c.examples.length} ejemplos · 6 ejercicios</p></div>
                      {done.includes(id) ? <CheckCircle2 className="w-5 h-5 text-ok shrink-0" aria-label="Completado" /> : <ChapterIcon id={id} className="w-5 h-5 text-brandtext shrink-0" />}
                    </div>
                    <p className="text-sm text-muted line-clamp-3">{blurbOf(c)}</p>
                    <div><div className="flex justify-between text-[11px] text-muted mb-1"><span>Ejercicios resueltos</span><span>{sv}/6</span></div><Bar value={(sv / 6) * 100} /></div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
