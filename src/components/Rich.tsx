import { Fragment, memo, type ReactNode } from 'react';
import katex from 'katex';
import type { Block } from '../data/atlas';

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`.replace(/^\.\/\.\//, './');

const cache = new Map<string, string>();
export function tex(s: string, display = false): string {
  const key = (display ? 'D' : 'I') + s;
  let v = cache.get(key);
  if (v === undefined) {
    try { v = katex.renderToString(s, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html', trust: false }); }
    catch { v = `<code>${s.replace(/</g, '&lt;')}</code>`; }
    cache.set(key, v);
  }
  return v;
}
export const Tex = memo(function Tex({ x, display = false }: { x: string; display?: boolean }) {
  return <span className={display ? 'math-display block' : undefined} dangerouslySetInnerHTML={{ __html: tex(x, display) }} />;
});

const MATH = /\$((?:\\.|[^$\\])+)\$/g;

function inline(text: string, keyPrefix: string, displayAll = false): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  const pushText = (t: string) => {
    // negritas **...** y cursivas *...*
    const parts = t.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
    parts.forEach((p, k) => {
      if (!p) return;
      if (p.startsWith('**') && p.endsWith('**')) out.push(<strong key={`${keyPrefix}-b${i}-${k}`}>{p.slice(2, -2)}</strong>);
      else if (p.startsWith('*') && p.endsWith('*') && p.length > 2) out.push(<em key={`${keyPrefix}-e${i}-${k}`}>{p.slice(1, -1)}</em>);
      else out.push(<Fragment key={`${keyPrefix}-t${i}-${k}`}>{p}</Fragment>);
    });
  };
  for (const m of text.matchAll(MATH)) {
    if (m.index! > last) pushText(text.slice(last, m.index));
    out.push(<Tex key={`${keyPrefix}-m${i++}`} x={m[1]} display={displayAll} />);
    last = m.index! + m[0].length;
  }
  if (last < text.length) pushText(text.slice(last));
  return out;
}

/** Texto enriquecido: $LaTeX$, **negrita**, *cursiva*, listas "- " y párrafos separados por línea en blanco. */
export const Rich = memo(function Rich({ x, className, as = 'span' }: { x: string; className?: string; as?: 'span' | 'div' }) {
  if (as === 'span' && !x.includes('\n')) return <span className={className}>{inline(x, 'r')}</span>;
  const paras = x.split(/\n{2,}/);
  return (
    <div className={className}>
      {paras.map((p, i) => {
        const lines = p.split('\n');
        if (lines.every((l) => /^\s*-\s+/.test(l))) return <ul key={i} className="list-disc ml-5 my-2 space-y-1">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*-\s+/, ''), `r${i}-${j}`)}</li>)}</ul>;
        return <p key={i} className="my-2">{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, `r${i}-${j}`)}</Fragment>)}</p>;
      })}
    </div>
  );
});

export function Blocks({ blocks, className = '' }: { blocks: Block[]; className?: string }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const k = `b${i}`;
    switch (b.t) {
      case 'h2': out.push(<h3 key={k}>{b.x?.replace(/\*\*/g, '')}</h3>); break;
      case 'h3': out.push(<h3 key={k}>{b.x?.replace(/\*\*/g, '')}</h3>); break;
      case 'h4': out.push(<h4 key={k}>{b.x?.replace(/\*\*/g, '')}</h4>); break;
      case 'math': out.push(<div key={k} className="flex flex-wrap gap-x-6 gap-y-1 items-baseline">{inline(b.x!, k, true)}</div>); break;
      case 'formula': out.push(<div key={k} className="formula-red">{inline(b.x!, k, true)}</div>); break;
      case 'def': out.push(<div key={k} className="def-box"><Rich x={b.x!} /></div>); break;
      case 'enun': out.push(<div key={k} className="enun-box"><Rich x={b.x!} /></div>); break;
      case 'code': out.push(<pre key={k}><code>{b.x}</code></pre>); break;
      case 'cap': out.push(<p key={k} className="text-sm text-muted"><Rich x={b.x!} /></p>); break;
      case 'fig': case 'img': {
        const cap = blocks[i + 1]?.t === 'cap' ? blocks[i + 1] : undefined;
        out.push(<figure key={k}><img src={asset(b.src!)} alt={cap ? cap.x!.replace(/[$*]/g, '') : 'Figura del folleto'} loading="lazy" />{cap && <figcaption><Rich x={cap.x!} /></figcaption>}</figure>);
        if (cap) i++;
        break;
      }
      case 'li': {
        const items: Block[] = [];
        while (i < blocks.length && blocks[i].t === 'li') items.push(blocks[i++]);
        i--;
        const L = items[0].ordered ? 'ol' : 'ul';
        out.push(<L key={k}>{items.map((it, j) => <li key={j}><Rich x={it.x!} /></li>)}</L>);
        break;
      }
      case 'table': {
        const rows = b.rows ?? [];
        const header = rows[0]?.every((c) => c.startsWith('**'));
        out.push(
          <div key={k} className="overflow-x-auto"><table>
            {header && <thead><tr>{rows[0].map((c, j) => <th key={j}><Rich x={c.replace(/\*\*/g, '')} /></th>)}</tr></thead>}
            <tbody>{rows.slice(header ? 1 : 0).map((r, j) => <tr key={j}>{r.map((c, l) => <td key={l}><Rich x={c} /></td>)}</tr>)}</tbody>
          </table></div>,
        );
        break;
      }
      default: out.push(<p key={k}><Rich x={b.x ?? ''} /></p>);
    }
  }
  return <div className={`atlas-prose ${className}`}>{out}</div>;
}
