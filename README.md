# Atlas del Cálculo II — Laboratorio matemático interactivo

Plataforma educativa **100 % gratuita** basada en el folleto *Cálculo II — Atlas del Cálculo* (Joseline Vanessa Payes Mejia, Universidad Mariano Gálvez de Guatemala). Es un **sitio estático**: se publica gratis en GitHub Pages, no tiene backend, no pide cuentas y no usa ninguna API de pago.

URL esperada (sustituya `USUARIO`): `https://USUARIO.github.io/atlas-calculo-ii/`

## Qué incluye

| Sección | Qué hace |
|---|---|
| **Temas (10)** | Teoría con fórmulas destacadas, figuras, 26 ejemplos resueltos con el método de Pólya, 60 ejercicios PISA, aplicaciones, resumen y referencias, extraídos del Word original (fórmulas OMML → LaTeX/KaTeX). |
| **Atlas Tutor** | *Modalidad A* (siempre disponible): búsqueda TF‑IDF sobre el folleto + reglas de intención, FAQ verificadas, ejemplos, ejercicios por nivel PISA, pistas, método de Pólya y contexto de seguimiento. **No es IA generativa** y lo dice. *Modalidad B* (opcional): IA local real con **WebLLM** (WebGPU), con fragmentos del folleto como contexto. |
| **Resolutor paso a paso** | 11 plantillas verificadas (integral, valor promedio 1 y 2 variables, superficie de revolución, centroide, lámina, evaluación, parciales/diferencial, límites, regla de la cadena, extremos). Muestra problema, datos, fórmula, sustitución, operaciones, resultado, comprobación e interpretación, organizados por las 4 fases de Pólya. |
| **Ejercicios** | Los 60 enunciados originales, con filtros (tema, nivel PISA, dificultad, estado), pistas, fórmulas, respuesta verificada, favoritos, historial y **variantes paramétricas** cuya respuesta se contrasta con el motor numérico antes de mostrarse. |
| **Gráficas** | Plotly.js: funciones 2D (comparar, sombrear, raíces/extremos), superficies 3D, curvas de nivel, superficies de revolución, regiones y centroides/centros de masa, planos tangentes, puntos críticos, sliders de parámetros y exportación PNG. |
| **Práctica y examen** | Selección de capítulos/niveles/cantidad, temporizador opcional; práctica (pistas, soluciones) y examen (sin ayudas, evaluación automática, revisión guiada de respuestas abiertas, errores y temas recomendados). |
| **Progreso** | Temas, ejercicios, precisión, resultados de exámenes, historial; exportar/importar JSON. Todo en `localStorage` (no se sincroniza entre dispositivos). |
| **Biblioteca** | Lectura del folleto por capítulos, índice de fórmulas, glosario, búsqueda y descarga del documento original. |

## Garantía de gratuidad

- Sin OpenAI/Claude/Gemini ni inferencia de pago; sin claves API; sin bases de datos externas; sin cuentas; sin tarjeta.
- Todo el contenido educativo funciona sin servicios de terceros. La IA local se descarga **sólo** si el estudiante pulsa *Activar* (se muestra el tamaño aproximado, se detecta WebGPU, se advierte de errores y se puede detener/desactivar) y, si el dispositivo no es compatible, el sitio sigue con la modalidad A.
- Los pesos del modelo **no** se incluyen en el repositorio: el navegador los descarga bajo demanda desde repositorios públicos de modelos abiertos y los guarda en su caché. Las preguntas nunca salen del dispositivo.

## Rigor matemático (qué se promete y qué no)

- El Resolutor **no inventa pasos**: cada paso es el resultado de un cálculo (derivadas simbólicas con math.js, integrales exactas con Algebrite cuando las encuentra, cuadratura tanh‑sinh en caso contrario) y se acompaña de una **verificación por un método independiente** (punto medio, doble integral, diferencias finitas, derivada numérica de la composición…).
- Si no hay primitiva elemental, el resultado se rotula como *numérico*. Si la entrada no es soportada o no puede resolverse de forma confiable, se informa la limitación.
- Límites multivariables: las trayectorias distintas **prueban** que no existe; trayectorias coincidentes sólo son **evidencia**, y así se indica.
- Los enunciados de los ejercicios son los del folleto; las pistas y soluciones se redactaron para esta plataforma y las comprobables se contrastan con el motor en las pruebas automáticas.

## Estructura

```
atlas-calculo-ii/
├─ content/source/Calculo_II_Atlas_del_Calculo.docx   # documento fuente
├─ scripts/
│  ├─ extract-docx.mjs   # docx → src/data/atlas.json (+ figuras en public/img)
│  └─ omml.mjs           # conversor Office Math (OMML) → LaTeX
├─ public/docs/…docx      # folleto descargable · public/img/ figuras optimizadas (WebP)
├─ src/
│  ├─ data/              # atlas.json, solutions.ts (60 ejercicios), faq.ts, links.ts
│  ├─ lib/
│  │  ├─ math/           # core (cuadratura, derivadas), symbolic (Algebrite), solver (11 plantillas)
│  │  ├─ tutor.ts · search.ts · webllm.ts · variants.ts · check.ts · storage.ts
│  ├─ components/        # Layout, Rich (KaTeX), ExerciseView, SearchDialog…
│  └─ pages/             # Dashboard, Temas, Tutor, Resolutor, Ejercicios, Gráficas, Práctica, Progreso, Biblioteca
└─ .github/workflows/deploy.yml
```

## Desarrollo local

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas unitarias
npm run build      # genera dist/
npm run preview    # sirve dist/ para comprobarlo
```

Para regenerar el contenido desde el Word (sólo si cambia el documento): `npm run extract`.

## Pruebas

`npm test` ejecuta (Vitest) más de 80 pruebas:

- Cuadratura y derivadas con resultados conocidos (π/27(10√10−1), 16π, centroide de sen x = (π/2, π/8), 22 °C, …).
- Los **26 ejemplos** y las soluciones de ejercicios comprobables frente al Resolutor.
- Las **más de 1 000 fórmulas** del folleto renderizan en KaTeX sin error.
- Importación completa: 10 capítulos × 6 niveles = 60 ejercicios; 26 ejemplos con 4 fases de Pólya.
- Tutor: preguntas del enunciado (derivada parcial, centroide, integrales dobles, Hessiano, ejercicio PISA 3, ejemplo 1.2, “¿por qué mi respuesta es incorrecta?”), contexto de seguimiento y respuesta honesta fuera del temario.
- Variantes paramétricas verificadas, comprobación de respuestas y normalización del progreso importado.

## Publicar en GitHub Pages (gratis, paso a paso)

1. Cree una cuenta gratuita en <https://github.com> si aún no la tiene (no requiere tarjeta).
2. Cree un repositorio **público** llamado `atlas-calculo-ii` (sin README inicial).
3. En la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Atlas del Cálculo II"
   git branch -M main
   git remote add origin https://github.com/USUARIO/atlas-calculo-ii.git
   git push -u origin main
   ```
4. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Abra la pestaña **Actions**: el flujo *Desplegar en GitHub Pages* corre las pruebas, compila y publica. Al terminar (1–3 min) el sitio queda en `https://USUARIO.github.io/atlas-calculo-ii/`.
6. Cada `git push` a `main` vuelve a publicar automáticamente.

Notas de despliegue: `vite.config.ts` usa `base: './'` y la app usa **HashRouter** (`/#/tema/1`), por lo que funciona en cualquier subruta de GitHub Pages sin configuración de servidor ni dominio propio. No se usa Node.js en producción.

## Compatibilidad

- Funciona en cualquier navegador moderno (escritorio, tableta y teléfono).
- La IA local requiere WebGPU (Chrome/Edge 113+ de escritorio u otro navegador compatible), memoria de GPU de ~1–2 GB y una descarga de ~0.35–1 GB.

## Licencia

- Contenido del folleto: © 2026 Joseline Vanessa Payes Mejia, **CC BY‑NC 4.0** (uso educativo no comercial, citando a la autora).
- Código de la plataforma: MIT.
- Bibliotecas de código abierto: React, Vite, TypeScript, Tailwind CSS, Motion, Lucide, math.js, Algebrite, KaTeX, Plotly.js, WebLLM.
