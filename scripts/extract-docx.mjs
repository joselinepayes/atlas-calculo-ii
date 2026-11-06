// Extrae el folleto Word (docx) a src/data/atlas.json con fórmulas convertidas a LaTeX.
// Uso: npm run extract
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import sharp from 'sharp';
import { XMLParser } from 'fast-xml-parser';
import { ommlToLatex } from './omml.mjs';

const root = path.resolve(import.meta.dirname, '..');
const SRC = path.join(root, 'content/source/Calculo_II_Atlas_del_Calculo.docx');
const zip = await JSZip.loadAsync(fs.readFileSync(SRC));
const parser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: false, processEntities: true });
const readXml = async (p) => parser.parse(await zip.file(p).async('string'));

const tagOf = (n) => Object.keys(n).find((k) => k !== ':@');
const kids = (n) => (n && n[tagOf(n)]) || [];
const attr = (n, a) => (n && n[':@'] ? n[':@']['@_' + a] : undefined);
const find = (nodes, tag) => nodes.find((n) => tagOf(n) === tag);
const findAll = (nodes, tag) => nodes.filter((n) => tagOf(n) === tag);

const doc = await readXml('word/document.xml');
const rels = await readXml('word/_rels/document.xml.rels');
const numbering = await readXml('word/numbering.xml');

const relMap = {};
for (const r of kids(find(rels, 'Relationships'))) relMap[attr(r, 'Id')] = attr(r, 'Target');

// numId -> ordenada?
const abstractFmt = {};
const numToAbs = {};
for (const n of kids(find(numbering, 'w:numbering'))) {
  if (tagOf(n) === 'w:abstractNum') {
    const lvl = find(kids(n), 'w:lvl');
    abstractFmt[attr(n, 'w:abstractNumId')] = attr(find(kids(lvl), 'w:numFmt'), 'w:val');
  } else if (tagOf(n) === 'w:num') {
    numToAbs[attr(n, 'w:numId')] = attr(find(kids(n), 'w:abstractNumId'), 'w:val');
  }
}
const isOrdered = (numId) => {
  const f = abstractFmt[numToAbs[numId]];
  return !!f && f !== 'bullet';
};

// media
fs.mkdirSync(path.join(root, 'public/img'), { recursive: true });
const mediaOut = {};
for (const name of Object.keys(zip.files).filter((n) => n.startsWith('word/media/'))) {
  const base = path.basename(name);
  const webp = base.replace(/.png$/, '.webp');
  await sharp(await zip.file(name).async('nodebuffer')).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(root, 'public/img', webp));
  mediaOut['media/' + base] = 'img/' + webp;
}

const textOfNodes = (nodes) =>
  nodes.map((n) => (tagOf(n) === '#text' ? String(n['#text']) : textOfNodes(kids(n)))).join('');

function runText(r) {
  const rpr = find(kids(r), 'w:rPr');
  const bold = rpr && find(kids(rpr), 'w:b') && attr(find(kids(rpr), 'w:b'), 'w:val') !== '0';
  let s = '';
  let img = null;
  for (const c of kids(r)) {
    const t = tagOf(c);
    if (t === 'w:t') s += textOfNodes(kids(c));
    else if (t === 'w:br') s += '\n';
    else if (t === 'w:tab') s += ' ';
    else if (t === 'w:drawing' || t === 'mc:AlternateContent' || t === 'w:pict') {
      const walk = (nodes) => {
        for (const n of nodes) {
          if (tagOf(n) === 'a:blip' && attr(n, 'r:embed')) img = relMap[attr(n, 'r:embed')];
          else walk(kids(n));
        }
      };
      walk(kids(c));
    }
  }
  return { s, bold: !!bold, img };
}

function paragraph(p) {
  const c = kids(p);
  const ppr = find(c, 'w:pPr');
  const style = ppr ? attr(find(kids(ppr), 'w:pStyle'), 'w:val') || '' : '';
  const numPr = ppr && find(kids(ppr), 'w:numPr');
  const numId = numPr ? attr(find(kids(numPr), 'w:numId'), 'w:val') : undefined;
  let out = '';
  const imgs = [];
  let hasText = false;
  let hasMath = false;
  let boldOpen = false;
  const closeBold = () => { if (boldOpen) { out += '**'; boldOpen = false; } };
  const addRuns = (nodes) => {
    for (const n of nodes) {
      const t = tagOf(n);
      if (t === 'w:r') {
        const r = runText(n);
        if (r.img) imgs.push(mediaOut[r.img] || r.img);
        if (!r.s) continue;
        if (r.s.trim()) hasText = true;
        if (r.bold && !boldOpen && r.s.trim()) { out += '**'; boldOpen = true; }
        if (!r.bold && boldOpen && r.s.trim()) closeBold();
        out += r.s;
      } else if (t === 'm:oMathPara') {
        closeBold();
        for (const m of findAll(kids(n), 'm:oMath')) { out += ` $${ommlToLatex(m)}$ `; hasMath = true; }
      } else if (t === 'm:oMath') {
        closeBold();
        out += `$${ommlToLatex(n)}$`; hasMath = true;
      } else if (t === 'w:hyperlink' || t === 'w:ins' || t === 'w:smartTag' || t === 'w:sdt' || t === 'w:sdtContent') {
        addRuns(kids(n));
      }
    }
  };
  addRuns(c);
  closeBold();
  out = out.replace(/\*\*\s*\*\*/g, ' ').replace(/[ \t]+\n/g, '\n');
  return { style, text: out.trim(), imgs, numId, hasText, hasMath };
}

const body = kids(find(doc, 'w:document')).find((n) => tagOf(n) === 'w:body');
const blocks = [];
for (const n of kids(body)) {
  const t = tagOf(n);
  if (t === 'w:p') {
    const p = paragraph(n);
    const { style, text } = p;
    if (style.startsWith('TOC') || style === 'TituloSeccion') continue;
    for (const src of p.imgs) blocks.push({ t: 'fig', src });
    if (!text) continue;
    let tt = 'p';
    if (style === 'Heading1') tt = 'h1';
    else if (style === 'Heading2') tt = 'h2';
    else if (style === 'Heading3') tt = 'h3';
    else if (style === 'Heading4') tt = 'h4';
    else if (style === 'FormulaRoja') tt = 'formula';
    else if (style === 'Definicion') tt = 'def';
    else if (style === 'Enunciado') tt = 'enun';
    else if (style === 'ImageCaption') tt = 'cap';
    else if (style === 'SourceCode') tt = 'code';
    else if (style === 'Compact' || p.numId) tt = 'li';
    else if (p.hasMath && !p.hasText) tt = 'math';
    // párrafo cuyo único contenido es una fórmula -> display
    const b = { t: tt, x: text };
    if (tt === 'li' && p.numId) b.ordered = isOrdered(p.numId);
    if (tt === 'p' && /^\$[^$]+\$$/.test(text)) b.t = 'math';
    blocks.push(b);
  } else if (t === 'w:tbl') {
    const rows = [];
    for (const tr of findAll(kids(n), 'w:tr')) {
      const cells = [];
      for (const tc of findAll(kids(tr), 'w:tc')) {
        const parts = findAll(kids(tc), 'w:p').map((p) => paragraph(p).text).filter(Boolean);
        cells.push(parts.join(' '));
      }
      rows.push(cells);
    }
    blocks.push({ t: 'table', rows });
  }
}
fs.mkdirSync(path.join(root, 'content'), { recursive: true });
fs.writeFileSync(path.join(root, 'content/raw-blocks.json'), JSON.stringify(blocks, null, 1));

// ------------- estructura -------------
const clean = (s) => s.replace(/\*\*/g, '').trim();
const chapters = [];
const extras = { presentacion: [], introduccion: [], conclusiones: [], glosario: [], bibliografia: [] };
let cur = null; // capítulo actual
let special = null;
let sec = null;
for (const b of blocks) {
  if (b.t === 'h1') {
    const title = clean(b.x);
    const m = title.match(/^(\d\d)\s*[—-]\s*(.+)$/);
    if (m) {
      cur = { id: parseInt(m[1], 10), num: m[1], title: m[2].trim(), sections: [] };
      chapters.push(cur);
      special = null;
    } else {
      cur = null;
      special = /Cr[eé]ditos/.test(title) ? 'presentacion' : /Introducci/.test(title) ? 'introduccion' : /Conclusiones/.test(title) ? 'conclusiones' : /Glosario/.test(title) ? 'glosario' : 'bibliografia';
    }
    sec = null;
    continue;
  }
  if (cur) {
    if (b.t === 'h2') {
      const t = clean(b.x);
      const m = t.match(/^([A-H])\.\s*(.+)$/);
      sec = { key: m ? m[1] : t, title: m ? m[2] : t, blocks: [] };
      cur.sections.push(sec);
    } else if (sec) sec.blocks.push(b);
  } else if (special) extras[special].push(b);
}

const LEVELS = ['Lectura directa', 'Interpretación directa', 'Procedimientos secuenciales', 'Modelos en situaciones complejas', 'Modelación con restricciones', 'Razonamiento y conceptualización avanzada'];
for (const ch of chapters) {
  const S = (k) => ch.sections.find((s) => s.key === k);
  ch.intro = S('A')?.blocks ?? [];
  ch.theory = S('B')?.blocks ?? [];
  ch.figures = S('C')?.blocks ?? [];
  ch.examples = [];
  let ex = null, ph = null;
  for (const b of S('D')?.blocks ?? []) {
    if (b.t === 'h3') {
      const t = clean(b.x);
      const m = t.match(/^Ejemplo\s+(\d+\.\d+):\s*(.+)$/);
      ex = { id: m ? m[1] : t, title: m ? m[2] : t, statement: [], phases: [] };
      ch.examples.push(ex); ph = null;
    } else if (ex && b.t === 'enun') ex.statement.push(b);
    else if (ex && b.t === 'h4') { ph = { title: clean(b.x), blocks: [] }; ex.phases.push(ph); }
    else if (ex && ph) ph.blocks.push(b);
    else if (ex) ex.statement.push(b);
  }
  ch.exercises = [];
  for (const b of S('E')?.blocks ?? []) {
    if (b.t !== 'li') continue;
    const m = clean(b.x).match(/^Nivel\s+(\d)\s*(?:\(([^)]+)\))?:\s*([\s\S]*)$/);
    if (!m) continue;
    const raw = b.x.replace(/^\*\*Nivel\s+\d\s*(?:\([^)]+\))?:\s*\*\*\s*/, '').replace(/^Nivel\s+\d\s*(?:\([^)]+\))?:\s*/, '');
    ch.exercises.push({ id: `${ch.id}.${m[1]}`, chapter: ch.id, level: +m[1], levelName: (m[2] || LEVELS[+m[1] - 1]).trim(), text: raw.trim() });
  }
  ch.applications = S('F')?.blocks ?? [];
  ch.summary = S('G')?.blocks ?? [];
  ch.references = (S('H')?.blocks ?? []).filter((b) => b.t === 'li').map((b) => b.x);
  delete ch.sections;
}

const out = { meta: { title: 'Cálculo II — Atlas del Cálculo', author: 'Joseline Vanessa Payes Mejia', university: 'Universidad Mariano Gálvez de Guatemala', license: 'CC BY-NC 4.0' }, ...extras, chapters, media: mediaOut };
fs.mkdirSync(path.join(root, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/data/atlas.json'), JSON.stringify(out));
console.log('bloques', blocks.length, 'capítulos', chapters.length);
for (const c of chapters) console.log(c.num, c.title.slice(0, 40), '| ej', c.examples.length, '| ejercicios', c.exercises.length, '| teoría', c.theory.length, '| fig', c.figures.filter((b) => b.t === 'fig').length);
