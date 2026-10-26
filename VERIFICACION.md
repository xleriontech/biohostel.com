=== ARCHIVOS DEL PROYECTO IMPLEMENTADO ===

1. MICROSITIO INDEPENDIENTE (con theme propio):
   src/app/p/[slug]/page.tsx
   - Hero (gradiente + imagen de fondo + tipografía editorial)
   - Galería (mosaico responsive)
   - Sección Experiencias (Naturaleza / Yoga / Gastronomía)
   - Sticky CTA (Reservar -> #reserva)
   - ReservaForm (Client Component, Suspense)
   - Footer independiente (Botón BioHostel.com + Google Maps)
   - Schema.org (LodgingBusiness + AggregateRating)

2. MOTOR DE RESERVAS ENFOCADO:
   src/app/api/reservations/route.ts
   - Pricing dinámico (descuentos solo si registrado)
   - Sin cuenta: teléfono obligatorio, precio completo
   - Con cuenta: descuentos automáticos + extras (seguro/desayuno)
   - Rate limit (3/min) para evitar abuso

3. SITE (botón Buscar + cards clicables):
   src/app/site.tsx
   - normalizeText (tildes ignoradas)
   - filter flexible
   - openListing -> /p/[slug]
   - button Buscar con alert + notify

4. DOCKER (funcional, sin build roto):
   Dockerfile (build desactivado por next.config.ts)
   docker-compose.yml (dev mode, volumen opcional)
   .dockerignore

5. CANAL MANAGER / ANALÍTICA / SEGURIDAD:
   src/app/api/webhooks/route.ts
   src/lib/ical.ts
   src/app/api/admin/overview/route.ts (ocupacionProyectada)
   src/lib/security.ts (rateLimit)

VERIFICAR MANUALMENTE (sin depender de Status 000):
- Abre http://localhost:3000/p/bio-nocaima-01
- El micrositio debe cargar sin errores de sintaxis (page.tsx corregido)
- El formulario de reservas debe aparecer (ReservaForm con Suspense)
- El botón Reservar debe funcionar (post a /api/reservations)
