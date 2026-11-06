import { useSyncExternalStore } from 'react';

export interface Attempt { n: number; correct: number; solved: boolean; last: number }
export interface HistoryItem { t: number; type: 'ejercicio' | 'resolutor' | 'tutor' | 'examen' | 'tema' | 'practica'; label: string; ref?: string }
export interface ExamAnswer { id: string; given: string; correct: boolean | null; chapter: number; level: number }
export interface ExamResult { t: number; mode: 'practica' | 'examen'; chapters: number[]; levels: number[]; total: number; correct: number; seconds: number; answers: ExamAnswer[] }
export interface ChatMsg { role: 'user' | 'assistant'; text: string; mode?: 'A' | 'B' }
export interface State {
  v: 1;
  theme: 'light' | 'dark' | 'system';
  chaptersDone: number[];
  attempts: Record<string, Attempt>;
  favorites: string[];
  history: HistoryItem[];
  exams: ExamResult[];
  lastChapter?: number;
}

const KEY = 'atlas-calculo-ii:v1';
const empty = (): State => ({ v: 1, theme: 'system', chaptersDone: [], attempts: {}, favorites: [], history: [], exams: [] });

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return normalize(JSON.parse(raw));
  } catch {
    return empty();
  }
}
export function normalize(p: any): State {
  const e = empty();
  if (!p || typeof p !== 'object') return e;
  return {
    v: 1,
    theme: ['light', 'dark', 'system'].includes(p.theme) ? p.theme : 'system',
    chaptersDone: Array.isArray(p.chaptersDone) ? p.chaptersDone.filter((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 10) : [],
    attempts: p.attempts && typeof p.attempts === 'object' ? p.attempts : {},
    favorites: Array.isArray(p.favorites) ? p.favorites.filter((s: unknown) => typeof s === 'string') : [],
    history: Array.isArray(p.history) ? p.history.slice(0, 300) : [],
    exams: Array.isArray(p.exams) ? p.exams.slice(0, 100) : [],
    lastChapter: Number.isInteger(p.lastChapter) ? p.lastChapter : undefined,
  };
}

let state: State = load();
const listeners = new Set<() => void>();
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* almacenamiento no disponible: la app sigue funcionando en memoria */ }
}
function set(mut: (s: State) => State) {
  state = mut(state);
  persist();
  listeners.forEach((l) => l());
}
export const getState = () => state;
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => sel(state));
}

export const actions = {
  setTheme: (theme: State['theme']) => set((s) => ({ ...s, theme })),
  toggleChapter: (id: number) => set((s) => ({ ...s, chaptersDone: s.chaptersDone.includes(id) ? s.chaptersDone.filter((x) => x !== id) : [...s.chaptersDone, id].sort((a, b) => a - b) })),
  visitChapter: (id: number) => set((s) => ({ ...s, lastChapter: id })),
  toggleFavorite: (id: string) => set((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] })),
  record: (id: string, correct: boolean | null) => set((s) => {
    const a = s.attempts[id] ?? { n: 0, correct: 0, solved: false, last: 0 };
    const next: Attempt = { n: a.n + 1, correct: a.correct + (correct ? 1 : 0), solved: a.solved || !!correct, last: Date.now() };
    return { ...s, attempts: { ...s.attempts, [id]: next } };
  }),
  markViewed: (id: string) => set((s) => (s.attempts[id] ? s : { ...s, attempts: { ...s.attempts, [id]: { n: 0, correct: 0, solved: false, last: Date.now() } } })),
  log: (item: Omit<HistoryItem, 't'>) => set((s) => ({ ...s, history: [{ ...item, t: Date.now() }, ...s.history].slice(0, 300) })),
  addExam: (r: ExamResult) => set((s) => ({ ...s, exams: [r, ...s.exams].slice(0, 100) })),
  clearHistory: () => set((s) => ({ ...s, history: [] })),
  reset: () => set(() => empty()),
  importJson: (text: string): { ok: boolean; error?: string } => {
    try {
      const p = JSON.parse(text);
      if (!p || p.v !== 1) return { ok: false, error: 'El archivo no es un respaldo válido de Atlas Cálculo II (versión 1).' };
      set(() => normalize(p));
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo leer el archivo JSON.' };
    }
  },
  exportJson: () => JSON.stringify(state, null, 2),
};

/** Aplica el tema (claro/oscuro/sistema) al <html>. */
export function applyTheme(theme: State['theme']) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export const selectors = {
  solvedCount: (s: State) => Object.values(s.attempts).filter((a) => a.solved).length,
  attemptedCount: (s: State) => Object.values(s.attempts).filter((a) => a.n > 0).length,
  totalAttempts: (s: State) => Object.values(s.attempts).reduce((t, a) => t + a.n, 0),
  totalCorrect: (s: State) => Object.values(s.attempts).reduce((t, a) => t + a.correct, 0),
};
