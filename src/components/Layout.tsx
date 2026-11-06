import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, BookOpen, Bot, Calculator, GraduationCap, Info, LayoutDashboard, LibraryBig, LineChart, ListChecks, Menu, Moon, Search, Sun, X, Sigma } from 'lucide-react';
import { actions, applyTheme, useStore } from '../lib/storage';
import SearchDialog from './SearchDialog';

const NAV: { to: string; label: string; icon: ReactNode; end?: boolean }[] = [
  { to: '/', label: 'Inicio', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
  { to: '/temas', label: 'Temas', icon: <BookOpen className="w-4 h-4" /> },
  { to: '/tutor', label: 'Atlas Tutor', icon: <Bot className="w-4 h-4" /> },
  { to: '/resolutor', label: 'Resolutor', icon: <Calculator className="w-4 h-4" /> },
  { to: '/ejercicios', label: 'Ejercicios', icon: <ListChecks className="w-4 h-4" /> },
  { to: '/graficas', label: 'Gráficas', icon: <LineChart className="w-4 h-4" /> },
  { to: '/practica', label: 'Práctica y examen', icon: <GraduationCap className="w-4 h-4" /> },
  { to: '/progreso', label: 'Progreso', icon: <BarChart3 className="w-4 h-4" /> },
  { to: '/biblioteca', label: 'Biblioteca', icon: <LibraryBig className="w-4 h-4" /> },
  { to: '/acerca', label: 'Acerca de', icon: <Info className="w-4 h-4" /> },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand text-brandfg shadow"><Sigma className="w-5 h-5" /></span>
      <div className="leading-tight">
        <p className="font-display font-bold text-brandtext text-lg">Atlas del Cálculo II</p>
        <p className="text-[11px] tracking-widest uppercase text-gold font-semibold">Laboratorio matemático</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Navegación principal">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-brand text-brandfg shadow' : 'text-muted hover:bg-lav hover:text-fg'}`}>
          {n.icon}{n.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const theme = useStore((s) => s.theme);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = () => applyTheme('system');
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [theme]);
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [loc.pathname]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-primary">Saltar al contenido</a>
      <aside className="hidden lg:flex flex-col gap-6 sticky top-0 h-screen p-5 border-r border-line bg-surface overflow-y-auto">
        <Brand />
        <NavList />
        <p className="mt-auto text-xs text-muted leading-relaxed">100 % gratuito · sin cuentas · todo se ejecuta en tu navegador. Tus datos se guardan sólo en este dispositivo.</p>
      </aside>

      <div className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-line bg-bg/85 backdrop-blur">
          <button className="lg:hidden btn btn-ghost !p-2 shrink-0" aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu className="w-5 h-5" /></button>
          <button onClick={() => setSearch(true)} className="flex-1 min-w-0 max-w-xl flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-line text-muted text-sm text-left hover:border-violet transition-colors" aria-label="Buscar en el folleto (Ctrl+K)">
            <Search className="w-4 h-4" /><span className="truncate">Buscar teoría, ejemplos, ejercicios…</span>
            <kbd className="ml-auto hidden sm:inline text-[10px] border border-line rounded px-1.5 py-0.5">Ctrl K</kbd>
          </button>
          <button className="btn btn-ghost !p-2 shrink-0" aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={() => actions.setTheme(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <main id="main" className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1400px] w-full mx-auto">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            <Outlet />
          </motion.div>
        </main>
        <footer className="px-6 py-6 text-center text-xs text-muted border-t border-line">
          Contenido del folleto © 2026 Joseline Vanessa Payes Mejia · CC BY-NC 4.0 · Universidad Mariano Gálvez de Guatemala
        </footer>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed z-50 inset-y-0 left-0 w-72 max-w-[85vw] p-5 flex flex-col gap-6 bg-surface border-r border-line lg:hidden overflow-y-auto" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }} role="dialog" aria-label="Menú">
              <div className="flex items-center justify-between"><Brand /><button className="btn btn-ghost !p-2" aria-label="Cerrar menú" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button></div>
              <NavList onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <SearchDialog open={search} onClose={() => setSearch(false)} onPick={(href) => { setSearch(false); nav(href); }} />
    </div>
  );
}
