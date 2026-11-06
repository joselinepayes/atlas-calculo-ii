import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Search, Star } from 'lucide-react';
import { EXERCISES, PISA_LEVELS, SHORT, difficultyOf, exerciseById } from '../data/atlas';
import { fold, tokens } from '../lib/search';
import { useStore } from '../lib/storage';
import { Empty, PageHeader, levelColor } from '../components/ui';
import { Rich } from '../components/Rich';
import ExerciseView from '../components/ExerciseView';

export default function Exercises() {
  const { id } = useParams();
  const nav = useNavigate();
  const attempts = useStore((s) => s.attempts);
  const favorites = useStore((s) => s.favorites);
  const history = useStore((s) => s.history);
  const [q, setQ] = useState('');
  const [chapter, setChapter] = useState(0);
  const [level, setLevel] = useState(0);
  const [diff, setDiff] = useState('');
  const [status, setStatus] = useState<'todos' | 'pendientes' | 'resueltos' | 'favoritos'>('todos');

  const list = useMemo(() => {
    const qt = tokens(q);
    return EXERCISES.filter((e) => {
      if (chapter && e.chapter !== chapter) return false;
      if (level && e.level !== level) return false;
      if (diff && difficultyOf(e.level) !== diff) return false;
      if (status === 'favoritos' && !favorites.includes(e.id)) return false;
      if (status === 'resueltos' && !attempts[e.id]?.solved) return false;
      if (status === 'pendientes' && attempts[e.id]?.solved) return false;
      if (qt.length) { const t = new Set(tokens(e.text + ' ' + e.levelName + ' ' + SHORT[e.chapter] + ' ' + e.id)); if (!qt.every((w) => t.has(w) || [...t].some((x) => x.startsWith(w)) || fold(e.id).includes(w))) return false; }
      return true;
    });
  }, [q, chapter, level, diff, status, attempts, favorites]);
  const current = id ? exerciseById(id) : undefined;
  const recent = history.filter((h) => h.type === 'ejercicio').slice(0, 8);

  return (
    <div>
      <PageHeader eyebrow="Biblioteca de ejercicios" title="60 ejercicios PISA del folleto" desc="Los enunciados son los originales del documento. Filtra, resuelve, pide pistas, consulta fórmulas, revisa la solución verificada, guarda favoritos y genera variantes." />
      <div className="grid lg:grid-cols-[24rem_1fr] gap-5">
        <div className={`${current ? 'hidden lg:block' : ''} space-y-3 min-w-0`}>
          <div className="card p-3 space-y-2">
            <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input !pl-9" placeholder="Buscar ejercicio…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar ejercicios" /></div>
            <div className="grid grid-cols-2 gap-2">
              <select className="input" value={chapter} onChange={(e) => setChapter(+e.target.value)} aria-label="Filtrar por tema"><option value={0}>Todos los temas</option>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>Tema {String(i + 1).padStart(2, '0')}</option>)}</select>
              <select className="input" value={level} onChange={(e) => setLevel(+e.target.value)} aria-label="Filtrar por nivel PISA"><option value={0}>Todos los niveles</option>{PISA_LEVELS.map((l) => <option key={l.level} value={l.level}>Nivel {l.level}</option>)}</select>
              <select className="input" value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Dificultad"><option value="">Cualquier dificultad</option><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Estado"><option value="todos">Todos</option><option value="pendientes">Pendientes</option><option value="resueltos">Resueltos</option><option value="favoritos">Favoritos</option></select>
            </div>
            <p className="text-xs text-muted px-1">{list.length} de {EXERCISES.length} ejercicios</p>
          </div>
          <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {list.map((e) => (
              <li key={e.id}>
                <Link to={`/ejercicios/${e.id}`} className={`card p-3 flex gap-3 hover:border-violet transition-colors ${id === e.id ? '!border-violet ring-2 ring-violet/30' : ''}`}>
                  <span className="font-display font-bold text-gold text-lg w-10 shrink-0">{e.id}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[11px] text-muted"><span className={`chip !py-0 ${levelColor(e.level)}`}>Nivel {e.level}</span>{SHORT[e.chapter]}</span><span className="block text-sm line-clamp-2 mt-1"><Rich x={e.text} /></span></span>
                  <span className="flex flex-col items-center gap-1 shrink-0">{attempts[e.id]?.solved && <CheckCircle2 className="w-4 h-4 text-ok" aria-label="Resuelto" />}{favorites.includes(e.id) && <Star className="w-4 h-4 fill-gold text-gold" aria-label="Favorito" />}</span>
                </Link>
              </li>
            ))}
            {!list.length && <Empty icon={<Search className="w-5 h-5" />} title="Ningún ejercicio coincide">Ajusta los filtros.</Empty>}
          </ul>
          {recent.length > 0 && (
            <div className="card p-3"><p className="label flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Historial reciente</p><ul className="text-sm space-y-1">{recent.map((h) => <li key={h.t}><Link className="hover:underline" to={`/ejercicios/${h.ref}`}>{h.label}</Link> <span className="text-xs text-muted">{new Date(h.t).toLocaleDateString()}</span></li>)}</ul></div>
          )}
        </div>
        <div className="min-w-0">
          {current ? (<>
            <button className="lg:hidden btn btn-ghost mb-3" onClick={() => nav('/ejercicios')}><ArrowLeft className="w-4 h-4" /> Lista</button>
            <ExerciseView ex={current} />
          </>) : id ? <Empty title="Ejercicio no encontrado" /> : <Empty icon={<Search className="w-5 h-5" />} title="Selecciona un ejercicio">Elige uno de la lista para resolverlo con pistas, comprobar tu respuesta y ver la solución verificada.</Empty>}
        </div>
      </div>
    </div>
  );
}
