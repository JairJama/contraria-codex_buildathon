# ContrarIA

ContrarIA es una aplicación web donde un consejo de cinco agentes de IA contrasta una idea de negocio, producto, servicio o proyecto de desarrollo desde estrategia, tecnología, UX, riesgo y crítica. El debate ocurre en dos rondas y termina con un veredicto accionable, riesgos priorizados, nivel de confianza y un experimento de validación de 48 horas.

## Problema y solución

Validar una idea de negocio en solitario suele reforzar supuestos sin contrastarlos. ContrarIA simula la conversación crítica de un consejo de especialistas para que una persona reciba argumentos a favor y en contra antes de decidir si avanza, pivota o descarta su idea.

El caso de demo es **MarAzul**, una plataforma para pescadores artesanales de Manabí que cruza clima, precio de mercado y demanda para ayudar a decidir cuándo conviene salir a pescar.

## Tecnologías utilizadas

- **Framework:** Next.js con App Router, frontend y rutas backend en el mismo proyecto.
- **Lenguaje:** JavaScript.
- **Estilos:** Tailwind CSS.
- **IA - OpenAI/Codex:** moderador inicial, Tecnología, Riesgo, Crítico y moderador final. Tecnología y el veredicto usan GPT-5.6 Terra con razonamiento medio; Riesgo y Crítico usan GPT-5.6 Luna con razonamiento alto.
- **IA - DeepSeek:** Estrategia y UX usan DeepSeek V4 Flash sin razonamiento para aportar velocidad y una segunda perspectiva de proveedor.
- **Hosting:** Vercel.
- **Control de versiones:** GitHub.

## Demo

🔗 [https://contraria-codex-buildathon.vercel.app/](https://contraria-codex-buildathon.vercel.app/)

## Repositorio

🔗 _(URL de repositorio por completar por el equipo)_

## Arquitectura

El usuario escribe una propuesta o carga el caso MarAzul. El único endpoint, `POST /api/debate`, valida la entrada, transforma la propuesta en un contexto común y ejecuta dos rondas de cinco especialistas en paralelo. En la segunda ronda cada agente considera las posturas de los demás; finalmente, un moderador sintetiza una decisión, puntuación, nivel de confianza, riesgos y un experimento recomendado de 48 horas.

El proyecto no requiere base de datos para la demo: el estado vive durante la sesión. Cada llamada de IA devuelve datos estructurados y validados para que la interfaz pueda mostrarlos de forma fiable.

El endpoint reserva un presupuesto global de 55 segundos dentro de `maxDuration = 60`: limita cada intento, ejecuta las rondas en paralelo, reintenta solo cuando todavía existe margen y devuelve posturas o un veredicto de respaldo si una llamada falla. Así una falla puntual no cancela el debate completo ni expone datos de proveedores al usuario.

## Uso de OpenAI

OpenAI coordina el debate: el moderador inicial estructura la idea, Tecnología, Riesgo y Crítico emiten sus posturas, y el moderador final entrega la síntesis. DeepSeek participa únicamente en Estrategia y UX, con respuestas rápidas y salidas JSON validadas antes de integrarse a cada ronda.

## Evidencia

- Captura 1: _(agregar)_
- Captura 2: _(agregar)_
- Video de demo: _(agregar link)_

## Impacto

ContrarIA ayuda a personas con ideas de negocio en etapa temprana a recibir contraste crítico inmediato y terminar con una acción concreta para validar el supuesto más frágil de su propuesta.

## Equipo

Saul Ivan Castro Muñoz
Roosevelt Jair Jama Guaman
Jandry David Fernandez Cedeño

## Requisitos

- Node.js 20.9 o superior
- npm

## Ejecución local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La ruta de salud está disponible en [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Scripts

```bash
npm run dev    # servidor de desarrollo
npm run build  # build de producción
npm run start  # sirve el build de producción
```

## Variables de entorno

| Variable | Uso | Estado actual |
| --- | --- | --- |
| `OPENAI_API_KEY` | Moderadores, Tecnología, Riesgo y Crítico | Definida localmente; falta configurarla en Vercel |
| `DEEPSEEK_API_KEY` | Estrategia y UX | Definida localmente; falta configurarla en Vercel |

Usa `.env` o `.env.local` solo en desarrollo. Nunca subas claves reales a Git. En Vercel, crea `OPENAI_API_KEY` y `DEEPSEEK_API_KEY` como variables sensibles para Preview y Production.

## Despliegue en Vercel

1. Inicia sesión en Vercel y autoriza la integración con GitHub.
2. Selecciona **Add New → Project** e importa `JairJama/contraria-codex_buildathon`.
3. Configura el proyecto como `contraria-codex-buildathon`, con framework **Next.js**, directorio raíz `.` y `npm run build` como comando de build.
4. En **Environment Variables**, agrega `OPENAI_API_KEY` y `DEEPSEEK_API_KEY` como variables sensibles para Preview y Production antes de desplegar el endpoint de debate.
5. Selecciona **Deploy** y verifica la URL generada junto con `/api/health` y el flujo de debate.
6. En Project Settings, confirma que `main` sea la Production Branch. Los pushes a `main` crean despliegues de producción; las demás ramas reciben Preview Deployments.

Para comprobar un Preview Deployment:

```bash
git switch -c chore/vercel-preview-check
git commit --allow-empty -m "test: verify Vercel preview"
git push -u origin chore/vercel-preview-check
```

Vercel publicará la URL Preview en su dashboard y en la integración de GitHub.
