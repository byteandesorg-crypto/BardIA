---
name: bardia-debugging
description: Diagnosticar y resolver errores en BARDIA identificando causas raíz sin modificaciones especulativas ni degradación de tipos.
---

# BARDIA Debugging Skill

Esta skill establece la metodología estricta para diagnosticar y corregir errores de compilación, runtime, hidratación de React 19 y comunicación con Supabase en BARDIA.

## Reglas de oro del debugging en BARDIA
1. **Nunca ocultar síntomas:** No usar `any`, `@ts-ignore`, `eslint-disable` ni `skipLibCheck` para silenciar un error.
2. **Reproducir antes de editar:** Obtener el stack trace completo y el código de error exacto.
3. **Corrección de causa raíz:** Atacar el origen de los datos o el tipo incompatible, no simplemente parchear el punto de caída.
4. **Validación sin regresiones:** Correr toda la suite de comprobaciones tras cada corrección.

## Cuándo usar esta skill
- Cuando falla `npm run build` o `npx tsc --noEmit`.
- Cuando Next.js arroja errores de hidratación (`Hydration failed because the initial UI does not match the server-rendered HTML`).
- Al depurar errores 401/403 de Supabase o fallos en Server Actions / API Routes.
- Cuando una vista renderiza datos vacíos o bucles infinitos de re-render.
- Al detectar inconsistencias en cálculos de métricas (ritmo, desnivel acumulado, zonas de FC).

## Protocolo de diagnóstico paso a paso

### Paso 1: Reproducir y aislar el error
Ejecutar los comandos disponibles para aislar el tipo de problema:
```bash
# 1. Chequeo de tipado estático
npx tsc --noEmit

# 2. Análisis estático de ESLint
npm run lint

# 3. Compilación de producción de Next.js
npm run build
```

### Paso 2: Análisis por categoría de error común

#### Categoría A: Errores de TypeScript con Supabase
- **Síntoma:** `Property 'xyz' does not exist on type 'Database["public"]["Tables"]["..."]["Row"]'`.
- **Causa raíz:** Discrepancia entre la consulta `.select()` y el tipo declarado en `src/types/database.ts`, o desestructuración de una relación 1:N como si fuera 1:1 (ej. `athlete_profiles: athlete_profiles[0]`).
- **Solución:**
  - Si una relación Supabase retorna un array, mapearlo correctamente: `const profile = Array.isArray(student.athlete_profiles) ? student.athlete_profiles[0] : student.athlete_profiles;`.
  - Asegurar que `src/types/database.ts` refleje los campos exactos documentados en [`docs/architecture/database-schema.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/database-schema.md).

#### Categoría B: Errores de hidratación en React 19 / Next.js 15
- **Síntoma:** El servidor genera HTML que no coincide con el renderizado inicial en el cliente.
- **Causa raíz habitual:**
  - Uso de `new Date()`, `Math.random()` o `window` directamente en el cuerpo del componente sin `useEffect`.
  - Diferencias de zona horaria o formateo de fechas localizadas en el servidor vs navegador.
- **Solución:**
  - Formatear fechas con funciones deterministas de [`src/lib/utils.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/utils.ts) (ej. `formatDate(date, 'es-AR')` con parámetros fijos).
  - Usar un estado `const [mounted, setMounted] = useState(false)` con `useEffect(() => setMounted(true), [])` si el componente depende exclusivamente de APIs del browser.

#### Categoría C: Errores de autenticación y SSR Cookies
- **Síntoma:** Redirecciones infinitas hacia `/login` o fallos `AuthSessionMissingError`.
- **Causa raíz:**
  - Middleware no actualiza las cookies de la respuesta, provocando que la sesión expire prematuramente.
  - Llamada a `createClient` en Server Components sin pasar `cookies()` asíncrono en Next.js 15.
- **Solución:**
  - Verificar que [`src/lib/supabase/server.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/server.ts) use `await cookies()`.
  - Asegurar que `middleware.ts` llame a `updateSession(request)` y retorne la `supabaseResponse` con los encabezados de cookies intactos.

#### Categoría D: Errores de cálculo numérico o redondeo
- **Síntoma:** Ritmo con segundos `= 60` (ej. `4:60 /km`), división por cero cuando la distancia es 0, o duraciones negativas.
- **Solución:**
  - Consultar y aplicar las fórmulas puras de [`src/lib/utils.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/utils.ts).
  - Redondear siempre los segundos totales primero: `const totalSec = Math.round(paceSecKm); const min = Math.floor(totalSec / 60); const sec = totalSec % 60;`.

### Paso 3: Diseño e implementación de la corrección mínima
1. Hacer el cambio más conciso y enfocado posible en el archivo responsable.
2. No refactorizar archivos no relacionados al error.
3. Asegurar que las variables de entorno se obtengan de forma segura mediante [`src/lib/supabase/env.ts`](file:///c:/Users/Franco/Desktop/BardIA/src/lib/supabase/env.ts).

### Paso 4: Verificación de no regresión
Ejecutar secuencialmente:
1. `npx tsc --noEmit` -> Debe terminar en código 0.
2. `npm run lint` -> Debe terminar en código 0.
3. `npm run build` -> Debe generar las páginas estáticas y SSR sin errores.
