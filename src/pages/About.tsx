import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { META } from '../data/atlas';

const FREE = [
  'Sin APIs de pago ni claves: no se usa OpenAI, Claude, Gemini ni servicios similares.',
  'Sin backend ni bases de datos: es un sitio estático (GitHub Pages) y los datos viven en tu navegador.',
  'Sin cuentas, sin tarjetas, sin suscripciones, sin dominio propio.',
  'Las funciones principales (temario, tutor local, resolutor, ejercicios, gráficas, examen, progreso) funcionan sin conexión a servicios de terceros.',
  'La IA local es opcional: descarga un modelo abierto sólo si la activas y nunca impide el uso del sitio.',
];
const LIMITS = [
  'El tutor académico (modalidad A) no es una IA generativa: recupera y muestra contenido del folleto; si no encuentra algo, lo dice.',
  'El Resolutor sólo resuelve las 11 categorías con plantilla verificada; para lo demás informa su limitación en lugar de inventar pasos. Las integrales sin primitiva elemental se evalúan numéricamente (y se rotulan como tales).',
  'Los límites multivariables por trayectorias sirven para refutar existencia, no para demostrarla.',
  'La IA local (WebLLM) puede equivocarse, requiere WebGPU y una descarga de cientos de MB.',
  'Los enunciados de los 60 ejercicios son los originales del folleto; las pistas y soluciones fueron redactadas para esta plataforma y se contrastan con el motor matemático mediante pruebas automáticas.',
];

export default function About() {
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Acerca de" title="Atlas del Cálculo II" desc="Plataforma educativa 100 % gratuita basada en el folleto académico “Cálculo II — Atlas del Cálculo”." />
      <div className="space-y-5">
        <section className="card p-5"><h2 className="font-display text-xl font-bold text-brandtext flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-gold" /> Gratis de verdad</h2>
          <ul className="mt-3 space-y-2 text-sm">{FREE.map((f) => <li key={f} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" />{f}</li>)}</ul></section>
        <section className="card p-5"><h2 className="font-display text-xl font-bold text-brandtext">Alcance y límites (transparencia)</h2>
          <ul className="mt-3 list-disc ml-5 space-y-2 text-sm">{LIMITS.map((f) => <li key={f}>{f}</li>)}</ul></section>
        <section className="card p-5"><h2 className="font-display text-xl font-bold text-brandtext">Privacidad</h2>
          <p className="text-sm mt-2">No hay analítica ni rastreadores. Tu progreso y tus preguntas se quedan en este navegador. Sólo si activas la IA local se descargan los archivos del modelo (no se envía ninguna pregunta).</p></section>
        <section className="card p-5"><h2 className="font-display text-xl font-bold text-brandtext">Créditos y licencia</h2>
          <p className="text-sm mt-2">Contenido del folleto: <b>{META.author}</b>, {META.university}, Campus Villa Nueva — Ingeniería en Sistemas de Información y Ciencias de la Computación. Licencia {META.license}: puede copiarse y adaptarse para fines educativos no comerciales, citando a la autora.</p>
          <p className="text-sm mt-2">Construido con React, Vite, TypeScript, Tailwind CSS, Motion, Lucide, math.js, Algebrite, KaTeX, Plotly.js y WebLLM (todo de código abierto).</p></section>
      </div>
    </div>
  );
}
