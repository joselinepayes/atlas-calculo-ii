/**
 * Modalidad B: IA local con WebLLM (opcional). El modelo se ejecuta en el navegador con WebGPU.
 * - No hay claves API ni servidores de inferencia: las preguntas nunca salen del dispositivo.
 * - La biblioteca y los pesos del modelo se descargan SOLO cuando el usuario pulsa "Activar".
 */
export interface LocalModel { id: string; label: string; approxDownloadMB: number; approxVramMB: number; note: string }

export const MODELS: LocalModel[] = [
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 · 0.5B (muy ligero)', approxDownloadMB: 350, approxVramMB: 945, note: 'Rápido, pero comete más errores matemáticos.' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 · 1.5B (recomendado)', approxDownloadMB: 950, approxVramMB: 1630, note: 'Mejor equilibrio entre calidad y tamaño.' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 · 1B', approxDownloadMB: 700, approxVramMB: 880, note: 'Alternativa pequeña de Meta.' },
];

export interface GpuStatus { supported: boolean; reason?: string; adapter?: string; maxBufferMB?: number }
export async function detectWebGPU(): Promise<GpuStatus> {
  const nav = navigator as Navigator & { gpu?: { requestAdapter: () => Promise<any> } };
  if (!nav.gpu) return { supported: false, reason: 'Este navegador no expone WebGPU (use Chrome/Edge 113+ de escritorio o un navegador compatible).' };
  try {
    const ad = await nav.gpu.requestAdapter();
    if (!ad) return { supported: false, reason: 'WebGPU existe, pero no hay un adaptador de GPU disponible (controladores o hardware incompatibles).' };
    return { supported: true, adapter: ad.info?.description || ad.info?.vendor || 'GPU detectada', maxBufferMB: Math.round((ad.limits?.maxBufferSize ?? 0) / 1048576) };
  } catch (e) {
    return { supported: false, reason: 'No se pudo inicializar WebGPU: ' + (e instanceof Error ? e.message : String(e)) };
  }
}

type Engine = {
  chat: { completions: { create: (o: any) => Promise<any> } };
  interruptGenerate: () => void;
  unload: () => Promise<void>;
};
let engine: Engine | null = null;
let currentModel: string | null = null;
export const isLoaded = () => !!engine;
export const loadedModel = () => currentModel;

export async function loadModel(modelId: string, onProgress: (p: { progress: number; text: string }) => void): Promise<void> {
  const webllm = await import('@mlc-ai/web-llm');
  if (engine) await unloadModel();
  const ids = webllm.prebuiltAppConfig.model_list.map((m: { model_id: string }) => m.model_id);
  if (!ids.includes(modelId)) throw new Error(`El modelo ${modelId} no está disponible en esta versión de WebLLM.`);
  engine = (await webllm.CreateMLCEngine(modelId, { initProgressCallback: (r: { progress: number; text: string }) => onProgress({ progress: r.progress, text: r.text }) })) as unknown as Engine;
  currentModel = modelId;
}

export async function generate(system: string, history: { role: 'user' | 'assistant'; content: string }[], onToken: (t: string) => void, signal?: AbortSignal): Promise<string> {
  if (!engine) throw new Error('El modelo local no está cargado.');
  const stream = await engine.chat.completions.create({ stream: true, temperature: 0.3, max_tokens: 700, messages: [{ role: 'system', content: system }, ...history.slice(-6)] });
  let full = '';
  signal?.addEventListener('abort', () => engine?.interruptGenerate());
  for await (const chunk of stream) {
    const d = chunk.choices?.[0]?.delta?.content ?? '';
    if (d) { full += d; onToken(full); }
  }
  return full;
}
export const stopGeneration = () => engine?.interruptGenerate();
export async function unloadModel() {
  if (engine) { try { await engine.unload(); } catch { /* ya descargado */ } }
  engine = null; currentModel = null;
}
/** Borra los pesos descargados de la caché del navegador (Cache API de WebLLM). */
export async function clearModelCache(): Promise<number> {
  let n = 0;
  if ('caches' in window) for (const k of await caches.keys()) if (/webllm|mlc/i.test(k)) { await caches.delete(k); n++; }
  return n;
}
