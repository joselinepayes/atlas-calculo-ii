import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Calculator, CheckCircle2, GraduationCap, LibraryBig, LineChart, ListChecks, Sparkles, Zap } from 'lucide-react';
import { CHAPTERS, EXERCISES, SHORT, blurbOf, chapterById } from '../data/atlas';
import { selectors, useStore } from '../lib/storage';
import { Bar, ChapterIcon, ProgressRing } from '../components/ui';
import { Blocks } from '../components/Rich';
import { asset } from '../components/Rich';

const TOOLS = [
  { to: '/tutor', icon: Bot, title: 'Atlas Tutor', desc: 'Pregunta y recibe respuestas verificadas del folleto; IA local opcional.' },
  { to: '/resolutor', icon: Calculator, title: 'Resolutor paso a paso', desc: '11 tipos de problemas con método de Pólya y comprobación.' },
  { to: '/ejercicios', icon: ListChecks, title: '60 ejercicios PISA', desc: 'Filtra, pide pistas, verifica y genera variantes.' },
  { to: '/graficas', icon: LineChart, title: 'Laboratorio de gráficas', desc: 'Superficies 3D, curvas de nivel, regiones y puntos críticos.' },
  { to: '/practica', icon: GraduationCap, title: 'Práctica y examen', desc: 'Simulacro con temporizador y recomendaciones de estudio.' },
  { to: '/biblioteca', icon: LibraryBig, title: 'Biblioteca digital', desc: 'Lee el folleto, consulta fórmulas y descarga el original.' },
];

export default function Dashboard() {
  const done = useStore((s) => s.chaptersDone);
  const attempts = useStore((s) => s.attempts);
  const last = useStore((s) => s.lastChapter);
  const solved = useStore(selectors.solvedCount);
  const progress = (done.length / 10) * 40 + (solved / EXERCISES.length) * 60;
  const day = Math.floor(Date.now() / 86400000);
  const daily = EXERCISES[day % EXERCISES.length];
  const lastCh = last ? chapterById(last) : undefined;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3b1f63] via-[#4b2a7b] to-[#6d3fc9] text-white p-6 sm:p-10 shadow-xl">
        <div aria-hidden className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#e2b93b]/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-[#f1d675]">Universidad Mariano Gálvez · Ingeniería en Sistemas</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mt-3 leading-[1.05]">Atlas del <span className="text-[#f1d675]">Cálculo II</span></h1>
            <p className="mt-4 text-lg text-white/85 max-w-2xl">Laboratorio matemático interactivo: estudia los diez temas, pregunta al tutor, resuelve paso a paso, explora superficies 3D y prepárate para el examen final. Todo gratis y sin cuentas.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={lastCh ? `/tema/${lastCh.id}` : '/tema/1'} className="btn btn-gold">{lastCh ? `Continuar: Tema ${lastCh.num}` : 'Comenzar con el Tema 01'} <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/tutor" className="btn bg-white/15 hover:bg-white/25 text-white border border-white/25"><Bot className="w-4 h-4" /> Preguntar al tutor</Link>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-5 backdrop-blur text-center">
              <ProgressRing value={progress} size={112} label="Progreso general" />
              <p className="text-xs mt-2 text-white/80">Progreso general</p>
            </div>
            <img src={asset('img/cover.webp')} alt="Portada del folleto Cálculo II — Atlas del Cálculo" className="w-44 rounded-2xl shadow-2xl border-2 border-[#e2b93b]/60 rotate-3" width={176} height={228} />
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-3 max-w-xl">
          {[['Temas', `${done.length}/10`], ['Ejercicios', `${solved}/${EXERCISES.length}`], ['Avance', `${Math.round(progress)}%`]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/10 border border-white/15 px-3 py-2"><p className="text-[11px] uppercase tracking-wider text-white/70">{k}</p><p className="font-display text-xl font-bold">{v}</p></div>
          ))}
        </div>
      </section>

      <section aria-labelledby="h-tools">
        <h2 id="h-tools" className="font-display text-2xl font-bold text-brandtext mb-4">Herramientas</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {TOOLS.map((t, i) => (
            <motion.div key={t.to} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={t.to} className="card p-5 flex gap-4 h-full hover:-translate-y-0.5 hover:border-violet transition-all">
                <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-lav text-brandtext"><t.icon className="w-5 h-5" /></span>
                <span><span className="block font-semibold">{t.title}</span><span className="block text-sm text-muted mt-0.5">{t.desc}</span></span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="card p-5">
          <p className="chip mb-3"><Zap className="w-3.5 h-3.5" /> Ejercicio del día</p>
          <p className="text-sm text-muted mb-2">Capítulo {daily.chapter} · Nivel PISA {daily.level} — {daily.levelName}</p>
          <Blocks blocks={[{ t: 'p', x: daily.text }]} />
          <Link to={`/ejercicios/${daily.id}`} className="btn btn-primary mt-3">Resolver ahora <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="card p-5">
          <p className="chip mb-3"><Sparkles className="w-3.5 h-3.5" /> Cómo estudiar</p>
          <ol className="space-y-2 text-sm list-decimal ml-5">
            <li>Lee la <b>teoría</b> y las fórmulas en rojo.</li>
            <li>Resuelve cada <b>ejemplo</b> antes de leer su solución.</li>
            <li>Practica con el banco <b>PISA</b> de menor a mayor nivel.</li>
            <li>Verifica con el <b>Resolutor</b> y consulta al <b>Tutor</b>.</li>
            <li>Simula el <b>examen</b> y repasa los temas débiles.</li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="h-ch">
        <div className="flex items-end justify-between mb-4"><h2 id="h-ch" className="font-display text-2xl font-bold text-brandtext">Los diez temas</h2><Link to="/temas" className="text-sm font-semibold text-brandtext hover:underline">Ver todos →</Link></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {CHAPTERS.map((c, i) => {
            const sv = c.exercises.filter((e) => attempts[e.id]?.solved).length;
            const isDone = done.includes(c.id);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 5) * 0.04 }}>
                <Link to={`/tema/${c.id}`} className="card p-4 h-full flex flex-col gap-3 hover:-translate-y-0.5 hover:border-violet transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-bold text-gold">{c.num}</span>
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-ok" aria-label="Completado" /> : <span className="grid place-items-center w-9 h-9 rounded-lg bg-lav text-brandtext"><ChapterIcon id={c.id} /></span>}
                  </div>
                  <p className="font-semibold leading-snug">{SHORT[c.id]}</p>
                  <p className="text-xs text-muted line-clamp-3">{blurbOf(c)}</p>
                  <div className="mt-auto"><div className="flex justify-between text-[11px] text-muted mb-1"><span>Ejercicios</span><span>{sv}/6</span></div><Bar value={(sv / 6) * 100} /></div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
