import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { search, type ChunkKind } from '../lib/search';

const KIND: Record<ChunkKind, string> = { teoria: 'Teoría', ejemplo: 'Ejemplo', ejercicio: 'Ejercicio', glosario: 'Glosario', resumen: 'Resumen', aplicacion: 'Aplicación', faq: 'Pregunta frecuente', intro: 'Introducción' };

export default function SearchDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (href: string) => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => (q.trim().length > 1 ? search(q, 10) : []), [q]);
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => ref.current?.focus(), 30); } }, [open]);
  useEffect(() => setSel(0), [q]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid items-start justify-items-center pt-[10vh] px-4 bg-black/50" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Buscador global">
      <div className="card w-full max-w-2xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <Search className="w-5 h-5 text-muted" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca: derivada parcial, centroide, ejemplo 1.2…" className="flex-1 bg-transparent py-4 outline-none text-base"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              else if (e.key === 'Enter' && hits[sel]) onPick(hits[sel].chunk.href);
            }} />
          <button className="btn btn-ghost !p-1.5" onClick={onClose} aria-label="Cerrar"><X className="w-4 h-4" /></button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto" role="listbox">
          {hits.map((h, i) => (
            <li key={h.chunk.id} role="option" aria-selected={i === sel}>
              <button className={`w-full text-left px-4 py-3 border-b border-line/60 ${i === sel ? 'bg-lav' : 'hover:bg-surface2'}`} onMouseEnter={() => setSel(i)} onClick={() => onPick(h.chunk.href)}>
                <span className="flex items-center gap-2 text-xs text-muted"><span className="chip">{KIND[h.chunk.kind]}</span>{h.chunk.label}</span>
                <span className="block font-semibold mt-1">{h.chunk.title.replace(/\$/g, '')}</span>
                <span className="block text-sm text-muted line-clamp-2">{h.chunk.text.slice(0, 160)}…</span>
              </button>
            </li>
          ))}
          {q.trim().length > 1 && !hits.length && <li className="p-6 text-center text-muted text-sm">Sin resultados en el folleto para “{q}”.</li>}
          {q.trim().length <= 1 && <li className="p-6 text-center text-muted text-sm">Escribe al menos 2 letras. La búsqueda recorre teoría, ejemplos, 60 ejercicios, glosario y preguntas frecuentes, sin conexión.</li>}
        </ul>
      </div>
    </div>
  );
}
