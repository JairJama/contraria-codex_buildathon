# ContrarIA

Aplicación web para contrastar una idea de negocio mediante un consejo de agentes de IA con perspectivas de estrategia, tecnología, UX, riesgo y crítica.

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
