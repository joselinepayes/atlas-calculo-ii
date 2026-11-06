/**
 * Soluciones de los 60 ejercicios PISA del folleto.
 * El folleto publica los enunciados; aquí se agregan pistas, respuesta y desarrollo breve.
 * Cada respuesta numérica con `solver` se verifica automáticamente en las pruebas unitarias
 * (src/lib/math/__tests__/exercises.test.ts) contra el motor matemático.
 */
export type Check =
  | { kind: 'numbers'; values: number[]; unordered?: boolean; tol?: number; prompt: string }
  | { kind: 'self' };

export interface Solution {
  hints: [string, string, string];
  answer: string;
  steps: string[];
  check: Check;
  /** Comprobación cruzada con el Resolutor: categoría + entradas + valor esperado. */
  solver?: { cat: string; inputs: Record<string, string>; expect: number };
}

const self: Check = { kind: 'self' };
const nums = (prompt: string, values: number[], o: { unordered?: boolean; tol?: number } = {}): Check => ({ kind: 'numbers', values, prompt, ...o });

export const SOLUTIONS: Record<string, Solution> = {
  /* ---------------- Capítulo 1 ---------------- */
  '1.1': {
    hints: ['El radio de giro es la distancia del punto de la curva al eje.', 'Si el eje es el eje $x$, la distancia vertical de $(x,f(x))$ al eje es $|f(x)|$.', 'Si el eje es el eje $y$, la distancia horizontal de $(x,f(x))$ al eje es $x$ (con $x\\ge0$).'],
    answer: '$r=f(x)$ cuando se gira alrededor del eje $x$; $r=x$ cuando se gira alrededor del eje $y$ (con $a\\ge0$).',
    steps: ['Cada punto $(x,f(x))$ describe una circunferencia; su radio es la distancia al eje.', 'Eje $x$: distancia $=f(x)$ (con $f\\ge0$). Eje $y$: distancia $=x$.'],
    check: self,
  },
  '1.2': {
    hints: ['Use $S=\\int_a^b 2\\pi\\, r\\,\\sqrt{1+[f\'(x)]^2}\\,dx$ con $r=f(x)$ para el eje $x$.', 'Derive: $f(x)=x^3\\Rightarrow f\'(x)=3x^2$.', 'Eleve al cuadrado: $[f\'(x)]^2=9x^4$. Sólo se pide plantear la integral.'],
    answer: '$S=\\displaystyle\\int_0^2 2\\pi x^3\\sqrt{1+9x^4}\\,dx$ (su valor, con $u=1+9x^4$, es $\\tfrac{\\pi}{27}(145\\sqrt{145}-1)\\approx 203.04$).',
    steps: ['$f(x)=x^3$, $f\'(x)=3x^2$, $[f\']^2=9x^4$.', 'Sustituir $r=f(x)=x^3$ en la fórmula del eje $x$.'],
    check: self,
    solver: { cat: 'revolution', inputs: { f: 'x^3', a: '0', b: '2', axis: 'x' }, expect: 203.0436015537515 },
  },
  '1.3': {
    hints: ['Eje $x$: $S=\\int_1^4 2\\pi\\sqrt{x}\\,\\sqrt{1+[f\'(x)]^2}\\,dx$.', '$f\'(x)=\\frac{1}{2\\sqrt x}$, así $1+[f\']^2=1+\\frac1{4x}$.', '$\\sqrt{x}\\sqrt{1+\\frac{1}{4x}}=\\sqrt{x+\\frac14}$; la integral queda $2\\pi\\int_1^4\\sqrt{x+\\tfrac14}\\,dx$.'],
    answer: '$S=\\dfrac{\\pi}{6}\\left(17\\sqrt{17}-5\\sqrt5\\right)\\approx 30.8465$',
    steps: ['$S=2\\pi\\int_1^4\\sqrt{x+\\tfrac14}\\,dx=2\\pi\\cdot\\tfrac23\\left[(x+\\tfrac14)^{3/2}\\right]_1^4$.', '$=\\tfrac{4\\pi}{3}\\left[(\\tfrac{17}{4})^{3/2}-(\\tfrac54)^{3/2}\\right]=\\tfrac{\\pi}{6}(17\\sqrt{17}-5\\sqrt5)$.'],
    check: nums('Área $S$ (número)', [30.84648969714243], { tol: 2e-4 }),
    solver: { cat: 'revolution', inputs: { f: 'sqrt(x)', a: '1', b: '4', axis: 'x' }, expect: 30.84648969714243 },
  },
  '1.4': {
    hints: ['Giro alrededor del eje $y$: $r=x$, $S=\\int_0^2 2\\pi x\\sqrt{1+[f\'(x)]^2}\\,dx$.', '$f\'(x)=\\frac x2$, entonces $1+[f\']^2=1+\\frac{x^2}{4}$.', 'Sustitución $u=1+\\frac{x^2}{4}$, $du=\\frac x2\\,dx$; $u$ va de $1$ a $2$.'],
    answer: '$S=\\dfrac{8\\pi}{3}\\left(2\\sqrt2-1\\right)\\approx 15.318\\ \\text{m}^2$',
    steps: ['$S=\\int_0^2 2\\pi x\\sqrt{1+x^2/4}\\,dx=4\\pi\\int_1^2\\sqrt u\\,du$.', '$=4\\pi\\cdot\\tfrac23\\left[u^{3/2}\\right]_1^2=\\tfrac{8\\pi}{3}(2\\sqrt2-1)$.'],
    check: nums('Área $S$ en m² (número)', [15.317795260605171], { tol: 2e-4 }),
    solver: { cat: 'revolution', inputs: { f: 'x^2/4', a: '0', b: '2', axis: 'y' }, expect: 15.317795260605171 },
  },
  '1.5': {
    hints: ['Plantee $S=\\int_1^\\infty 2\\pi\\frac1x\\sqrt{1+\\frac1{x^4}}\\,dx$ y $V=\\pi\\int_1^\\infty \\frac1{x^2}\\,dx$.', 'Para el área use la cota $\\sqrt{1+1/x^4}\\ge1$.', 'Compare con $\\int_1^\\infty \\frac{dx}{x}$, que diverge.'],
    answer: 'El volumen es finito, $V=\\pi$, pero el área es infinita: $S\\ge 2\\pi\\int_1^\\infty\\frac{dx}{x}=\\infty$. Paradoja: la trompeta se podría llenar con $\\pi$ unidades³ de pintura, pero su superficie interior no se podría pintar con una cantidad finita de recubrimiento de grosor constante.',
    steps: ['$V=\\pi\\int_1^\\infty x^{-2}dx=\\pi\\left[-\\tfrac1x\\right]_1^\\infty=\\pi$.', '$S=2\\pi\\int_1^\\infty \\tfrac1x\\sqrt{1+x^{-4}}\\,dx\\ge2\\pi\\int_1^\\infty \\tfrac{dx}{x}=2\\pi\\ln x\\big|_1^\\infty=\\infty$ (por comparación).'],
    check: self,
  },
  '1.6': {
    hints: ['Forma paramétrica: $S=\\int_0^{\\pi/2}2\\pi\\,y(t)\\sqrt{x\'(t)^2+y\'(t)^2}\\,dt$.', '$x\'=-3\\cos^2t\\sin t$, $y\'=3\\sin^2t\\cos t$.', '$x\'^2+y\'^2=9\\sin^2t\\cos^2t$, luego $\\sqrt{\\cdot}=3\\sin t\\cos t$ (positivo en $[0,\\pi/2]$).'],
    answer: '$S=\\displaystyle\\int_0^{\\pi/2}2\\pi\\sin^3t\\cdot3\\sin t\\cos t\\,dt=6\\pi\\int_0^{\\pi/2}\\sin^4t\\cos t\\,dt=\\frac{6\\pi}{5}\\approx3.770$',
    steps: ['Con $u=\\sin t$, $du=\\cos t\\,dt$: $6\\pi\\int_0^1u^4\\,du=6\\pi\\cdot\\tfrac15$.'],
    check: nums('Área $S$ (número)', [3.7699111843077517], { tol: 2e-4 }),
    solver: { cat: 'integral', inputs: { f: '2*pi*sin(x)^3*3*sin(x)*cos(x)', a: '0', b: 'pi/2' }, expect: 3.7699111843077517 },
  },
  /* ---------------- Capítulo 2 ---------------- */
  '2.1': {
    hints: ['$f_{\\text{prom}}=\\frac1{b-a}\\int_a^bf(x)\\,dx$.', 'La integral de una constante $k$ en $[a,b]$ es $k(b-a)$.', 'El promedio de una constante es la propia constante.'],
    answer: '$f_{\\text{prom}}=\\dfrac{1}{8}\\int_1^9 8\\,dx=\\dfrac{8\\cdot8}{8}=8$',
    steps: ['$b-a=8$; $\\int_1^98\\,dx=64$; $64/8=8$.'],
    check: nums('Valor promedio', [8]),
    solver: { cat: 'avg1', inputs: { f: '8', a: '1', b: '9' }, expect: 8 },
  },
  '2.2': {
    hints: ['Velocidad promedio $=\\frac{1}{4-0}\\int_0^4 v(t)\\,dt$.', 'Primero escriba la integral; luego, si quiere verificar, evalúela.', '$\\int_0^4(t^2+3t)\\,dt=\\tfrac{64}{3}+24=\\tfrac{136}{3}$.'],
    answer: '$v_{\\text{prom}}=\\dfrac14\\displaystyle\\int_0^4\\left(t^2+3t\\right)dt=\\dfrac{34}{3}\\approx11.33$',
    steps: ['$\\int_0^4t^2dt=\\tfrac{64}{3}$, $\\int_0^43t\\,dt=24$.', '$v_{\\text{prom}}=\\tfrac14\\cdot\\tfrac{136}{3}=\\tfrac{34}{3}$.'],
    check: nums('Valor numérico de la velocidad promedio', [34 / 3], { tol: 1e-3 }),
    solver: { cat: 'avg1', inputs: { f: 'x^2+3*x', a: '0', b: '4' }, expect: 34 / 3 },
  },
  '2.3': {
    hints: ['$f_{\\text{prom}}=\\frac19\\int_0^9\\sqrt x\\,dx$.', '$\\int_0^9\\sqrt x\\,dx=\\tfrac23\\cdot27=18$.', 'Luego resuelva $\\sqrt c=f_{\\text{prom}}$.'],
    answer: '$f_{\\text{prom}}=2$ y se alcanza en $c=4$.',
    steps: ['$\\tfrac19\\cdot18=2$.', '$\\sqrt c=2\\Rightarrow c=4\\in[0,9]$.'],
    check: nums('Valor promedio y $c$ (separe con comas)', [2, 4]),
    solver: { cat: 'avg1', inputs: { f: 'sqrt(x)', a: '0', b: '9' }, expect: 2 },
  },
  '2.4': {
    hints: ['Promedio de $x^2$ en $[-2,2]$: $\\frac14\\int_{-2}^2x^2dx$.', '$\\int_{-2}^2x^2dx=\\tfrac{16}{3}$, así el promedio es $\\tfrac43$.', 'Resuelva $c^2=\\tfrac43$: hay dos soluciones.'],
    answer: '$f_{\\text{prom}}=\\tfrac43$; los valores son $c=\\pm\\dfrac{2}{\\sqrt3}\\approx\\pm1.1547$ (ambos en $[-2,2]$).',
    steps: ['$c^2=\\tfrac43\\Rightarrow c=\\pm\\tfrac{2}{\\sqrt3}=\\pm\\tfrac{2\\sqrt3}{3}$.'],
    check: nums('Los dos valores de $c$ (separe con comas)', [-1.1547005383792517, 1.1547005383792517], { unordered: true, tol: 1e-3 }),
    solver: { cat: 'avg1', inputs: { f: 'x^2', a: '-2', b: '2' }, expect: 4 / 3 },
  },
  '2.5': {
    hints: ['Valor promedio: $\\frac{\\omega}{\\pi}\\int_0^{\\pi/\\omega}I_0\\sin(\\omega t)\\,dt$.', '$(I^2)_{\\text{prom}}=\\frac{\\omega}{\\pi}\\int_0^{\\pi/\\omega}I_0^2\\sin^2(\\omega t)\\,dt$; use $\\sin^2=\\frac{1-\\cos2\\omega t}{2}$.', 'Tome la raíz cuadrada del segundo resultado.'],
    answer: '$I_{\\text{prom}}=\\dfrac{2I_0}{\\pi}\\approx0.637\\,I_0$ y $I_{\\text{RMS}}=\\dfrac{I_0}{\\sqrt2}\\approx0.707\\,I_0$. Así $I_{\\text{RMS}}>I_{\\text{prom}}$.',
    steps: ['$\\int_0^{\\pi/\\omega}\\sin(\\omega t)dt=\\tfrac2\\omega\\Rightarrow I_{\\text{prom}}=\\tfrac{\\omega}{\\pi}I_0\\tfrac2\\omega=\\tfrac{2I_0}{\\pi}$.', '$\\int_0^{\\pi/\\omega}\\sin^2(\\omega t)dt=\\tfrac{\\pi}{2\\omega}\\Rightarrow(I^2)_{\\text{prom}}=\\tfrac{I_0^2}{2}\\Rightarrow I_{\\text{RMS}}=\\tfrac{I_0}{\\sqrt2}$.'],
    check: nums('Relación $I_{\\text{RMS}}/I_{\\text{prom}}$ (número)', [Math.PI / (2 * Math.SQRT2)], { tol: 1e-3 }),
  },
  '2.6': {
    hints: ['Escriba $\\int_{-a}^af=\\int_{-a}^0f+\\int_0^af$.', 'En la primera integral use $u=-x$ y la imparidad $f(-u)=-f(u)$.', 'Para CA: el promedio de $\\sin$ en un ciclo completo es $0$, pero el de $\\sin^2$ no.'],
    answer: 'Si $f$ es impar, $\\int_{-a}^af=0$, luego $f_{\\text{prom}}=\\frac1{2a}\\cdot0=0$. En CA el promedio de $I$ en un ciclo es $0$ aunque la energía entregada no lo sea: la potencia depende de $I^2\\ge0$, cuyo promedio es $I_0^2/2$; por eso se usa $I_{\\text{RMS}}=I_0/\\sqrt2$.',
    steps: ['$\\int_{-a}^0f(x)dx\\overset{u=-x}{=}\\int_0^af(-u)du=-\\int_0^af(u)du$.', 'Sumando con $\\int_0^af$ resulta $0$.', 'Potencia $P=I^2R$: su promedio es $R\\,(I^2)_{\\text{prom}}=R\\,I_{\\text{RMS}}^2$.'],
    check: self,
  },
  /* ---------------- Capítulo 3 ---------------- */
  '3.1': {
    hints: ['Un rectángulo homogéneo es simétrico respecto de sus rectas medias.', 'El centroide está sobre cada eje de simetría.', 'Esas rectas son $x=w/2$ y $y=h/2$.'],
    answer: '$(\\bar x,\\bar y)=\\left(\\dfrac w2,\\dfrac h2\\right)$',
    steps: ['Por integración: $\\bar x=\\frac{1}{wh}\\int_0^w x\\,h\\,dx=\\frac w2$; análogamente $\\bar y=\\frac h2$.'],
    check: self,
  },
  '3.2': {
    hints: ['Halle los puntos de corte resolviendo $x^2=x$.', 'En $[0,1]$ la recta está por encima de la parábola.', 'Área $=\\int(\\text{curva superior}-\\text{curva inferior})\\,dx$.'],
    answer: '$A=\\displaystyle\\int_0^1\\left(x-x^2\\right)dx$ $\\left(=\\tfrac16\\right)$',
    steps: ['$x^2=x\\Rightarrow x=0$ o $x=1$.', 'Para $0<x<1$: $x>x^2$.'],
    check: self,
    solver: { cat: 'centroid1', inputs: { f: 'x', g: 'x^2', a: '0', b: '1' }, expect: 0.5 },
  },
  '3.3': {
    hints: ['Los vértices del triángulo son $(0,0)$, $(3,0)$ y $(0,3)$.', '$A=\\tfrac92$; $\\bar x=\\frac1A\\int_0^3x(3-x)\\,dx$.', '$\\bar y=\\frac1A\\int_0^3\\tfrac12(3-x)^2\\,dx$.'],
    answer: '$(\\bar x,\\bar y)=(1,1)$, el promedio de los vértices.',
    steps: ['$\\int_0^3x(3-x)dx=\\tfrac92\\Rightarrow\\bar x=1$.', '$\\int_0^3\\tfrac12(3-x)^2dx=\\tfrac92\\Rightarrow\\bar y=1$.'],
    check: nums('Centroide $(\\bar x,\\bar y)$', [1, 1]),
    solver: { cat: 'centroid1', inputs: { f: '-x+3', g: '0', a: '0', b: '3' }, expect: 1 },
  },
  '3.4': {
    hints: ['$A=\\int_0^\\pi\\sin x\\,dx=2$.', '$\\bar x=\\pi/2$ por simetría respecto de $x=\\pi/2$.', '$\\bar y=\\frac1{2A}\\int_0^\\pi\\sin^2x\\,dx=\\frac14\\cdot\\frac\\pi2$.'],
    answer: '$(\\bar x,\\bar y)=\\left(\\dfrac\\pi2,\\dfrac\\pi8\\right)\\approx(1.5708,\\ 0.3927)$',
    steps: ['$A=2$. $M_x=\\tfrac12\\int_0^\\pi\\sin^2x\\,dx=\\tfrac12\\cdot\\tfrac\\pi2=\\tfrac\\pi4$.', '$\\bar y=M_x/A=\\tfrac\\pi8$.'],
    check: nums('Centroide $(\\bar x,\\bar y)$', [Math.PI / 2, Math.PI / 8]),
    solver: { cat: 'centroid1', inputs: { f: 'sin(x)', g: '0', a: '0', b: 'pi' }, expect: Math.PI / 2 },
  },
  '3.5': {
    hints: ['La hipotenusa es $y=b\\left(1-\\tfrac xa\\right)$; la región es $0\\le x\\le a$, $0\\le y\\le b(1-x/a)$.', '$m=\\iint\\rho\\,dA$, $M_y=\\iint x\\rho\\,dA$, $M_x=\\iint y\\rho\\,dA$.', 'Con $\\rho=x+y$ los integrandos son $x+y$, $x(x+y)$ y $y(x+y)$.'],
    answer: '$m=\\displaystyle\\int_0^a\\!\\!\\int_0^{b(1-x/a)}(x+y)\\,dy\\,dx$, $M_y=\\displaystyle\\int_0^a\\!\\!\\int_0^{b(1-x/a)}x(x+y)\\,dy\\,dx$, $M_x=\\displaystyle\\int_0^a\\!\\!\\int_0^{b(1-x/a)}y(x+y)\\,dy\\,dx$, con $(\\bar x,\\bar y)=(M_y/m,\\ M_x/m)$. Límites: $x$ entre $0$ y $a$ (eje $y$ y recta $x=a$); $y$ entre el eje $x$ y la hipotenusa $y=b(1-x/a)$. Resultado: $m=\\tfrac{ab(a+b)}6$, $\\bar x=\\tfrac{a(2a+b)}{4(a+b)}$, $\\bar y=\\tfrac{b(a+2b)}{4(a+b)}$.',
    steps: ['Evaluando: $m=\\tfrac{ab(a+b)}{6}$, $M_y=\\tfrac{a^2b(2a+b)}{24}$, $M_x=\\tfrac{ab^2(a+2b)}{24}$.', 'Comprobación con $a=b=1$: $(\\bar x,\\bar y)=(3/8,3/8)$ (el resolutor confirma este caso).'],
    check: self,
    solver: { cat: 'lamina', inputs: { rho: 'x+y', a: '0', b: '1', g1: '0', g2: '1-x' }, expect: 1 / 3 },
  },
  '3.6': {
    hints: ['Pappus: $V=2\\pi\\,\\bar y\\,A$ (distancia del centroide al eje por el área).', 'Justifique con $V=\\int2\\pi y\\,dA$ y la definición $\\bar y=\\frac1A\\int y\\,dA$.', 'Semicírculo: $A=\\tfrac12\\pi R^2$ y $V_{\\text{esfera}}=\\tfrac43\\pi R^3$.'],
    answer: '**Teorema:** si una región plana de área $A$ gira alrededor de un eje de su plano que no la cruza, el volumen es $V=2\\pi\\bar y\\,A$. Para el semicírculo: $\\tfrac43\\pi R^3=2\\pi\\bar y\\cdot\\tfrac12\\pi R^2\\Rightarrow\\bar y=\\dfrac{4R}{3\\pi}$ (sobre el eje de simetría, $\\bar x=0$).',
    steps: ['Cada elemento $dA$ a distancia $y$ del eje barre un anillo de volumen $2\\pi y\\,dA$.', '$V=\\int2\\pi y\\,dA=2\\pi\\left(\\int y\\,dA\\right)=2\\pi\\bar yA$.', 'Despejando: $\\bar y=\\dfrac{4\\pi R^3/3}{\\pi^2R^2}=\\dfrac{4R}{3\\pi}$.'],
    check: self,
  },
  /* ---------------- Capítulo 4 ---------------- */
  '4.1': {
    hints: ['Distancia entre puntos de $\\mathbb R^3$.', '$d=\\sqrt{x^2+y^2+z^2}$ desde el origen.', '$4+9+36=49$.'],
    answer: '$d=\\sqrt{2^2+3^2+6^2}=\\sqrt{49}=7$',
    steps: ['$d=\\sqrt{(2-0)^2+(3-0)^2+(6-0)^2}=7$.'],
    check: nums('Distancia', [7]),
  },
  '4.2': {
    hints: ['Compare con $(x-h)^2+(y-k)^2+(z-l)^2=r^2$.', 'No hay términos lineales: $h=k=l=0$.', '$r^2=16$.'],
    answer: 'Es una esfera de centro $(0,0,0)$ y radio $4$.',
    steps: ['$x^2+y^2+z^2=4^2$.'],
    check: self,
  },
  '4.3': {
    hints: ['El argumento de $\\ln$ debe ser positivo.', 'Resuelva $y-x^2>0$.', 'Es la región por encima de la parábola $y=x^2$ (sin incluir la parábola).'],
    answer: '$D=\\{(x,y)\\in\\mathbb R^2:\\ y>x^2\\}$: la región abierta por encima de la parábola $y=x^2$; la parábola se dibuja discontinua (frontera excluida).',
    steps: ['$\\ln u$ existe sólo para $u>0$; aquí $u=y-x^2$.'],
    check: self,
  },
  '4.4': {
    hints: ['Cada curva de nivel es $x^2+4y^2=c$.', 'Divida entre $c$: $\\frac{x^2}{c}+\\frac{y^2}{c/4}=1$.', 'Semiejes: $\\sqrt c$ en $x$ y $\\tfrac{\\sqrt c}{2}$ en $y$.'],
    answer: 'Elipses concéntricas: $c=1$: semiejes $1$ y $\\tfrac12$; $c=4$: $2$ y $1$; $c=16$: $4$ y $2$. La temperatura crece hacia afuera; en dirección $y$ crece más rápido (basta la mitad de distancia para alcanzar la misma temperatura, porque el coeficiente de $y^2$ es $4$).',
    steps: ['Para $c=4$: $\\frac{x^2}{4}+y^2=1$.'],
    check: self,
  },
  '4.5': {
    hints: ['Sea $z$ la altura: $V_0=xyz=100$.', 'Despeje $z=\\frac{100}{xy}$.', 'Área cerrada: $A=2(xy+xz+yz)$.'],
    answer: '$A(x,y)=2\\left(xy+\\dfrac{100}{y}+\\dfrac{100}{x}\\right)$ con dominio físico $x>0,\\ y>0$.',
    steps: ['$z=100/(xy)\\Rightarrow xz=100/y$, $yz=100/x$.', 'Las dimensiones deben ser positivas.'],
    check: self,
  },
  '4.6': {
    hints: ['Esferas: $|P-S_i|^2=r_i^2$, $i=1,2,3$.', 'Reste la ecuación 1 de la 2 y de la 3: los términos cuadráticos en $P$ se cancelan.', 'Si los $S_i$ son colineales, las normales $S_1-S_2$ y $S_1-S_3$ son paralelas.'],
    answer: 'Al restar se obtiene $2(S_2-S_1)\\cdot P=r_1^2-r_2^2+|S_2|^2-|S_1|^2$ (y su análogo con $S_3$): dos planos, cuya intersección es una recta; la tercera esfera la corta en a lo sumo dos puntos. Si los centros son colineales, los dos planos son paralelos (o coinciden): el sistema se vuelve mal condicionado y la posición queda indeterminada alrededor del eje que une los satélites; pequeños errores en las distancias producen grandes errores de posición.',
    steps: ['$|P|^2-2S_i\\cdot P+|S_i|^2=r_i^2$.', 'Restando 1 de 2 y 1 de 3 queda un sistema lineal $2\\begin{pmatrix}(S_2-S_1)\\\\(S_3-S_1)\\end{pmatrix}P=\\ldots$ de rango $2$ sólo si $S_2-S_1$ y $S_3-S_1$ no son paralelos.'],
    check: self,
  },
  /* ---------------- Capítulo 5 ---------------- */
  '5.1': { hints: ['Sustituya $x=1$, $y=2$.', '$2(1)+3(2)$.', 'Sume.'], answer: '$f(1,2)=2+6=8$', steps: ['$f(1,2)=2\\cdot1+3\\cdot2=8$.'], check: nums('$f(1,2)$', [8]) },
  '5.2': {
    hints: ['El radicando debe ser $\\ge0$.', '$x+y\\ge0$.', 'Es un semiplano limitado por la recta $y=-x$.'],
    answer: '$D=\\{(x,y):x+y\\ge0\\}$: el semiplano cerrado por encima (y sobre) la recta $y=-x$.',
    steps: ['$\\sqrt u$ requiere $u\\ge0$.'],
    check: self,
  },
  '5.3': {
    hints: ['Sustituya $x=2$, $y=\\pi/2$, $z=5$.', '$\\sin(\\pi/2)=1$.', '$4\\cdot1+5$.'],
    answer: '$g(2,\\pi/2,5)=4\\sin\\frac\\pi2+5=9$',
    steps: ['$x^2=4$, $\\sin(\\pi/2)=1$, luego $4+5=9$.'],
    check: nums('$g(2,\\pi/2,5)$', [9]),
    solver: { cat: 'eval', inputs: { vars: 'x,y,z', f: 'x^2*sin(y)+z', point: '2, pi/2, 5' }, expect: 9 },
  },
  '5.4': {
    hints: ['$\\text{IMC}=W/H^2$.', '$H^2=3.0625$.', '$70/3.0625$. Curvas de nivel: $W/H^2=c$.'],
    answer: '$\\text{IMC}(W,H)=\\dfrac{W}{H^2}$; $\\text{IMC}(70,1.75)=\\dfrac{70}{3.0625}\\approx22.86\\ \\text{kg/m}^2$. Las curvas de nivel $W=cH^2$ son parábolas en el plano $(H,W)$, una por cada valor de IMC.',
    steps: ['$1.75^2=3.0625$; $70/3.0625=22.857\\ldots$'],
    check: nums('IMC (número)', [22.857142857142858], { tol: 1e-3 }),
    solver: { cat: 'eval', inputs: { vars: 'W,H', f: 'W/H^2', point: '70, 1.75' }, expect: 22.857142857142858 },
  },
  '5.5': {
    hints: ['Argumento de $\\ln$ positivo: $9-x^2-9y^2>0$.', 'Divida entre $9$: $\\frac{x^2}{9}+y^2<1$.', 'Rango: el argumento toma valores en $(0,9]$.'],
    answer: 'Dominio: $\\{(x,y):\\ \\frac{x^2}{9}+y^2<1\\}$ (interior de la elipse de semiejes $3$ y $1$); es un conjunto **abierto** (la frontera no pertenece al dominio). Rango: $(-\\infty,\\ln9]\\approx(-\\infty,2.197]$, con máximo $\\ln 9$ en el origen.',
    steps: ['$0<9-x^2-9y^2\\le9\\Rightarrow\\ln(\\cdot)\\in(-\\infty,\\ln9]$.'],
    check: self,
  },
  '5.6': {
    hints: ['Corte horizontal: $z=k$.', 'Resulta $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=k$.', 'Para $k>0$ divida por $k$ y reconozca una elipse.'],
    answer: 'Para $k>0$: $\\dfrac{x^2}{ka^2}+\\dfrac{y^2}{kb^2}=1$, elipse de semiejes $a\\sqrt k$ y $b\\sqrt k$ centrada en el eje $z$ (concéntricas); $k=0$ es el vértice y $k<0$ no tiene puntos. Si $a=b$ son circunferencias: paraboloide de revolución $z=r^2/a^2$. En antenas parabólicas esta forma refleja los rayos paralelos al eje hacia un único punto, el foco.',
    steps: ['Tamaño de los semiejes proporcional a $\\sqrt k$: espaciado no uniforme (curvas más juntas lejos del vértice).'],
    check: self,
  },
  /* ---------------- Capítulo 6 ---------------- */
  '6.1': { hints: ['Área $=\\iint_R dA$.', 'Base $4-0$, altura $5-1$.', '$4\\times4$.'], answer: '$A=\\displaystyle\\int_0^4\\!\\!\\int_1^5dy\\,dx=16$', steps: ['$\\int_1^5dy=4$; $\\int_0^44\\,dx=16$.'], check: nums('Área', [16]) },
  '6.2': {
    hints: ['$f_{\\text{prom}}=\\frac1{A(R)}\\iint_Rf\\,dA$ con $A(R)=1$.', 'Integre primero en $y$ de $0$ a $1$.', 'Plantee, y si quiere verificar, evalúe: $\\int_0^1(x+\\tfrac12)dx=1$.'],
    answer: '$f_{\\text{prom}}=\\dfrac{1}{1}\\displaystyle\\int_0^1\\!\\!\\int_0^1(x+y)\\,dy\\,dx=1$',
    steps: ['$\\int_0^1(x+y)dy=x+\\tfrac12$; $\\int_0^1(x+\\tfrac12)dx=\\tfrac12+\\tfrac12=1$.'],
    check: nums('Valor promedio', [1]),
    solver: { cat: 'avg2', inputs: { f: 'x+y', a: '0', b: '1', g1: '0', g2: '1' }, expect: 1 },
  },
  '6.3': {
    hints: ['Región: $0\\le x\\le1$, $0\\le y\\le x$; área $\\tfrac12$.', '$\\iint xy\\,dA=\\int_0^1x\\cdot\\tfrac{x^2}{2}dx$.', '$\\tfrac18\\big/\\tfrac12$.'],
    answer: '$f_{\\text{prom}}=\\dfrac{1/8}{1/2}=\\dfrac14$',
    steps: ['$\\int_0^x y\\,dy=\\tfrac{x^2}2$; $\\int_0^1x\\cdot\\tfrac{x^2}{2}dx=\\tfrac18$.', 'Área del triángulo $=\\tfrac12$.'],
    check: nums('Valor promedio', [0.25]),
    solver: { cat: 'avg2', inputs: { f: 'x*y', a: '0', b: '1', g1: '0', g2: 'x' }, expect: 0.25 },
  },
  '6.4': {
    hints: ['Polares: $x^2+y^2=r^2$, $dA=r\\,dr\\,d\\theta$, $0\\le r\\le2$.', '$\\iint T\\,dA=\\int_0^{2\\pi}\\int_0^2(20+r^2)r\\,dr\\,d\\theta$.', 'Área del disco $=4\\pi$.'],
    answer: '$T_{\\text{prom}}=\\dfrac{1}{4\\pi}\\cdot2\\pi\\left[10r^2+\\tfrac{r^4}{4}\\right]_0^2=\\dfrac{1}{4\\pi}\\cdot2\\pi\\cdot44=22$',
    steps: ['$\\int_0^2(20r+r^3)dr=40+4=44$.', '$\\iint T\\,dA=2\\pi\\cdot44=88\\pi$; $88\\pi/4\\pi=22$.'],
    check: nums('Temperatura promedio', [22]),
    solver: { cat: 'avg2', inputs: { f: '20+x^2+y^2', a: '-2', b: '2', g1: '-sqrt(4-x^2)', g2: 'sqrt(4-x^2)' }, expect: 22 },
  },
  '6.5': {
    hints: ['Promedio $=\\frac{1}{\\pi a^2}\\iint\\sqrt{a^2-r^2}\\,dA$.', 'En polares: $\\int_0^{2\\pi}\\int_0^a\\sqrt{a^2-r^2}\\,r\\,dr\\,d\\theta$.', 'Sustituya $u=a^2-r^2$.'],
    answer: '$h_{\\text{prom}}=\\dfrac{1}{\\pi a^2}\\cdot\\dfrac{2\\pi a^3}{3}=\\dfrac{2a}{3}$, que es $\\tfrac23$ de la altura máxima $a$ (el volumen del hemisferio es $\\tfrac23\\pi a^3$).',
    steps: ['$\\int_0^a\\sqrt{a^2-r^2}\\,r\\,dr=\\tfrac{a^3}{3}$; por $2\\pi$: $\\tfrac{2\\pi a^3}{3}$.'],
    check: self,
    solver: { cat: 'avg2', inputs: { f: 'sqrt(1-x^2-y^2)', a: '-1', b: '1', g1: '-sqrt(1-x^2)', g2: 'sqrt(1-x^2)' }, expect: 2 / 3 },
  },
  '6.6': {
    hints: ['$\\iint(ax+by+c)\\,dA=a\\iint x\\,dA+b\\iint y\\,dA+c\\,A$.', 'En un disco centrado en el origen, $x$ e $y$ son funciones impares respecto de la simetría.', 'Entonces $\\iint x\\,dA=\\iint y\\,dA=0$.'],
    answer: '$f_{\\text{prom}}=\\dfrac{a\\cdot0+b\\cdot0+cA}{A}=c$. Generalización: el promedio de una función lineal sobre una región es el valor de la función en el **centroide** de la región; basta que el centroide esté en el origen (regiones simétricas respecto del origen).',
    steps: ['Simetría: $\\iint x\\,dA=0$ porque $x\\to-x$ deja la región invariante y cambia el signo del integrando.'],
    check: self,
  },
  /* ---------------- Capítulo 7 ---------------- */
  '7.1': { hints: ['$m=\\iint\\rho\\,dA=\\rho\\cdot A$ si $\\rho$ es constante.', '$A=2\\times3=6$ m².', '$5\\times6$.'], answer: '$m=5\\cdot6=30\\ \\text{kg}$', steps: ['$m=\\iint5\\,dA=5\\cdot6$.'], check: nums('Masa en kg', [30]) },
  '7.2': {
    hints: ['Centre el disco en el origen.', 'El disco no cambia al reflejar $x\\to-x$ ni $y\\to-y$.', '$\\bar x=\\frac1A\\iint x\\,dA$: integrando impar sobre región simétrica.'],
    answer: 'Con el disco centrado en el origen, $\\iint x\\,dA=0$ y $\\iint y\\,dA=0$ porque la región es simétrica y $x$, $y$ son impares; por tanto $\\bar x=\\bar y=0$: el centroide es el centro.',
    steps: ['En polares: $\\iint x\\,dA=\\int_0^{2\\pi}\\cos\\theta\\,d\\theta\\int_0^Rr^2dr=0$.'],
    check: self,
  },
  '7.3': {
    hints: ['Región: $0\\le x\\le2$, $0\\le y\\le2-x$.', '$m=\\int_0^2\\int_0^{2-x}(x+y)\\,dy\\,dx$.', '$\\int_0^{2-x}(x+y)dy=x(2-x)+\\tfrac{(2-x)^2}{2}=2-\\tfrac{x^2}{2}$.'],
    answer: '$m=\\displaystyle\\int_0^2\\left(2-\\dfrac{x^2}{2}\\right)dx=4-\\dfrac43=\\dfrac83\\approx2.667$',
    steps: ['$x(2-x)+\\tfrac{(2-x)^2}{2}=2x-x^2+2-2x+\\tfrac{x^2}{2}=2-\\tfrac{x^2}2$.'],
    check: nums('Masa', [8 / 3], { tol: 1e-3 }),
    solver: { cat: 'lamina', inputs: { rho: 'x+y', a: '0', b: '2', g1: '0', g2: '2-x' }, expect: 8 / 3 },
  },
  '7.4': {
    hints: ['$x^2=4\\Rightarrow x=\\pm2$; arriba $y=4$, abajo $y=x^2$.', 'Simetría: $\\bar x=0$. $A=\\int_{-2}^2(4-x^2)dx=\\tfrac{32}{3}$.', '$M_x=\\tfrac12\\int_{-2}^2(16-x^4)dx=\\tfrac{128}{5}$.'],
    answer: '$(\\bar x,\\bar y)=\\left(0,\\dfrac{12}{5}\\right)=(0,\\ 2.4)$',
    steps: ['$\\bar y=\\dfrac{128/5}{32/3}=\\dfrac{12}{5}$.'],
    check: nums('Centroide $(\\bar x,\\bar y)$', [0, 2.4], { tol: 1e-3 }),
    solver: { cat: 'centroid1', inputs: { f: '4', g: 'x^2', a: '-2', b: '2' }, expect: 0 },
  },
  '7.5': {
    hints: ['Polares: $0\\le r\\le a$, $0\\le\\theta\\le\\pi/2$, $\\rho=kr$, $dA=r\\,dr\\,d\\theta$.', '$m=\\int_0^{\\pi/2}\\int_0^akr\\cdot r\\,dr\\,d\\theta=\\tfrac{k\\pi a^3}{6}$.', '$M_y=\\int_0^{\\pi/2}\\cos\\theta\\,d\\theta\\int_0^akr^3dr=\\tfrac{ka^4}{4}$.'],
    answer: '$\\bar x=\\bar y=\\dfrac{3a}{2\\pi}\\approx0.477\\,a$',
    steps: ['$m=k\\tfrac\\pi2\\tfrac{a^3}{3}=\\tfrac{\\pi ka^3}{6}$.', '$M_y=k\\tfrac{a^4}{4}\\cdot1$; por simetría $M_x=M_y$.', '$\\bar x=\\tfrac{ka^4/4}{\\pi ka^3/6}=\\tfrac{3a}{2\\pi}$.'],
    check: nums('Coeficiente $\\bar x/a$ (número)', [3 / (2 * Math.PI)], { tol: 1e-3 }),
    solver: { cat: 'lamina', inputs: { rho: 'sqrt(x^2+y^2)', a: '0', b: '1', g1: '0', g2: 'sqrt(1-x^2)' }, expect: Math.PI / 6 },
  },
  '7.6': {
    hints: ['Triángulo: $0\\le x\\le a$, $0\\le y\\le b(1-x/a)$, $A=ab/2$.', '$M_y=\\int_0^ax\\,b\\left(1-\\tfrac xa\\right)dx=\\tfrac{a^2b}{6}$.', 'Para un triángulo arbitrario use una transformación afín que lo lleve al triángulo rectángulo.'],
    answer: '$\\bar x=\\dfrac{a^2b/6}{ab/2}=\\dfrac a3$, y análogamente $\\bar y=\\dfrac b3$. Las transformaciones afines conservan los promedios (el centroide es un promedio, lineal en las coordenadas), y cualquier triángulo es imagen afín de este con vértices $(0,0),(a,0),(0,b)$ cuyo promedio de vértices es $\\left(\\tfrac a3,\\tfrac b3\\right)$. Luego el centroide de un triángulo es el promedio de sus vértices.',
    steps: ['$\\bar y=\\tfrac1A\\int_0^a\\tfrac12b^2(1-x/a)^2dx=\\tfrac{ab^2/6}{ab/2}=\\tfrac b3$.'],
    check: self,
  },
  /* ---------------- Capítulo 8 ---------------- */
  '8.1': { hints: ['El polinomio es continuo en todo $\\mathbb R^2$.', 'Sustituya $(1,2)$.', '$3(1)(2)-10$.'], answer: '$\\lim=3\\cdot1^2\\cdot2-5\\cdot2=6-10=-4$', steps: ['Sustitución directa.'], check: nums('Límite', [-4]), solver: { cat: 'limit2', inputs: { f: '3*x^2*y-5*y', point: '1,2' }, expect: -4 } },
  '8.2': {
    hints: ['Una función racional es discontinua donde el denominador se anula.', '$x^2+y^2-4=0$.', 'Es una circunferencia de radio 2.'],
    answer: '$f$ es discontinua exactamente en los puntos de la circunferencia $x^2+y^2=4$ (centro en el origen, radio $2$); es continua en el resto de $\\mathbb R^2$.',
    steps: ['Denominador nulo $\\iff x^2+y^2=4$.'],
    check: self,
  },
  '8.3': {
    hints: ['Factorice el numerador: $x^2-y^2=(x-y)(x+y)$.', 'Cancele $(x-y)$ (con $x\\ne y$).', 'Sustituya en $(x+y)$.'],
    answer: '$\\displaystyle\\lim_{(x,y)\\to(2,2)}\\frac{(x-y)(x+y)}{x-y}=\\lim(x+y)=4$',
    steps: ['La cancelación es válida para $x\\ne y$, que es lo que exige el límite.'],
    check: nums('Límite', [4]),
    solver: { cat: 'limit2', inputs: { f: '(x^2-y^2)/(x-y)', point: '2,2' }, expect: 4 },
  },
  '8.4': {
    hints: ['Sobre $y=mx$: sustituya y simplifique.', 'Sobre $x=y^2$: sustituya y simplifique.', 'Compare los valores.'],
    answer: 'Sobre $y=mx$: $f=\\frac{m^2x}{1+m^4x^2}\\to0$. Sobre $x=y^2$: $f=\\frac{y^4}{2y^4}=\\frac12$. Como $0\\ne\\frac12$, **el límite no existe**.',
    steps: ['$y=mx$: $\\frac{x\\,m^2x^2}{x^2+m^4x^4}=\\frac{m^2x}{1+m^4x^2}\\to0$.', '$x=y^2$: $\\frac{y^2\\cdot y^2}{y^4+y^4}=\\frac12$.'],
    check: self,
    solver: { cat: 'limit2', inputs: { f: 'x*y^2/(x^2+y^4)', point: '0,0' }, expect: NaN },
  },
  '8.5': {
    hints: ['Use $x=r\\cos\\theta$, $y=r\\sin\\theta$.', 'Entonces $\\frac{3x^3-y^3}{x^2+y^2}=r\\,(3\\cos^3\\theta-\\sin^3\\theta)$.', 'Acote $|3\\cos^3\\theta-\\sin^3\\theta|\\le4$.'],
    answer: 'Dado $\\varepsilon>0$ tome $\\delta=\\varepsilon/4$. Si $0<\\sqrt{x^2+y^2}<\\delta$, entonces $\\left|\\dfrac{3x^3-y^3}{x^2+y^2}\\right|=r\\,|3\\cos^3\\theta-\\sin^3\\theta|\\le4r<4\\delta=\\varepsilon$. Luego el límite es $0$.',
    steps: ['La cota $4$ no depende de $\\theta$: es uniforme en todas las direcciones, lo que justifica el paso a polares.'],
    check: self,
  },
  '8.6': {
    hints: ['En polares $T=r(\\cos^3\\theta+\\sin^3\\theta)$.', '$|\\cos^3\\theta+\\sin^3\\theta|\\le2$.', 'Si el límite existe y es finito, defina $T(0,0)$ con ese valor.'],
    answer: '$|T|\\le2r\\to0$, así $\\lim_{(x,y)\\to(0,0)}T=0$: la singularidad es **removible**. Extensión continua: $\\tilde T(x,y)=T(x,y)$ si $(x,y)\\ne(0,0)$ y $\\tilde T(0,0)=0$.',
    steps: ['$\\frac{x^3+y^3}{x^2+y^2}=r\\cos^3\\theta+\\ldots=r(\\cos^3\\theta+\\sin^3\\theta)$.'],
    check: self,
    solver: { cat: 'limit2', inputs: { f: '(x^3+y^3)/(x^2+y^2)', point: '0,0' }, expect: 0 },
  },
  /* ---------------- Capítulo 9 ---------------- */
  '9.1': {
    hints: ['Para $f_x$ trate $y$ como constante.', '$\\frac{\\partial}{\\partial x}(4x^3y^2)=12x^2y^2$.', 'Para $f_y$: $\\frac{\\partial}{\\partial y}(4x^3y^2)=8x^3y$ y $\\frac{\\partial}{\\partial y}(8y)=8$.'],
    answer: '$f_x=12x^2y^2-3$, $f_y=8x^3y+8$.',
    steps: ['El término $-3x$ no depende de $y$ (su derivada en $y$ es $0$); $8y$ no depende de $x$.'],
    check: self,
    solver: { cat: 'partials', inputs: { f: '4*x^3*y^2-3*x+8*y', point: '1, 1' }, expect: NaN },
  },
  '9.2': {
    hints: ['$dz=z_x\\,dx+z_y\\,dy$.', '$z_x=\\ln y$.', '$z_y=x/y$.'],
    answer: '$dz=\\ln y\\,dx+\\dfrac xy\\,dy$',
    steps: ['$\\partial_x(x\\ln y)=\\ln y$; $\\partial_y(x\\ln y)=x/y$.'],
    check: self,
  },
  '9.3': {
    hints: ['Sea $M=2xy$, $N=x^2+3$. Es exacta si $M_y=N_x$.', '$M_y=2x$, $N_x=2x$.', 'Busque $F$ con $F_x=M$: $F=x^2y+g(y)$; derive en $y$ e iguale a $N$.'],
    answer: 'Es exacta ($M_y=N_x=2x$). Solución general: $F(x,y)=x^2y+3y=C$, es decir $y=\\dfrac{C}{x^2+3}$.',
    steps: ['$F=\\int2xy\\,dx=x^2y+g(y)$.', '$F_y=x^2+g\'(y)=x^2+3\\Rightarrow g=3y$.'],
    check: self,
  },
  '9.4': {
    hints: ['$f_x=ye^{xy}+\\cos x$, $f_y=xe^{xy}$.', 'Derive otra vez cada una.', 'Compare $f_{xy}$ con $f_{yx}$.'],
    answer: '$f_{xx}=y^2e^{xy}-\\sin x$, $f_{yy}=x^2e^{xy}$, $f_{xy}=f_{yx}=(1+xy)e^{xy}$. Como las mixtas coinciden (son continuas), se cumple el Teorema de Clairaut.',
    steps: ['$f_{xy}=\\partial_y(ye^{xy}+\\cos x)=e^{xy}+xye^{xy}$.', '$f_{yx}=\\partial_x(xe^{xy})=e^{xy}+xye^{xy}$.'],
    check: self,
    solver: { cat: 'partials', inputs: { f: 'exp(x*y)+sin(x)', point: '1, 1' }, expect: NaN },
  },
  '9.5': {
    hints: ['$R=\\frac{R_1R_2}{R_1+R_2}$, así $R=\\frac{100}{3}$.', '$\\frac{\\partial R}{\\partial R_1}=\\frac{R_2^2}{(R_1+R_2)^2}=\\frac49$, $\\frac{\\partial R}{\\partial R_2}=\\frac{R_1^2}{(R_1+R_2)^2}=\\frac19$.', 'Errores: $|dR_1|=0.5$ y $|dR_2|=1$; sume los valores absolutos.'],
    answer: '$|dR|\\le\\dfrac49(0.5)+\\dfrac19(1)=\\dfrac13\\approx0.333\\ \\Omega$ (con $R\\approx33.33\\ \\Omega$, error relativo $\\approx1\\%$).',
    steps: ['$dR=R_{R_1}dR_1+R_{R_2}dR_2$, y el error máximo se obtiene con todos los términos sumando.'],
    check: nums('Error máximo en Ω', [1 / 3], { tol: 5e-3 }),
  },
  '9.6': {
    hints: ['$f_x=\\frac{2x}{x^2+y^2}$.', '$f_{xx}=\\frac{2(y^2-x^2)}{(x^2+y^2)^2}$ y por simetría $f_{yy}=\\frac{2(x^2-y^2)}{(x^2+y^2)^2}$.', 'Sume.'],
    answer: '$f_{xx}+f_{yy}=\\dfrac{2(y^2-x^2)+2(x^2-y^2)}{(x^2+y^2)^2}=0$ para $(x,y)\\ne(0,0)$. El origen se excluye porque $\\ln0$ no está definido (y las derivadas no existen allí): el dominio de $f$ es $\\mathbb R^2\\setminus\\{(0,0)\\}$.',
    steps: ['Regla del cociente: $f_{xx}=\\frac{2(x^2+y^2)-4x^2}{(x^2+y^2)^2}$.'],
    check: self,
  },
  /* ---------------- Capítulo 10 ---------------- */
  '10.1': {
    hints: ['$\\frac{dz}{dt}=z_x\\,x\'+z_y\\,y\'$.', '$z_x=2xy$, $z_y=x^2$, $x\'=3$, $y\'=2t$.', 'Sustituya $x=3t$, $y=t^2$. Para comprobar: $z=9t^4$.'],
    answer: '$\\dfrac{dz}{dt}=2(3t)(t^2)(3)+(3t)^2(2t)=18t^3+18t^3=36t^3$. Comprobación directa: $z=9t^2\\cdot t^2=9t^4\\Rightarrow z\'=36t^3$ ✓.',
    steps: ['Ambos métodos coinciden.'],
    check: nums('Valor de $dz/dt$ en $t=1$', [36]),
    solver: { cat: 'chain', inputs: { f: 'x^2*y', x: '3*t', y: 't^2', t0: '1' }, expect: 36 },
  },
  '10.2': {
    hints: ['Resuelva $f_x=0$ y $f_y=0$.', '$f_x=2x-4$, $f_y=2y+6$.', 'Despeje.'],
    answer: 'Punto crítico: $(2,-3)$ (es un mínimo: $D=4>0$, $f_{xx}=2>0$; $f(2,-3)=-8$).',
    steps: ['$2x-4=0\\Rightarrow x=2$; $2y+6=0\\Rightarrow y=-3$.'],
    check: nums('Punto crítico $(x,y)$', [2, -3]),
    solver: { cat: 'extrema', inputs: { f: 'x^2+y^2-4*x+6*y+5', R: '6' }, expect: NaN },
  },
  '10.3': {
    hints: ['$f_{xx}=-6x$, $f_{yy}=-6y$, $f_{xy}=1$.', '$D=36xy-1$.', 'Evalúe en cada punto y use el criterio.'],
    answer: 'En $(\\tfrac13,\\tfrac13)$: $f_{xx}=-2$, $f_{yy}=-2$, $f_{xy}=1$, $D=4-1=3>0$ y $f_{xx}<0$ → **máximo local**. En $(0,0)$: $D=0-1=-1<0$ → **punto silla**.',
    steps: ['$D=f_{xx}f_{yy}-f_{xy}^2=36xy-1$.'],
    check: nums('$D$ en $(\\tfrac13,\\tfrac13)$ y $D$ en $(0,0)$', [3, -1]),
    solver: { cat: 'extrema', inputs: { f: 'x*y-x^3-y^3', R: '6' }, expect: NaN },
  },
  '10.4': {
    hints: ['Sea $x,y$ la base y $z=\\frac{32}{xy}$ la altura.', 'Material (sin tapa): $A=xy+2xz+2yz=xy+\\frac{64}{y}+\\frac{64}{x}$.', '$A_x=y-\\frac{64}{x^2}=0$, $A_y=x-\\frac{64}{y^2}=0$.'],
    answer: 'Dimensiones óptimas: $x=y=4\\ \\text{m}$, $z=2\\ \\text{m}$ (la altura es la mitad del lado), con $A_{\\min}=48\\ \\text{m}^2$.',
    steps: ['De $y=64/x^2$ y $x=64/y^2$: $x^3=64$, $x=4=y$, $z=32/16=2$.', '$D=A_{xx}A_{yy}-A_{xy}^2=\\frac{128}{x^3}\\frac{128}{y^3}-1=\\frac{128^2}{64^2}-1=3>0$ y $A_{xx}=2>0$: mínimo.'],
    check: nums('Dimensiones $x,y,z$ en m', [4, 4, 2]),
  },
  '10.5': {
    hints: ['$T=\\frac{PV}{8.31}$.', '$\\frac{dT}{dt}=\\frac{1}{8.31}\\left(V\\frac{dP}{dt}+P\\frac{dV}{dt}\\right)$.', 'Sustituya $V=10$, $P=2$, $\\frac{dP}{dt}=-0.05$, $\\frac{dV}{dt}=0.2$.'],
    answer: '$\\dfrac{dT}{dt}=\\dfrac{10(-0.05)+2(0.2)}{8.31}=\\dfrac{-0.1}{8.31}\\approx-0.0120\\ \\text{K/s}$ (la temperatura disminuye ligeramente).',
    steps: ['Regla de la cadena con $T(P,V)$ y $P,V$ funciones del tiempo.'],
    check: nums('$dT/dt$ en K/s', [-0.1 / 8.31], { tol: 1e-2 }),
  },
  '10.6': {
    hints: ['$\\nabla U=(-2x+4-2y,\\ -4y+4-2x)$.', 'Resuelva $\\nabla U=\\mathbf0$.', 'Hessiano: $U_{xx}=-2$, $U_{yy}=-4$, $U_{xy}=-2$.'],
    answer: '$\\nabla U=(4-2x-2y,\\ 4-2x-4y)$. Óptimo: $(2,0)$ con $U=4$. $D=(-2)(-4)-(-2)^2=4>0$ y $U_{xx}=-2<0$: máximo local; como $U$ es cuadrática con forma cuadrática definida negativa ($-x^2-2y^2-2xy=-(x+y)^2-y^2\\le0$), es un **máximo absoluto** en todo $\\mathbb R^2$.',
    steps: ['Restando las ecuaciones: $-2y=0\\Rightarrow y=0$, luego $x=2$.', 'Completando cuadrados: $U=4-(x+y-2)^2-y^2\\le4$, con igualdad sólo en $(2,0)$.'],
    check: nums('Punto óptimo $(x,y)$ y valor máximo $U$', [2, 0, 4]),
    solver: { cat: 'extrema', inputs: { f: '-x^2-2*y^2+4*x+4*y-2*x*y', R: '6' }, expect: NaN },
  },
};
