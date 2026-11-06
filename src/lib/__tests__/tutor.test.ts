import { describe, it, expect } from 'vitest';
import { reply, newCtx, buildContext } from '../tutor';
import { search } from '../search';

const ask = (q: string, ctx = newCtx()) => reply(q, ctx);
const chapters = (r: ReturnType<typeof ask>) => r.retrieved.map((c) => c.chapter);

describe('Atlas Tutor local (modalidad A)', () => {
  it('¿Qué es una derivada parcial? → capítulo 9', () => {
    const r = ask('¿Qué es una derivada parcial?');
    expect(r.confident).toBe(true);
    expect(chapters(r)[0]).toBe(9);
    expect(r.sources[0].label).toContain('Cap. 9');
  });
  it('¿Cómo encuentro un centroide? → capítulo 3', () => expect(chapters(ask('¿Cómo encuentro un centroide?'))[0]).toBe(3));
  it('Explícame las integrales dobles → capítulo 6 o 7', () => expect([6, 7]).toContain(chapters(ask('Explícame las integrales dobles'))[0]));
  it('¿Cómo funciona el Hessiano? → capítulo 10', () => expect(chapters(ask('¿Cómo funciona el Hessiano?'))[0]).toBe(10));
  it('Dame un ejercicio de nivel PISA 3 → ejercicio de nivel 3 del folleto', () => {
    const r = ask('Dame un ejercicio de nivel PISA 3');
    const part = r.parts.find((p) => p.type === 'exercise') as { type: 'exercise'; id: string };
    expect(part).toBeTruthy();
    expect(part.id.endsWith('.3')).toBe(true);
    expect(r.ctx.lastExercise).toBe(part.id);
  });
  it('Explícame el ejemplo 1.2 → muestra el ejemplo 1.2 con sus fases', () => {
    const r = ask('Explícame el ejemplo 1.2 del folleto');
    const blocks = r.parts.find((p) => p.type === 'blocks') as { type: 'blocks'; blocks: { t: string; x?: string }[] };
    expect(JSON.stringify(blocks.blocks)).toContain('boquilla');
    expect(blocks.blocks.filter((b) => b.t === 'h4' && /Fase/.test(b.x ?? '')).length).toBe(4);
  });
  it('¿Por qué mi respuesta es incorrecta? → pide el procedimiento y no inventa', () => {
    const r = ask('¿Por qué mi respuesta es incorrecta?');
    expect(JSON.stringify(r.parts)).toContain('necesito ver tu procedimiento');
  });
  it('admite preguntas de seguimiento con contexto local', () => {
    const r1 = ask('¿Qué es una derivada parcial?');
    const r2 = ask('dame un ejemplo', r1.ctx);
    expect(r2.ctx.chapter).toBe(9);
    expect(JSON.stringify(r2.parts)).toContain('Ejemplo 9.');
  });
  it('pistas y solución del último ejercicio', () => {
    const r1 = ask('Explícame el ejercicio 10.3');
    const r2 = ask('dame una pista', r1.ctx);
    expect(JSON.stringify(r2.parts)).toContain('f_{xx}');
    const r3 = ask('muéstrame la solución verificada', r1.ctx);
    expect(JSON.stringify(r3.parts)).toContain('punto silla');
  });
  it('fuera del temario: reconoce que no sabe en lugar de inventar', () => {
    const r = ask('receta de pizza con piña');
    expect(r.confident).toBe(false);
  });
  it('recupera el folleto para el contexto de la IA local', () => {
    const { system, sources } = buildContext('regla de la cadena', 10);
    expect(system).toContain('FRAGMENTOS DEL FOLLETO');
    expect(sources.length).toBeGreaterThan(0);
  });
  it('el buscador encuentra ejercicios y glosario', () => {
    expect(search('trompeta de Torricelli', 3)[0].chunk.title).toMatch(/Ejercicio 1\.5|Torricelli/i);
    expect(search('Hessiano', 5).some((h) => h.chunk.chapter === 10)).toBe(true);
  });
});
