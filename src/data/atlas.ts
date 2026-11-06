import raw from './atlas.json';
import { SOLUTIONS, type Solution } from './solutions';

export interface Block { t: string; x?: string; src?: string; rows?: string[][]; ordered?: boolean }
export interface Phase { title: string; blocks: Block[] }
export interface Example { id: string; title: string; statement: Block[]; phases: Phase[]; chapter: number }
export interface Exercise { id: string; chapter: number; level: number; levelName: string; text: string }
export interface Chapter {
  id: number; num: string; title: string;
  intro: Block[]; theory: Block[]; figures: Block[]; examples: Example[]; exercises: Exercise[];
  applications: Block[]; summary: Block[]; references: string[];
}

const data = raw as unknown as {
  meta: { title: string; author: string; university: string; license: string };
  presentacion: Block[]; introduccion: Block[]; conclusiones: Block[]; glosario: Block[]; bibliografia: Block[];
  chapters: Omit<Chapter, 'examples'>[] & { examples: Omit<Example, 'chapter'>[] }[];
};

export const META = data.meta;
export const INTRO = data.introduccion;
export const PRESENTACION = data.presentacion;
export const CONCLUSIONES = data.conclusiones;
export const BIBLIOGRAFIA = data.bibliografia;
export const CHAPTERS: Chapter[] = (data.chapters as any[]).map((c) => ({ ...c, examples: c.examples.map((e: any) => ({ ...e, chapter: c.id })) }));
export const EXERCISES: Exercise[] = CHAPTERS.flatMap((c) => c.exercises);
export const EXAMPLES: Example[] = CHAPTERS.flatMap((c) => c.examples);
export const GLOSSARY: { term: string; def: string }[] = (data.glosario.find((b) => b.t === 'table')?.rows ?? []).slice(1).map((r) => ({ term: r[0].replace(/\*\*/g, ''), def: r[1] }));

export const chapterById = (id: number) => CHAPTERS.find((c) => c.id === id)!;
export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id);
export const solutionFor = (id: string): Solution | undefined => SOLUTIONS[id];

export const SHORT: Record<number, string> = {
  1: 'Superficies de revolución', 2: 'Valor promedio', 3: 'Centroides', 4: 'Varias variables I', 5: 'Varias variables II',
  6: 'Promedio multivariable', 7: 'Centroides y dobles', 8: 'Límites y continuidad', 9: 'Derivadas parciales', 10: 'Regla de la cadena y extremos',
};
export const CH_ICON: Record<number, string> = { 1: 'Layers', 2: 'TrendingUp', 3: 'Scale', 4: 'Box', 5: 'Shapes', 6: 'Sigma', 7: 'Target', 8: 'Infinity', 9: 'GitBranch', 10: 'Mountain' };

export const PISA_LEVELS = [
  { level: 1, name: 'Lectura directa', difficulty: 'Básico' },
  { level: 2, name: 'Interpretación directa', difficulty: 'Básico' },
  { level: 3, name: 'Procedimientos secuenciales', difficulty: 'Intermedio' },
  { level: 4, name: 'Modelos en situaciones complejas', difficulty: 'Intermedio' },
  { level: 5, name: 'Modelación con restricciones', difficulty: 'Avanzado' },
  { level: 6, name: 'Razonamiento y conceptualización avanzada', difficulty: 'Avanzado' },
] as const;
export const difficultyOf = (level: number) => PISA_LEVELS[level - 1].difficulty;

/** Fórmulas clave (bloques "FormulaRoja") por capítulo. */
export const formulasOf = (c: Chapter): string[] => c.theory.filter((b) => b.t === 'formula').map((b) => b.x!);

/** Texto plano (sin LaTeX) para búsquedas y modelos de lenguaje. */
export function plain(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .replace(/\\(?:iiint|iint)/g, ' integral multiple ')
    .replace(/\\int/g, ' integral ')
    .replace(/\\partial/g, ' parcial ')
    .replace(/\\nabla/g, ' gradiente ')
    .replace(/\\sum/g, ' suma ')
    .replace(/\\sqrt/g, ' raiz ')
    .replace(/\\lim/g, ' limite ')
    .replace(/\\(?:left|right|,|;|!|quad|qquad|text|mathrm|operatorname|displaystyle|tfrac|dfrac|frac|begin|end)/g, ' ')
    .replace(/\\([a-zA-Z]+)/g, ' $1 ')
    .replace(/[${}^_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export const blockText = (b: Block): string => (b.t === 'table' ? (b.rows ?? []).map((r) => r.join(' ')).join(' ') : b.x ?? '');

/** Primera frase de la "Contextualización" del capítulo (para tarjetas). */
export function blurbOf(c: Chapter): string {
  const i = c.intro.findIndex((b) => b.t === 'h4' && /Contextualizaci/.test(b.x ?? ''));
  const p = c.intro.slice(i + 1).find((b) => b.t === 'p' && b.x);
  const t = (p?.x ?? '').replace(/\$[^$]*\$/g, '…').replace(/\*\*/g, '');
  const m = t.match(/^(.{60,220}?[.!?])\s/);
  return m ? m[1] : t.slice(0, 200);
}
export const objectivesOf = (c: Chapter): string[] => {
  const i = c.intro.findIndex((b) => b.t === 'h4' && /Objetivos/.test(b.x ?? ''));
  const out: string[] = [];
  for (let k = i + 1; k < c.intro.length && c.intro[k].t !== 'h4'; k++) if (c.intro[k].t === 'li') out.push(c.intro[k].x!);
  return out;
};
