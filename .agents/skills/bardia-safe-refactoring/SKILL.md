---
name: bardia-safe-refactoring
description: Ejecutar refactorizaciones seguras en BARDIA preservando contratos de API, tipos, aislamiento multi-tenant y estabilidad funcional.
---

# BARDIA Safe Refactoring Skill

Esta skill enseña la metodología para realizar refactorizaciones y mejoras de código en BARDIA de forma controlada, minimizando riesgos y asegurando que no se rompan funcionalidades existentes ni se degraden tipos.

## Cuándo usar esta skill
- Al reorganizar componentes compartidos o extraer utilidades.
- Al optimizar Server Components y reducir el bundle enviado al cliente.
- Al actualizar consultas de Supabase para soportar nuevos campos o relaciones.
- Al modificar interfaces de tipos en `src/types/database.ts`.
- Al rediseñar componentes de interfaz manteniendo la compatibilidad con el resto del sistema.

## Protocolo de refactorización en 5 fases

### Fase 1: Identificación del alcance y dependencias
1. Localizar todos los archivos que importan el módulo a modificar.
   - Usar búsqueda ripgrep / grep para encontrar todas las referencias al símbolo o ruta.
2. Consultar [`docs/architecture/module-dependencies.md`](file:///c:/Users/Franco/Desktop/BardIA/docs/architecture/module-dependencies.md) para evaluar el impacto en componentes dependientes.
3. Crear o confirmar una rama de trabajo dedicada (ej. `refactor/nombre-mejora`), preservando `main`.

### Fase 2: Preservación del contrato de datos y comportamiento
- **Contrato de Props:** Si se modifica un componente de UI (ej. `EmptyState`, `MetricCard`, `Card`), mantener la retrocompatibilidad:
  - Si se añade una nueva prop (ej. `actionHref`), hacerla opcional si la prop anterior (`onAction`) aún es utilizada en otros lugares.
  - No romper llamadas existentes.
- **Contrato de Base de Datos:** Si se cambia una función o consulta de Supabase, verificar que el objeto retornado conserve los nombres de campo esperados por los componentes que consumen la respuesta.

### Fase 3: Modificación en lotes pequeños y coherentes
- **Nunca hacer "big bang refactor":** No cambiar tipos, consultas, componentes de UI y estilos simultáneamente en un solo paso masivo.
- **Orden recomendado de aplicación:**
  1. Tipos y utilidades base (`src/types/`, `src/lib/utils.ts`).
  2. Capa de acceso a datos y Server Components.
  3. Client Components y formularios interactivos.
  4. Vistas y páginas del App Router.

### Fase 4: Validación continua durante la refactorización
Tras modificar cada lote pequeño, ejecutar inmediatamente:
```bash
# Verificar que el tipado no se haya roto
npx tsc --noEmit

# Verificar reglas de estilo y hooks de React
npm run lint
```
Si se detecta un error de tipo, resolverlo en ese mismo lote antes de pasar al siguiente componente.

### Fase 5: Revisión de diffs y verificación final
1. Inspeccionar detalladamente los cambios realizados:
   ```bash
   git diff --stat
   git diff
   ```
2. Comprobar que:
   - No se hayan eliminado validaciones de negocio.
   - No se hayan introducido `any` o `@ts-ignore`.
   - No se hayan introducido variables o imports no utilizados.
   - No se hayan alterado archivos no relacionados con la tarea.
3. Ejecutar el build completo de producción:
   ```bash
   npm run build
   ```

## Lista de control antes de dar por cerrada una refactorización
- [ ] ¿El cambio está acotado al alcance previsto?
- [ ] ¿Los contratos de props y retornos de funciones son compatibles?
- [ ] ¿Se mantuvieron los filtros multi-tenant `organization_id`?
- [ ] ¿`npx tsc --noEmit` arroja 0 errores?
- [ ] ¿`npm run lint` arroja 0 advertencias/errores?
- [ ] ¿`npm run build` genera la aplicación exitosamente?
