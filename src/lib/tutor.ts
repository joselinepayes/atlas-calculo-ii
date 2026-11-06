/**
 * Atlas Tutor — modalidad A (local, determinista).
 * No es una IA generativa: recupera y presenta contenido verificado del folleto (búsqueda TF-IDF + reglas de intención).
 */
import { CHAPTERS, EXAMPLES, EXERCISES, INTRO, PISA_LEVELS, SHORT, chapterById, exerciseById, solutionFor, type Block } from '../data/atlas';
import { FAQ } from '../data/faq';
import { fold, search, topicChapters, type Chunk } from './search';

export type Part =
  | { type: 'rich'; x: string }
  | { type: 'blocks'; blocks: Block[] }
  | { type: 'exercise'; id: string }
  | { type: 'errors'; chapter: number };
export interface Source { label: string; href: string }
export interface Reply { parts: Part[]; sources: Source[]; suggestions: string[]; ctx: Ctx; confident: boolean; retrieved: Chunk[] }
export interface Ctx { chapter?: number; lastExercise?: string; lastExample?: string; offered: string[] }
export const newCtx = (): Ctx => ({ offered: [] });

const POLYA_PROMPTS = [
  '**1. Comprender:** ¿cuál es la incógnita? ¿qué datos tienes? ¿qué condiciones o restricciones hay?',
  '**2. Concebir un plan:** ¿qué fórmula o estrategia conecta los datos con la incógnita?',
  '**3. Ejecutar el plan:** realiza las operaciones con rigor y verifica cada paso.',
  '**4. Visión retrospectiva:** ¿el resultado es razonable? ¿puedes comprobarlo de otra manera?',
];

const chapterSuggestions = (c: number) => [`Dame un ejemplo del capítulo ${c}`, `Dame un ejercicio de nivel PISA 3 del capítulo ${c}`, `Errores frecuentes del capítulo ${c}`];

function srcOf(ch: Chunk): Source { return { label: ch.label, href: ch.href }; }

function pickExercise(level: number | undefined, chapter: number | undefined, offered: string[]): string | undefined {
  let pool = EXERCISES.filter((e) => (!level || e.level === level) && (!chapter || e.chapter === chapter));
  if (!pool.length) pool = EXERCISES.filter((e) => !level || e.level === level);
  const fresh = pool.filter((e) => !offered.includes(e.id));
  const list = fresh.length ? fresh : pool;
  return list[Math.floor(Math.random() * list.length)]?.id;
}

export function reply(query: string, ctx: Ctx): Reply {
  const q = fold(query).trim();
  const next: Ctx = { ...ctx, offered: [...ctx.offered] };
  const out = (parts: Part[], sources: Source[] = [], suggestions: string[] = [], confident = true, retrieved: Chunk[] = []): Reply => ({ parts, sources, suggestions, ctx: next, confident, retrieved });
  const mentioned = topicChapters(query);
  const numCh = q.match(/cap(?:itulo|\.)?\s*(\d{1,2})|tema\s*(\d{1,2})/);
  const chNum = numCh ? parseInt(numCh[1] ?? numCh[2], 10) : undefined;
  if (chNum && chNum >= 1 && chNum <= 10) next.chapter = chNum;
  else if (mentioned.length === 1) next.chapter = mentioned[0];

  // saludo
  if (/^(hola|buenas|buenos dias|buenas tardes|hey|saludos)\b/.test(q) && q.length < 30)
    return out([{ type: 'rich', x: '¡Hola! Soy **Atlas Tutor**. Respondo con el contenido verificado del folleto *Cálculo II — Atlas del Cálculo*: teoría, fórmulas, ejemplos resueltos y ejercicios. Pregúntame un concepto, pide un ejemplo o un ejercicio por nivel PISA.' }], [], ['¿Qué es una derivada parcial?', '¿Cómo encuentro un centroide?', 'Dame un ejercicio de nivel PISA 3', 'Explícame el ejemplo 1.2']);

  // ejemplo concreto
  const ex = q.match(/ejemplo\s*(\d{1,2})\s*[.,]\s*(\d)/);
  if (ex) {
    const e = EXAMPLES.find((x) => x.id === `${parseInt(ex[1], 10)}.${ex[2]}`);
    if (e) {
      next.chapter = e.chapter; next.lastExample = e.id;
      const blocks: Block[] = [{ t: 'h4', x: `Ejemplo ${e.id}: ${e.title}` }, ...e.statement, ...e.phases.flatMap((p) => [{ t: 'h4', x: p.title }, ...p.blocks])];
      return out([{ type: 'rich', x: `Este es el **Ejemplo ${e.id}** del folleto, resuelto con el método de Pólya (cuatro fases):` }, { type: 'blocks', blocks }], [{ label: `Cap. ${e.chapter} · Ejemplo ${e.id}`, href: `/tema/${e.chapter}?tab=ejemplos` }], [`¿Cómo lo verifico con el Resolutor?`, `Dame un ejercicio parecido (capítulo ${e.chapter})`, `Errores frecuentes del capítulo ${e.chapter}`]);
    }
    return out([{ type: 'rich', x: `El folleto no tiene el ejemplo ${ex[1]}.${ex[2]}. Ejemplos disponibles: ${EXAMPLES.map((e) => e.id).join(', ')}.` }], [], [], false);
  }

  // ejercicio concreto
  const exo = q.match(/ejercicio\s*(\d{1,2})\s*[.,]\s*(\d)/);
  if (exo && exerciseById(`${parseInt(exo[1], 10)}.${exo[2]}`)) {
    const id = `${parseInt(exo[1], 10)}.${exo[2]}`;
    const e = exerciseById(id)!;
    next.chapter = e.chapter; next.lastExercise = id;
    return out([{ type: 'rich', x: `Ejercicio **${id}** (Nivel PISA ${e.level} — ${e.levelName}). Te guío con el método de Pólya, sin darte la respuesta de golpe:` }, { type: 'exercise', id }, { type: 'rich', x: POLYA_PROMPTS.join('\n\n') }], [{ label: `Ejercicio ${id}`, href: `/ejercicios/${id}` }], ['Dame una pista', 'Muéstrame la solución verificada']);
  }

  // pistas / solución del último ejercicio
  if (/\b(pista|ayuda con|no se como empezar)\b/.test(q) && ctx.lastExercise) {
    const s = solutionFor(ctx.lastExercise);
    if (s) return out([{ type: 'rich', x: `Pista para el ejercicio ${ctx.lastExercise}:\n\n${s.hints[0]}\n\n*¿Quieres otra pista?*` }], [{ label: `Ejercicio ${ctx.lastExercise}`, href: `/ejercicios/${ctx.lastExercise}` }], ['Otra pista', 'Muéstrame la solución verificada']);
  }
  if (/otra pista|segunda pista|mas pistas/.test(q) && ctx.lastExercise) {
    const s = solutionFor(ctx.lastExercise)!;
    return out([{ type: 'rich', x: `Segunda y tercera pista:\n\n- ${s.hints[1]}\n- ${s.hints[2]}` }], [], ['Muéstrame la solución verificada']);
  }
  if (/(solucion|respuesta|resultado).*(verificad|ejercicio)|muestrame la solucion/.test(q) && ctx.lastExercise) {
    const s = solutionFor(ctx.lastExercise)!;
    next.chapter = chapterById(parseInt(ctx.lastExercise, 10)).id;
    return out([{ type: 'rich', x: `**Solución verificada del ejercicio ${ctx.lastExercise}:**\n\n${s.answer}\n\n**Desarrollo:**\n\n${s.steps.map((t) => `- ${t}`).join('\n')}` }], [{ label: `Ejercicio ${ctx.lastExercise}`, href: `/ejercicios/${ctx.lastExercise}` }], ['Dame otro ejercicio']);
  }

  // dame un ejercicio (por nivel PISA y/o capítulo)
  if (/\b(ejercicio|problema|practica)\b/.test(q) && /(dame|dime|quiero|proponme|necesito|sugiere|recomienda|otro|otra|un ejercicio|nivel)/.test(q)) {
    const lvl = q.match(/nivel\s*(?:pisa\s*)?(\d)|pisa\s*(\d)/);
    const level = lvl ? parseInt(lvl[1] ?? lvl[2], 10) : undefined;
    const ch = chNum ?? next.chapter;
    if (level && (level < 1 || level > 6)) return out([{ type: 'rich', x: 'Los niveles PISA del folleto van del 1 al 6.' }], [], PISA_LEVELS.map((l) => `Dame un ejercicio de nivel PISA ${l.level}`).slice(0, 4), false);
    const id = pickExercise(level, ch, next.offered);
    if (id) {
      const e = exerciseById(id)!;
      next.offered.push(id); next.lastExercise = id; next.chapter = e.chapter;
      return out([{ type: 'rich', x: `Te propongo este ejercicio del folleto (**Capítulo ${e.chapter}**, Nivel PISA **${e.level}** — ${e.levelName}):` }, { type: 'exercise', id }, { type: 'rich', x: 'Antes de calcular, responde: ' + POLYA_PROMPTS[0].replace('**1. Comprender:** ', '') }], [{ label: `Ejercicio ${id}`, href: `/ejercicios/${id}` }], ['Dame una pista', 'Muéstrame la solución verificada', 'Dame otro ejercicio']);
    }
  }

  // Pólya
  if (/polya/.test(q)) {
    const b = INTRO.findIndex((x) => x.t === 'h2' && /P[oó]lya/.test(x.x ?? ''));
    const blocks: Block[] = [];
    for (let i = b; i < INTRO.length; i++) { if (i > b && INTRO[i].t === 'h2') break; blocks.push(INTRO[i]); }
    return out([{ type: 'blocks', blocks }], [{ label: 'Marco metodológico', href: '/biblioteca' }], ['Dame un ejercicio de nivel PISA 3', 'Explícame el ejemplo 1.2']);
  }

  // "¿por qué mi respuesta es incorrecta?"
  if (/(por que|porque|por qué).*(incorrect|mal|error|equivoc)|mi respuesta|me sale mal|no me sale|no coincide/.test(q)) {
    const ch = next.chapter;
    const parts: Part[] = [{ type: 'rich', x: 'Para diagnosticar tu error con rigor necesito ver tu procedimiento; no puedo adivinarlo. Mientras tanto, revisa esta lista con el método de Pólya:\n\n- ¿Identificaste bien la **incógnita** y los **datos**? (fase 1)\n- ¿Elegiste la **fórmula correcta** para este tipo de problema? (fase 2)\n- ¿Cambiaste los **límites de integración** al sustituir? ¿Respetaste el **orden** de integración? (fase 3)\n- ¿Tu resultado cumple una **comprobación de orden de magnitud** o una cota geométrica? (fase 4)\n\nPuedes pegar el enunciado en el **Resolutor paso a paso** y comparar cada paso con el tuyo.' }];
    if (ch) parts.push({ type: 'rich', x: `Errores frecuentes del **Capítulo ${ch}** según el folleto:` }, { type: 'errors', chapter: ch });
    return out(parts, ch ? [{ label: `Cap. ${ch} · Resumen`, href: `/tema/${ch}?tab=resumen` }] : [], ['Abrir el Resolutor', 'Explícame el método de Pólya'], true);
  }
  if (/errores? (frecuente|comun)/.test(q) && next.chapter) {
    return out([{ type: 'rich', x: `Errores frecuentes del **Capítulo ${next.chapter} — ${chapterById(next.chapter).title}**:` }, { type: 'errors', chapter: next.chapter }], [{ label: `Cap. ${next.chapter} · Resumen`, href: `/tema/${next.chapter}?tab=resumen` }], chapterSuggestions(next.chapter));
  }

  // temario
  if (/(que temas|cuales son los temas|temario|lista de capitulos|de que trata)/.test(q))
    return out([{ type: 'rich', x: 'El folleto cubre diez temas:\n\n' + CHAPTERS.map((c) => `${c.id}. ${c.title}`).join('\n') }], [], ['¿Qué es una derivada parcial?', 'Explícame las integrales dobles']);

  // seguimiento breve usando contexto
  let query2 = query;
  if (next.chapter && ((q.split(/\s+/).length <= 4 && /(ejemplo|formula|resumen|mas|continua|y ahora|profundiza)/.test(q)) || (/\bejemplo\b/.test(q) && /(dame|dime|muestra|quiero|otro|un ejemplo)/.test(q)))) {
    if (/ejemplo/.test(q)) {
      const c = chapterById(next.chapter);
      const pool = c.examples.filter((e) => e.id !== ctx.lastExample);
      const e = (pool.length ? pool : c.examples)[0];
      if (e) {
        next.lastExample = e.id;
        const blocks: Block[] = [{ t: 'h4', x: `Ejemplo ${e.id}: ${e.title}` }, ...e.statement, ...e.phases.flatMap((p) => [{ t: 'h4', x: p.title }, ...p.blocks])];
        return out([{ type: 'rich', x: `Siguiendo con el **Capítulo ${c.id}**, este es el **Ejemplo ${e.id}**:` }, { type: 'blocks', blocks }], [{ label: `Cap. ${c.id} · Ejemplo ${e.id}`, href: `/tema/${c.id}?tab=ejemplos` }], chapterSuggestions(c.id));
      }
    }
    if (/formula/.test(q)) {
      const c = chapterById(next.chapter);
      const blocks = c.summary.filter((b) => b.t === 'table').slice(0, 1);
      return out([{ type: 'rich', x: `Fórmulas esenciales del **Capítulo ${c.id}**:` }, { type: 'blocks', blocks }], [{ label: `Cap. ${c.id} · Resumen`, href: `/tema/${c.id}?tab=resumen` }], chapterSuggestions(c.id));
    }
    query2 = `${query} ${SHORT[next.chapter]}`;
  }

  // recuperación
  const faqDirect = FAQ.find((f) => fold(f.q).replace(/[¿?]/g, '').trim() === q.replace(/[¿?]/g, '').trim());
  const hits = search(query2, 4, { boostChapters: next.chapter && !mentioned.length ? [next.chapter] : undefined });
  const top = hits[0];
  if (!top || top.score < 0.12) {
    const near = hits.slice(0, 3).map((h) => h.chunk.title);
    return out([{ type: 'rich', x: 'No encontré contenido del folleto que responda con seguridad a esa pregunta. No quiero inventar una respuesta.' + (near.length ? `\n\nTemas cercanos que sí están en el folleto:\n\n${near.map((n) => `- ${n}`).join('\n')}` : '') + '\n\nReformula usando términos del temario (por ejemplo: *derivada parcial*, *centroide*, *integral doble*, *Hessiano*, *límite*), o activa la **IA local** (modalidad B) para una explicación más flexible.' }], [], ['¿Qué temas cubre el folleto?', 'Explícame las integrales dobles'], false, hits.map((h) => h.chunk));
  }
  const best = faqDirect ? (hits.find((h) => h.chunk.id === faqDirect.id)?.chunk ?? hits[0].chunk) : top.chunk;
  const picked = [best, ...hits.map((h) => h.chunk).filter((c) => c.id !== best.id && c.kind !== 'ejercicio' && c.kind !== 'glosario' && (c.chapter === best.chapter || c.kind === 'faq')).slice(0, 1)];
  if (best.chapter) next.chapter = best.chapter;
  const parts: Part[] = [];
  parts.push({ type: 'rich', x: best.kind === 'faq' ? '**Respuesta del folleto** (' + best.label + '):' : `Esto dice el folleto (${best.label}):` });
  parts.push({ type: 'blocks', blocks: best.blocks.slice(0, 14) });
  const second = picked[1];
  if (second) { parts.push({ type: 'rich', x: `**Relacionado** — ${second.title} (${second.label}):` }, { type: 'blocks', blocks: second.blocks.slice(0, 8) }); }
  const ch = best.chapter || next.chapter;
  return out(parts, picked.map(srcOf), ch ? chapterSuggestions(ch) : ['¿Qué es una derivada parcial?'], true, hits.map((h) => h.chunk));
}

/** Prompt con contexto recuperado para la modalidad B (IA local). */
export function buildContext(query: string, chapter?: number): { system: string; sources: Source[] } {
  const hits = search(query, 4, { boostChapters: chapter ? [chapter] : undefined, kinds: ['teoria', 'faq', 'ejemplo', 'resumen', 'aplicacion', 'intro'] });
  const ctx = hits.map((h, i) => `[Fragmento ${i + 1} — ${h.chunk.label}] ${h.chunk.text.slice(0, 900)}`).join('\n\n');
  const system = `Eres Atlas Tutor, un tutor de Cálculo II para estudiantes universitarios. Responde SIEMPRE en español, de forma breve y clara, usando LaTeX entre $...$ para las fórmulas. Basa tu respuesta en los fragmentos del folleto de abajo; si no alcanzan, dilo con honestidad y no inventes datos. No des resultados numéricos largos sin mostrar el planteamiento. Si el estudiante pide resolver un ejercicio, guíalo con el método de Pólya (comprender, planear, ejecutar, revisar).\n\nFRAGMENTOS DEL FOLLETO:\n${ctx}`;
  return { system, sources: hits.map((h) => ({ label: h.chunk.label, href: h.chunk.href })) };
}
