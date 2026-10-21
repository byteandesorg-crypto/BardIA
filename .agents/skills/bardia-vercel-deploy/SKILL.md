---
name: bardia-vercel-deploy
description: Diagnosticar, prevenir y resolver fallos de compilación, variables de entorno y despliegue en Vercel para BARDIA.
---

# BARDIA Vercel Deploy Skill

Esta skill enseña cómo preparar, verificar y depurar despliegues de BARDIA en Vercel, asegurando compatibilidad con Next.js 15, variables de entorno seguras y build hermético.

## Cuándo usar esta skill
- Antes de enviar cambios a la rama principal (`main`) o crear un Pull Request.
- Cuando un despliegue en Vercel falle durante el paso de `next build` o en el arranque.
- Al configurar o auditar variables de entorno de producción y preview.
- Para diagnosticar diferencias de comportamiento entre el entorno local y Vercel (Edge vs Node runtime, SSR vs SSG).

## Diferenciación clave de errores en Vercel
1. **Errores de Build-time (fase `next build`):**
   - Errores de sintaxis o tipos TypeScript (`tsc`).
   - Dependencias faltantes en `package.json` o lockfile desactualizado.
   - Acceso en tiempo de compilación a variables de entorno sin fallbacks o fallos al prerenderizar páginas dinámicas.
2. **Errores de Runtime (después del deploy exitoso):**
   - Variables de entorno no configuradas en el dashboard de Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Fallos de conexión a Supabase (por ejemplo, base de datos pausada / `INACTIVE`).
   - Incompatibilidades de Edge Runtime en middleware o Server Components.

## Procedimiento paso a paso para asegurar el despliegue

### Paso 1: Reproducción local exacta del build de Vercel
En la raíz del proyecto, ejecutar:
```bash
# Limpiar caché de compilación previa
rm -rf .next

# Ejecutar el build idéntico al comando de Vercel
npm run build
```
Si el comando produce código de salida 0:
- Se valida la integridad de todas las rutas del App Router.
- Se comprueba la generación de páginas dinámicas (`λ (Server)`) y estáticas (`○ (Static)`).
- Se confirma que TypeScript y ESLint pasaron sin omisiones.

### Paso 2: Auditoría de variables de entorno requeridas
En Vercel (Settings -> Environment Variables), deben estar configuradas:
1. `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto de Supabase (ej. `https://jlxqybmesrrrsnzdewdt.supabase.co`).
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Llave pública anon para clientes de navegador y servidor.
3. `SUPABASE_SERVICE_ROLE_KEY`: (Opcional/restringida) Solo si existen tareas administrativas backend; nunca con prefijo `NEXT_PUBLIC_`.

- **Mecanismo de seguridad de BARDIA:**
  El módulo [`src/lib/supabase/env.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/env.ts) implementa validación estricta:
  - En desarrollo, avisa si las variables faltan.
  - En producción, lanza advertencias en consola para permitir diagnóstico inmediato en los logs de runtime de Vercel sin exponer los valores reales.

### Paso 3: Configuración de Vercel y Next.js
Revisar [`next.config.mjs`](file:///c:/Users/Franco/Desktop/BardIA/next.config.mjs):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantener reactStrictMode activo
  reactStrictMode: true,
};

export default nextConfig;
```
- **Regla:** NO agregar `ignoreBuildErrors: true` en `next.config.mjs` ni en `eslint`. Un build que oculta errores fallará tarde o temprano en producción.

### Paso 4: Revisión del middleware y Edge Runtime
El archivo [`middleware.ts`](file:///c:/Users/Franco/Desktop/BardIA/middleware.ts) se ejecuta en Edge Middleware:
- No debe importar librerías pesadas de Node.js (como `fs`, `path`, `crypto` nativo de Node).
- Debe utilizar exclusivamente el cliente SSR optimizado de [`src/lib/supabase/middleware.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/middleware.ts).
- Debe excluir rutas estáticas en su `matcher`:
  ```typescript
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
  ```

### Paso 5: Verificación del estado del backend Supabase
Antes de declarar un despliegue operativo:
- Verificar que el proyecto de Supabase esté en estado `ACTIVE`. Si está en estado `INACTIVE`, Vercel desplegará correctamente el frontend pero las consultas de login y dashboard devolverán error de conexión (`500` o `fetch failed`).

## Verificación
1. `npm run build` local exitoso.
2. Comprobar que no haya secretos expuestos en Git (`git status`, `git diff`).
3. Al desplegar en Vercel, verificar que el log de despliegue termine en `Ready` o `Build Successful` sin advertencias de deprecación crítica.
