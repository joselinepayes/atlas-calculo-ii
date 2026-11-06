import { CHAPTERS, EXERCISES, GLOSSARY, INTRO, SHORT, plain, blockText, type Block } from '../data/atlas';
import { FAQ } from '../data/faq';

export type ChunkKind = 'teoria' | 'ejemplo' | 'ejercicio' | 'glosario' | 'resumen' | 'aplicacion' | 'faq' | 'intro';
export interface Chunk {
  id: string; kind: ChunkKind; chapter: number; title: string; label: string; blocks: Block[]; text: string;
  href: string; ref?: string;
}

const STOP = new Set('de la el en y a los las del un una que es por con para se al lo como mas o su sus este esta son si no ya le nos me mi tu te cual cuales cuando donde sobre entre desde hasta ser hay muy tambien pero sin puede pueden dame dime quiero explicame explica favor'.split(' '));
export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export function stem(w: string): string {
  if (w.length > 5 && w.endsWith('ciones')) return w.slice(0, -6) + 'cion';
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return w;
}
export function tokens(s: string): string[] {
  return fold(plain(s)).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
}

const MAXC = 1100;
function chunkBlocks(blocks: Block[], chapter: number, kind: ChunkKind, label: string, hrefBase: string, idPrefix: string): Chunk[] {
  const out: Chunk[] = [];
  let cur: Block[] = [];
  let title = label;
  let len = 0;
  const flush = () => {
    if (!cur.length) return;
    const text = cur.map(blockText).join(' ');
    out.push({ id: `${idPrefix}-${out.length}`, kind, chapter, title, label, blocks: cur, text: plain(text), href: hrefBase });
    cur = []; len = 0;
  };
  for (const b of blocks) {
    if (b.t === 'h4' || b.t === 'h3') { flush(); title = (b.x ?? '').replace(/\*\*/g, ''); cur.push(b); continue; }
    if (b.t === 'fig' || b.t === 'img' || b.t === 'cap') continue;
    const l = blockText(b).length;
    if (len + l > MAXC && cur.length > 1) { const t = title; flush(); title = t; }
    cur.push(b); len += l;
  }
  flush();
  return out;
}

let CHUNKS: Chunk[] | null = null;
export function getChunks(): Chunk[] {
  if (CHUNKS) return CHUNKS;
  const out: Chunk[] = [];
  for (const c of CHAPTERS) {
    const base = `/tema/${c.id}`;
    out.push(...chunkBlocks(c.intro, c.id, 'teoria', `Cap. ${c.id} · Presentación`, base, `c${c.id}-A`));
    out.push(...chunkBlocks(c.theory, c.id, 'teoria', `Cap. ${c.id} · Desarrollo teórico`, base, `c${c.id}-B`));
    out.push(...chunkBlocks(c.applications, c.id, 'aplicacion', `Cap. ${c.id} · Aplicaciones`, base, `c${c.id}-F`));
    out.push(...chunkBlocks(c.summary, c.id, 'resumen', `Cap. ${c.id} · Resumen`, base, `c${c.id}-G`));
    for (const e of c.examples) {
      const blocks: Block[] = [...e.statement, ...e.phases.flatMap((p) => [{ t: 'h4', x: p.title }, ...p.blocks])];
      out.push({ id: `ex-${e.id}`, kind: 'ejemplo', chapter: c.id, title: `Ejemplo ${e.id}: ${e.title}`, label: `Cap. ${c.id} · Ejemplo ${e.id}`, blocks, text: plain(`${e.title} ${blocks.map(blockText).join(' ')}`), href: `/tema/${c.id}?tab=ejemplos`, ref: e.id });
    }
    for (const x of c.exercises) out.push({ id: `exo-${x.id}`, kind: 'ejercicio', chapter: c.id, title: `Ejercicio ${x.id} (Nivel ${x.level})`, label: `Cap. ${c.id} · Ejercicio ${x.id}`, blocks: [{ t: 'p', x: x.text }], text: plain(x.text) + ` ejercicio nivel ${x.level} ${x.levelName}`, href: `/ejercicios/${x.id}`, ref: x.id });
  }
  GLOSSARY.forEach((g, i) => out.push({ id: `g-${i}`, kind: 'glosario', chapter: 0, title: g.term, label: 'Glosario', blocks: [{ t: 'p', x: `**${g.term}.** ${g.def}` }], text: plain(`${g.term} ${g.def}`), href: '/biblioteca?tab=glosario' }));
  out.push(...chunkBlocks(INTRO, 0, 'intro', 'Introducción y marco metodológico', '/biblioteca', 'intro'));
  for (const f of FAQ) out.push({ id: f.id, kind: 'faq', chapter: f.chapter, title: f.q, label: f.chapter ? `Cap. ${f.chapter} · ${SHORT[f.chapter]}` : 'Marco metodológico', blocks: [{ t: 'p', x: f.a }], text: plain(`${f.q} ${f.keywords} ${f.a}`), href: f.chapter ? `/tema/${f.chapter}` : '/biblioteca' });
  CHUNKS = out;
  return out;
}

interface Index { vecs: Map<string, number>[]; norms: number[]; idf: Map<string, number>; chunks: Chunk[] }
let INDEX: Index | null = null;
function index(): Index {
  if (INDEX) return INDEX;
  const chunks = getChunks();
  const df = new Map<string, number>();
  const tfs = chunks.map((c) => {
    const tf = new Map<string, number>();
    for (const t of tokens(c.title + ' ' + c.title + ' ' + c.text)) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return tf;
  });
  const N = chunks.length;
  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log(1 + N / d));
  const vecs = tfs.map((tf) => {
    const v = new Map<string, number>();
    for (const [t, f] of tf) v.set(t, (1 + Math.log(f)) * (idf.get(t) ?? 0));
    return v;
  });
  const norms = vecs.map((v) => Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0)) || 1);
  INDEX = { vecs, norms, idf, chunks };
  return INDEX;
}

const KIND_BOOST: Record<ChunkKind, number> = { faq: 1.25, teoria: 1.05, ejemplo: 1, resumen: 1, glosario: 0.95, aplicacion: 0.9, ejercicio: 0.85, intro: 0.9 };
const TOPIC: [RegExp, number[]][] = [
  [/superficie.*revoluc|revoluc/, [1]], [/valor promedio|valor medio|promedio/, [2, 6]], [/centroide|centro de masa|pappus|momento/, [3, 7]],
  [/curva.* de nivel|dominio|esfera|distancia|traza|cuadrica/, [4, 5]], [/integral(es)? doble|region|iterada|polares/, [6, 7]],
  [/limite|continuidad|trayectoria|epsilon|delta/, [8]], [/parcial|diferencial|exact|clairaut|laplace/, [9]], [/cadena|hessiano|critico|maximo|minimo|extremo|optimiz|gradiente/, [10]],
];
export function topicChapters(q: string): number[] {
  const f = fold(q);
  return [...new Set(TOPIC.filter(([r]) => r.test(f)).flatMap(([, c]) => c))];
}

export interface Hit { chunk: Chunk; score: number }
export function search(query: string, k = 6, opts: { chapter?: number; kinds?: ChunkKind[]; boostChapters?: number[] } = {}): Hit[] {
  const ix = index();
  const q = new Map<string, number>();
  for (const t of tokens(query)) q.set(t, (q.get(t) ?? 0) + 1);
  if (!q.size) return [];
  const qv = new Map<string, number>();
  for (const [t, f] of q) qv.set(t, (1 + Math.log(f)) * (ix.idf.get(t) ?? 0.5));
  const qn = Math.sqrt([...qv.values()].reduce((s, x) => s + x * x, 0)) || 1;
  const topics = opts.boostChapters ?? topicChapters(query);
  const hits: Hit[] = [];
  ix.chunks.forEach((c, i) => {
    if (opts.chapter && c.chapter !== opts.chapter) return;
    if (opts.kinds && !opts.kinds.includes(c.kind)) return;
    let dot = 0;
    for (const [t, w] of qv) { const dw = ix.vecs[i].get(t); if (dw) dot += w * dw; }
    if (!dot) return;
    let s = (dot / (qn * ix.norms[i])) * KIND_BOOST[c.kind];
    // coincidencia de frase literal en el título
    if (fold(c.title).includes(fold(query).trim()) && query.trim().length > 3) s *= 1.5;
    if (topics.includes(c.chapter)) s *= 1.35;
    hits.push({ chunk: c, score: s });
  });
  return hits.sort((a, b) => b.score - a.score).slice(0, k);
}

export const exercisesCount = EXERCISES.length;
