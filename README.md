# ContrarIA

ContrarIA es una aplicación web donde un consejo de cinco agentes de IA contrasta una idea de negocio desde estrategia, tecnología, UX, riesgo y crítica. El debate ocurre en dos rondas y termina con un veredicto accionable, riesgos priorizados y un experimento de validación de 48 horas.

## Problema y solución

Validar una idea de negocio en solitario suele reforzar supuestos sin contrastarlos. ContrarIA simula la conversación crítica de un consejo de especialistas para que una persona reciba argumentos a favor y en contra antes de decidir si avanza, pivota o descarta su idea.

El caso de demo es **MarAzul**, una plataforma para pescadores artesanales de Manabí que cruza clima, precio de mercado y demanda para ayudar a decidir cuándo conviene salir a pescar.

## Tecnologías utilizadas

- **Framework:** Next.js con App Router, frontend y rutas backend en el mismo proyecto.
- **Lenguaje:** JavaScript.
- **Estilos:** Tailwind CSS.
- **IA - OpenAI/Codex:** moderador inicial y síntesis final del veredicto, con salida estructurada.
- **IA - DeepSeek:** los cinco agentes especialistas del debate; los roles de estrategia y UX priorizan velocidad, mientras que tecnología, riesgo y crítica priorizan razonamiento.
- **Hosting:** Vercel.
- **Control de versiones:** GitHub.

## Demo

🔗 _(URL de demo por completar por el equipo)_

## Repositorio

🔗 _(URL de repositorio por completar por el equipo)_

## Arquitectura

El usuario escribe una idea o carga el caso MarAzul. Un endpoint de debate transforma esa entrada en un contexto común, reúne en paralelo las posturas iniciales de cinco especialistas y les permite responder a los argumentos cruzados en una segunda ronda. Finalmente, un moderador sintetiza todo el debate en una decisión, puntuación, riesgos y el experimento recomendado.

El proyecto no requiere base de datos para la demo: el estado vive durante la sesión. Cada llamada de IA deberá devolver datos estructurados y validados para que la interfaz pueda mostrarlos de forma fiable.

## Uso de OpenAI

OpenAI/Codex se utiliza como capa de orquestación: estructura la idea al inicio y consolida el debate completo en el veredicto final. Esta separación permite que los especialistas se concentren en sus perspectivas específicas y que la interfaz reciba una respuesta predecible.

## Evidencia

- Captura 1: _(agregar)_
- Captura 2: _(agregar)_
- Video de demo: _(agregar link)_

## Impacto

ContrarIA ayuda a personas con ideas de negocio en etapa temprana a recibir contraste crítico inmediato y terminar con una acción concreta para validar el supuesto más frágil de su propuesta.

## Equipo

- _(nombre 1)_
- _(nombre 2)_
- _(nombre 3)_

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
| `OPENAI_API_KEY` | Moderador inicial y veredicto final | Pendiente de integración |
| `DEEPSEEK_API_KEY` | Especialistas del debate | Pendiente de integración |

Usa `.env.local` solo en desarrollo. Nunca subas claves reales a Git. En Vercel, crea ambas variables como sensibles para Preview y Production cuando el backend de IA las necesite.

## Despliegue en Vercel

1. Inicia sesión en Vercel y autoriza la integración con GitHub.
2. Selecciona **Add New → Project** e importa `JairJama/contraria-codex_buildathon`.
3. Configura el proyecto como `contraria-codex-buildathon`, con framework **Next.js**, directorio raíz `.` y `npm run build` como comando de build.
4. No agregues claves reales en este primer despliegue: la página principal y `/api/health` no las requieren.
5. Selecciona **Deploy** y verifica la URL generada junto con `/api/health`.
6. En Project Settings, confirma que `main` sea la Production Branch. Los pushes a `main` crean despliegues de producción; las demás ramas reciben Preview Deployments.

Para comprobar un Preview Deployment:

```bash
git switch -c chore/vercel-preview-check
git commit --allow-empty -m "test: verify Vercel preview"
git push -u origin chore/vercel-preview-check
```

Vercel publicará la URL Preview en su dashboard y en la integración de GitHub.
