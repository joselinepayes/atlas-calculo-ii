// Conversor OMML (Office Math) -> LaTeX. Opera sobre el árbol de fast-xml-parser (preserveOrder).
const tagOf = (n) => Object.keys(n).find((k) => k !== ':@');
const kids = (n) => (n && n[tagOf(n)]) || [];
const attr = (n, a) => (n && n[':@'] ? (n[':@']['@_' + a] ?? n[':@']['@_m:' + a]) : undefined);
const find = (nodes, tag) => nodes.find((n) => tagOf(n) === tag);
const findAll = (nodes, tag) => nodes.filter((n) => tagOf(n) === tag);
const textOf = (nodes) =>
  nodes.map((n) => (tagOf(n) === '#text' ? String(n['#text']).replace(/​/g, '') : textOf(kids(n)))).join('');
const child = (c, tag) => kids(find(c, tag));

const SYM = {
  'π': '\\pi ', 'θ': '\\theta ', 'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ', 'Δ': '\\Delta ',
  'ε': '\\varepsilon ', 'λ': '\\lambda ', 'μ': '\\mu ', 'ρ': '\\rho ', 'σ': '\\sigma ', 'Σ': '\\Sigma ', 'φ': '\\varphi ',
  'ϕ': '\\phi ', 'ω': '\\omega ', 'Ω': '\\Omega ', 'ξ': '\\xi ', 'η': '\\eta ', 'τ': '\\tau ', 'κ': '\\kappa ', 'ψ': '\\psi ',
  'Φ': '\\Phi ', 'Γ': '\\Gamma ', 'Θ': '\\Theta ', 'Λ': '\\Lambda ', 'Π': '\\Pi ', 'Ψ': '\\Psi ', 'ζ': '\\zeta ', 'ν': '\\nu ',
  '∞': '\\infty ', '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '≈': '\\approx ', '≡': '\\equiv ', '→': '\\to ', '⇒': '\\Rightarrow ',
  '⇔': '\\Leftrightarrow ', '⟹': '\\Longrightarrow ', '←': '\\leftarrow ', '↔': '\\leftrightarrow ', '∈': '\\in ', '∉': '\\notin ',
  '⊂': '\\subset ', '⊆': '\\subseteq ', '∪': '\\cup ', '∩': '\\cap ', '∅': '\\emptyset ', '∀': '\\forall ', '∃': '\\exists ',
  '−': '-', '–': '-', '⋅': '\\cdot ', '·': '\\cdot ', '∙': '\\cdot ', '×': '\\times ', '÷': '\\div ', '±': '\\pm ', '∓': '\\mp ',
  '∂': '\\partial ', '∇': '\\nabla ', '∫': '\\int ', '∬': '\\iint ', '∭': '\\iiint ', '∑': '\\sum ', '∏': '\\prod ',
  '°': '^{\\circ}', '′': "'", '″': "''", '…': '\\ldots ', '⋯': '\\cdots ', '⋮': '\\vdots ', '∴': '\\therefore ',
  '∝': '\\propto ', '⊥': '\\perp ', '∥': '\\parallel ', '∠': '\\angle ', '∘': '\\circ ', '⟨': '\\langle ', '⟩': '\\rangle ',
  '⌊': '\\lfloor ', '⌋': '\\rfloor ', '⌈': '\\lceil ', '⌉': '\\rceil ', 'ℝ': '\\mathbb{R}', 'ℕ': '\\mathbb{N}', 'ℤ': '\\mathbb{Z}',
  'ℚ': '\\mathbb{Q}', 'ℂ': '\\mathbb{C}', '⃗': '', ' ': '\\ ', ' ': '\\,', ' ': '\\ ', ' ': '\\quad ',
  '%': '\\%', '#': '\\#', '&': '\\&', '$': '\\$', '_': '\\_', '{': '\\{', '}': '\\}', '∼': '\\sim ', '≪': '\\ll ', '≫': '\\gg ',
  '⁄': '/', '∖': '\\setminus ', '⊕': '\\oplus ', '⊗': '\\otimes ', '△': '\\triangle ', '□': '\\square ', '∎': '\\blacksquare ',
  '√': '\\sqrt{}', '∮': '\\oint ',
};
const mapText = (s) => [...s].map((c) => SYM[c] ?? c).join('');
const FUNCS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'exp', 'lim', 'max', 'min', 'det', 'arcsin', 'arccos', 'arctan', 'sup', 'inf', 'gcd', 'dim', 'ker'];
const NARY = { '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint', '∑': '\\sum', '∏': '\\prod', '⋃': '\\bigcup', '⋂': '\\bigcap' };
const DELIM = { '(': '(', ')': ')', '[': '[', ']': ']', '{': '\\{', '}': '\\}', '|': '|', '‖': '\\|', '⟨': '\\langle', '⟩': '\\rangle', '⌊': '\\lfloor', '⌋': '\\rfloor', '⌈': '\\lceil', '⌉': '\\rceil' };
const ACC = { '⃗': '\\vec', '̂': '\\hat', '^': '\\hat', '̅': '\\bar', '¯': '\\bar', '̇': '\\dot', '̈': '\\ddot', '̃': '\\tilde', '~': '\\tilde', '→': '\\vec' };

const g = (s) => `{${s}}`;
const isOn = (n) => !!n && !['0', 'false', 'off'].includes(String(attr(n, 'val')));

export function omml(nodes) {
  let out = '';
  for (const n of nodes) {
    const t = tagOf(n);
    const c = kids(n);
    if (t === '#text') continue;
    if (t.endsWith('Pr') || t === 'w:rPr') continue;
    switch (t) {
      case 'm:r': {
        const pr = find(c, 'm:rPr');
        const nor = pr && find(kids(pr), 'm:nor');
        const sty = pr && find(kids(pr), 'm:sty');
        const txt = textOf(findAll(c, 'm:t'));
        if (isOn(nor)) out += `\\text{${txt.replace(/([#$%&_{}])/g, '\\$1')}}`;
        else if (sty && attr(sty, 'val') === 'p' && /^[A-Za-z]{2,}$/.test(txt)) out += FUNCS.includes(txt) ? `\\${txt} ` : `\\mathrm{${txt}}`;
        else out += mapText(txt);
        break;
      }
      case 'm:f': {
        const fpr = find(c, 'm:fPr');
        const type = fpr ? attr(find(kids(fpr), 'm:type'), 'val') : undefined;
        const num = omml(child(c, 'm:num'));
        const den = omml(child(c, 'm:den'));
        out += type === 'noBar' ? `\\binom${g(num)}${g(den)}` : type === 'lin' ? `${num}/${den}` : `\\frac${g(num)}${g(den)}`;
        break;
      }
      case 'm:rad': {
        const pr = find(c, 'm:radPr');
        const hide = pr && find(kids(pr), 'm:degHide');
        const deg = omml(child(c, 'm:deg'));
        const e = omml(child(c, 'm:e'));
        out += isOn(hide) || !deg.trim() ? `\\sqrt${g(e)}` : `\\sqrt[${deg}]${g(e)}`;
        break;
      }
      case 'm:sSup': out += `${g(omml(child(c, 'm:e')))}^${g(omml(child(c, 'm:sup')))}`; break;
      case 'm:sSub': out += `${g(omml(child(c, 'm:e')))}_${g(omml(child(c, 'm:sub')))}`; break;
      case 'm:sSubSup': out += `${g(omml(child(c, 'm:e')))}_${g(omml(child(c, 'm:sub')))}^${g(omml(child(c, 'm:sup')))}`; break;
      case 'm:sPre': out += `{}_${g(omml(child(c, 'm:sub')))}^${g(omml(child(c, 'm:sup')))}${g(omml(child(c, 'm:e')))}`; break;
      case 'm:nary': {
        const pr = find(c, 'm:naryPr');
        const chrN = pr && find(kids(pr), 'm:chr');
        const ch = chrN ? attr(chrN, 'val') : '∫';
        const sh = pr && find(kids(pr), 'm:subHide');
        const uh = pr && find(kids(pr), 'm:supHide');
        const lo = omml(child(c, 'm:sub')).trim();
        const hi = omml(child(c, 'm:sup')).trim();
        const e = omml(child(c, 'm:e'));
        let s = NARY[ch] ?? (ch ? mapText(ch) : '\\int');
        if (lo && !isOn(sh)) s += `_${g(lo)}`;
        if (hi && !isOn(uh)) s += `^${g(hi)}`;
        out += `${s} ${e}`;
        break;
      }
      case 'm:d': {
        const pr = find(c, 'm:dPr');
        const get = (tag, def) => {
          const x = pr && find(kids(pr), tag);
          if (!x) return def;
          const v = attr(x, 'val');
          return v === undefined ? def : v;
        };
        const beg = get('m:begChr', '('), end = get('m:endChr', ')'), sep = get('m:sepChr', '|');
        const items = findAll(c, 'm:e').map((e) => omml(kids(e)));
        const L = beg === '' ? '.' : DELIM[beg] ?? beg;
        const R = end === '' ? '.' : DELIM[end] ?? end;
        const S = sep === '|' ? '\\mid ' : DELIM[sep] ?? sep;
        out += `\\left${L} ${items.join(S)} \\right${R}`;
        break;
      }
      case 'm:func': {
        const name = omml(child(c, 'm:fName')).trim();
        const e = omml(child(c, 'm:e'));
        const plain = name.replace(/\\mathrm\{|\}|\\|\s/g, '');
        const fn = FUNCS.includes(plain) ? `\\${plain} ` : name.startsWith('\\') || name.includes('_') || name.includes('^') ? name : `\\operatorname{${name}} `;
        out += `${fn}${e}`;
        break;
      }
      case 'm:limLow': case 'm:limUpp': {
        const e = omml(child(c, 'm:e')).trim();
        const lim = omml(child(c, 'm:lim'));
        const plain = e.replace(/\\mathrm\{|\}|\\|\s/g, '');
        if (t === 'm:limLow') out += FUNCS.includes(plain) ? `\\${plain}_${g(lim)} ` : `\\underset${g(lim)}${g(e)}`;
        else out += `\\overset${g(lim)}${g(e)}`;
        break;
      }
      case 'm:acc': {
        const pr = find(c, 'm:accPr');
        const chrN = pr && find(kids(pr), 'm:chr');
        const ch = chrN ? attr(chrN, 'val') : '̂';
        out += `${ACC[ch] ?? '\\hat'}${g(omml(child(c, 'm:e')))}`;
        break;
      }
      case 'm:bar': {
        const pr = find(c, 'm:barPr');
        const pos = pr && find(kids(pr), 'm:pos');
        const e = omml(child(c, 'm:e'));
        out += pos && attr(pos, 'val') === 'bot' ? `\\underline${g(e)}` : `\\overline${g(e)}`;
        break;
      }
      case 'm:eqArr': out += `\\begin{aligned}${findAll(c, 'm:e').map((e) => omml(kids(e))).join(' \\\\ ')}\\end{aligned}`; break;
      case 'm:m': out += `\\begin{matrix}${findAll(c, 'm:mr').map((r) => findAll(kids(r), 'm:e').map((e) => omml(kids(e))).join(' & ')).join(' \\\\ ')}\\end{matrix}`; break;
      case 'm:groupChr': {
        const pr = find(c, 'm:groupChrPr');
        const pos = pr && find(kids(pr), 'm:pos');
        const e = omml(child(c, 'm:e'));
        out += pos && attr(pos, 'val') === 'top' ? `\\overbrace${g(e)}` : `\\underbrace${g(e)}`;
        break;
      }
      default: out += omml(c);
    }
  }
  return out;
}

export function ommlToLatex(oMathNode) {
  return omml(kids(oMathNode)).replace(/\s+/g, ' ').trim();
}
