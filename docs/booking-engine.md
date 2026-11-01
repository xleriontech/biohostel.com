# Motor de reservas de Biohostels: flujo real y limitaciones

Documento de referencia del motor de disponibilidad, reservas y pagos implementado en este repositorio. Describe lo que el sistema **hace hoy**, no lo que una integración futura con APIs de OTAs podría hacer.

Fecha: 2026-10-31 · Aplica al código en `src/lib/booking-engine.ts`, `src/lib/payments.ts`, `src/lib/channel-sync.ts`, `src/lib/notifications.ts`, `src/app/api/availability`, `src/app/api/reservations`, `src/app/api/payments/wompi`, `src/app/api/calendar/[id]` y `src/app/reserva/[code]`.

---

## 1. Resumen

Biohostels no consulta Booking ni Airbnb en tiempo real. El motor combina cuatro fuentes de ocupación:

1. **Reservas confirmadas** creadas en Biohostels.
2. **Retenciones temporales** de reservas con pago en línea pendiente (`pendiente_pago` + `holdUntil`, 30 minutos).
3. **Calendarios iCal importados** por el anfitrión (Airbnb/Booking/Google Calendar), descargados por el servidor y cacheados en `listing-channels`.
4. **Fechas cargadas manualmente** en el alojamiento (`fechasOcupadasBooking`, `fechasOcupadasAirbnb`, usadas también por los datos de demostración).

Con esas fuentes verifica disponibilidad, calcula precio y bloquea la reserva de forma atómica. El bloqueo se devuelve a las OTAs mediante un **feed iCal público por alojamiento** que el anfitrión conecta como "Importar calendario" en Airbnb/Booking.

Los pagos en línea usan **Wompi Web Checkout**. Si las llaves de Wompi no están configuradas, la reserva se confirma y el pago se coordina manualmente con el anfitrión. Los correos transaccionales usan **Resend** y son opcionales.

---

## 2. Flujo completo

```
Anfitrión                         Biohostels                              OTA (Booking / Airbnb)
    |                                 |                                          |
    |-- POST /api/listings ---------->| crea alojamiento (RNT obligatorio)       |
    |                                 | subarriendo: nace pausado hasta doc      |
    |-- POST /api/listing-channels -->| guarda URL iCal del canal                |
    |-- PATCH /api/listing-channels ->| GET iCal -> occupied[] (manual)          |
    |                                 | refresco perezoso al consultar/reservar  |
    |                                 |                                          |
Huésped                           |                                          |
    |-- GET /api/availability ------->| mergeOccupied(listing, canales, reservas)|
    |<-- disponible / conflictos -----| quote + alternativas                     |
    |-- POST /api/reservations ------>| CAS sobre tabla reservations             |
    |                                 | sin Wompi: reserva confirmada            |
    |                                 | con Wompi: hold 30 min + checkout URL    |
    |<-- reserva + URL de pago -------|                                          |
    |-- paga en checkout.wompi.co --->|                                          |
    |                                 |<-- POST /api/payments/wompi (webhook) ---|
    |                                 |--- valida firma, monto y moneda          |
    |                                 |--- confirma o cancela la reserva         |
    |<-- /reserva/<code> -------------| estado actualizado + feed iCal           |
    |                                 |<--- el anfitrión pega el feed en OTA ----|
    |                                 |--- la OTA re-descarga el .ics (horas) --->|
```

### 2.1 Alta del alojamiento

`POST /api/listings` exige sesión, RNT válido (`normalizeRnt` + `isValidRnt`) y, si `tipo === "subarriendo"`, declaración de autorización escrita del propietario. El subarriendo se crea con `active: false` y solo se activa (`PATCH`) cuando existe la autorización declarada **y** el documento privado cargado en `POST /api/listings/sublease-doc`. El documento se guarda fuera de `public/` (R2 `private/` o `.data/private/`) y solo lo leen propietario y admin mediante `GET /api/listings/sublease-doc?id=`.

### 2.2 Importación de calendarios (iCal)

- `POST /api/listing-channels` registra un canal con `platform`, `url` e `icalUrl`.
- `PATCH /api/listing-channels` con `{ id }` descarga el iCal en el servidor (`fetchIcalDates`, timeout 15 s, cabecera `User-Agent: BiohostelsSync/1.0`), valida `BEGIN:VCALENDAR` y guarda las fechas ocupadas en `channel.occupied`. Actualiza `lastSync`.
- **Refresco perezoso**: un canal se considera vencido a los 20 minutos. El servidor refresca los canales vencidos antes de:
  - calcular disponibilidad de un alojamiento (`GET /api/availability`): máx. 2 canales, timeout 2 s;
  - crear una reserva (`POST /api/reservations`): máx. 2 canales, timeout 2,5 s;
  - buscar disponibilidad en la landing (`GET /api/availability/search`): máx. 3 canales, timeout 2,5 s.

  El refresco es *best effort*: si el calendario externo falla o tarda, la consulta continúa con el último `occupied` cacheado. No hay cron ni cola; el botón "Sincronizar" del panel sigue disponible para forzar la descarga.

Parser (`parseIcalDates`):

- Empareja `DTSTART[i]` con `DTEND[i]` por orden de aparición; si falta `DTEND`, bloquea un día.
- Ignora `RRULE`, `RECURRENCE-ID`, `EXDATE`, `STATUS:CANCELLED` y cancelaciones por `METHOD:CANCEL`.
- Tope de 730 noches por calendario para evitar respuestas gigantes.
- Interpreta las fechas a las 12:00 UTC para evitar corrimientos de zona horaria.

### 2.3 Consulta de disponibilidad

`GET /api/availability?listingId=&checkIn=&checkOut=&guests=`

- Sin fechas: devuelve `occupied` (calendario completo) y `constraints` (`minStay`, `maxStay`, `maxGuests`).
- Con fechas: `validateStay` (activo, orden de fechas, no pasado, estancia mínima/máxima, capacidad) + `checkAvailability`.
- `mergeOccupied` une: `fechasOcupadasBooking`, `fechasOcupadasAirbnb`, `occupied` de cada canal y noches de reservas internas que bloquean (`reservationBlocks`): confirmadas y retenciones vigentes.
- Si hay conflicto, `findAlternatives` propone hasta 3 corrimientos de fecha (±1, ±2, ±3 días) y alojamientos del mismo destino con capacidad y fechas libres, ordenados por rating y precio.
- El precio se calcula con `dynamicPrice` (temporada, huéspedes, tipo, plan registrado) y la tasa de comisión del plan del anfitrión.

**Búsqueda en la landing**: `GET /api/availability/search?checkIn=&checkOut=&guests=1` valida las fechas, refresca canales vencidos y devuelve un resultado por alojamiento activo (`available`, `reason`, `issues`, `conflicts`). Límite: 30 búsquedas por minuto por IP. La landing filtra el catálogo con esos resultados; si el huésped no indica fechas, la búsqueda del hero le pide fechas válidas.

### 2.4 Creación de reserva y retención

`POST /api/reservations`

- Límite de 3 intentos por minuto por IP/usuario (en memoria del proceso).
- Invitados: nombre, correo, teléfono y `consent === true` obligatorios (Ley 1581 de 2012).
- `validateStay` fuera de la transacción y `quoteFor` para el precio.
- Escritura con `updateTable("reservations", ...)`: bucle CAS (5 intentos) que lee la fila completa de `kv_store`, aplica la función de actualización y escribe con `UPDATE ... WHERE v = <raw leído>`. Si otro proceso escribió antes, reintenta la operación completa.
- Dentro de la transacción se re-ejecuta `checkAvailability` contra las filas leídas en ese instante, se comprueba idempotencia por `requestId` + huésped y solo entonces se inserta la reserva.
- **Sin Wompi configurado**: `status: "confirmada"`, `payment.provider: "manual"`, `payment.status: "no_aplica"`. El pago se coordina con el anfitrión.
- **Con Wompi configurado**: `status: "pendiente_pago"`, `holdUntil = ahora + 30 min`, `payment.status: "pendiente"` y `checkoutUrl` firmado. La respuesta incluye `payment.url` y `payment.holdUntil`.
- Respuesta `409` con `conflicts` por plataforma y `alternatives` si las fechas se ocuparon.
- El consentimiento se registra en la reserva (versión, fecha, IP, user agent) y en `consent-logs` solo cuando la reserva no es idempotente.

La retención bloquea las fechas para todos los cálculos de disponibilidad y se exporta como `STATUS:TENTATIVE` en el feed iCal. No hay proceso en segundo plano que cambie el estado: `reservationBlocks` evalúa `holdUntil` en cada consulta, por lo que una retención vencida deja de bloquear automáticamente. El registro puede seguir en `pendiente_pago` hasta que llegue el webhook o el anfitrión/admin lo cancele o confirme manualmente; la interfaz lo etiqueta como "Retención vencida".

### 2.5 Webhook de pagos (Wompi)

`POST /api/payments/wompi`

- Sin configuración de Wompi responde `503`.
- Verifica `signature.checksum` sobre las propiedades indicadas + `timestamp` + `events_secret` (comparación en tiempo constante).
- Ignora eventos distintos de `transaction.updated`.
- Busca la reserva por `transaction.reference`; si no existe responde `200` para evitar reintentos de otro entorno.
- Valida moneda `COP` y `amount_in_cents === Math.round(total) * 100`.
- Mapea estados: `APPROVED` → `confirmada`; `DECLINED`/`ERROR` → `cancelada`; `VOIDED` → `cancelada` y pago `expirado`; `PENDING` se ignora.
- Actualiza con CAS, guarda `transactionId`, método y monto, limpia `holdUntil` y es idempotente si el mismo `transactionId` ya produjo el mismo estado.
- Si el pago aprobado llega cuando la retención venció, la reserva fue cancelada o las fechas ya se re-vendieron, **no se confirma**: la reserva queda cancelada con el pago marcado como aprobado y se envía el correo `pago_tardio` para gestionar el reembolso manualmente. Así se evita duplicar la reserva.
- Envía correo de pago aprobado o rechazado solo si hubo cambio real.

**No hay integración de reembolsos**: cancelar una reserva pagada no devuelve el dinero automáticamente. El reembolso debe gestionarse manualmente desde el panel de Wompi.

### 2.6 Correos transaccionales

`notifyReservation` usa la API de Resend (`RESEND_API_KEY`). Si falta la llave o el correo del huésped, devuelve `no_configurado` y la operación continúa. Las plantillas (`src/lib/email-templates.ts`) escapan todos los valores dinámicos y cubren: pago pendiente, pago aprobado, reserva confirmada (modo manual), cancelación y pago rechazado. El resultado del envío se devuelve en la respuesta de la API, pero **no se persiste** en la reserva.

### 2.7 Exportación del bloqueo a las OTAs

`GET /api/calendar/[id]` devuelve `text/calendar` con un `VEVENT` por reserva confirmada y por retención vigente (`STATUS:TENTATIVE`, resumen "Pago pendiente"). Incluye `METHOD:PUBLISH`, `REFRESH-INTERVAL:PT1H` y `X-PUBLISHED-TTL:PT1H`; la respuesta lleva `Cache-Control: public, max-age=300, s-maxage=300`. El anfitrión copia esa URL en "Importar calendario" de Airbnb/Booking. La OTA la vuelve a descargar según su propia frecuencia (habitualmente cada pocas horas, no configurable desde Biohostels).

### 2.8 Webhooks de canales (opcional)

`POST /api/webhooks` acepta eventos `reservation_created` / `reservation_cancelled` firmados con HMAC-SHA256 (`x-biohostel-signature`, secreto `WEBHOOK_SECRET`, comparación en tiempo constante). Sirve para que un integrador propio empuje bloqueos sin esperar al iCal. En producción, sin `WEBHOOK_SECRET` el endpoint responde `503`.

---

## 3. Garantías reales

| Garantía | Estado |
|---|---|
| Sin doble reserva **dentro de Biohostels** | Sí. CAS sobre `reservations` + re-verificación dentro de la transacción. |
| Retención durante el pago | Sí, 30 minutos; bloquea fechas y se exporta como tentativa. |
| Idempotencia de reintentos | Sí, con `requestId` por huésped. |
| Precio determinista | Sí, función pura de fechas/huéspedes/plan. |
| Comisión por plan | Sí, calculada al crear la reserva y congelada en ella. |
| Cobro en línea | Sí, con Wompi Web Checkout cuando las tres llaves están configuradas; si no, coordinación manual. |
| Verificación del pago | Sí: firma del evento, monto y moneda antes de confirmar. |
| Pago tardío | No confirma si las fechas ya no están disponibles; deja la reserva cancelada con pago aprobado para reembolso manual. |
| Correo de confirmación | Sí, si Resend está configurado; si no, la reserva no se bloquea por ello. |
| Reembolsos automáticos | No. Se gestionan manualmente en Wompi. |
| Bloqueo atómico en OTAs | No. Depende del feed iCal y de la latencia de importación de cada OTA. |
| Verificación en tiempo real contra Booking/Airbnb | No existe. |

---

## 4. Limitaciones explícitas

1. **Sincronización perezosa, no programada**: los canales se refrescan al consultar disponibilidad o reservar, con umbral de 20 minutos y topes por petición. Si nadie consulta, `occupied` puede quedar obsoleto. No hay cron ni cola.
2. **Ventana de carrera con las OTAs**: entre la última sincronización y el momento de reservar, una OTA pudo vender la misma noche. El motor no puede detectarlo; la protección real es mantener el feed iCal conectado y sincronizar con frecuencia.
3. **El feed iCal y la página de estado son públicos**: cualquiera con la URL `/api/calendar/<id>` ve las fechas bloqueadas, y `/reserva/<code>` muestra alojamiento, fechas, huéspedes y total (sin datos de contacto ni pago). Tratarlos como enlaces no indexados, no como secretos.
4. **Parser iCal acotado**: sin recurrencias, sin cancelaciones dentro del archivo, tope de 730 noches. Calendarios con `RRULE` pueden producir bloqueos incompletos.
5. **Fechas manuales**: `fechasOcupadasBooking`/`fechasOcupadasAirbnb` del modelo no distinguen origen real; en datos de demostración son ficticias.
6. **Retención sin job**: al vencer `holdUntil`, la fecha se libera en la siguiente consulta. El registro no cambia de estado solo; el panel puede mostrar "Retención vencida" hasta que se cancele/confirme o llegue el webhook.
7. **Pago dependiente del webhook**: si Wompi no entrega el evento (o la reserva se creó en otro entorno), la reserva queda pendiente. El admin/panel puede confirmar el pago manualmente, pero no hay conciliación automática contra la API de Wompi. Un pago aprobado que llega tarde no reconfirma fechas ya liberadas; queda marcado para reembolso manual.
8. **Correos best effort**: sin `RESEND_API_KEY` no se envían; un fallo del proveedor no revierte la reserva y el resultado no queda auditado en la reserva.
9. **Alternativas**: solo ±3 días y mismo destino; no busca otras ciudades ni fechas lejanas.
10. **Rate limit en memoria**: por instancia del Worker; no es distribuido.
11. **Cancelación**: `PATCH /api/reservations` y `PATCH /api/admin/reservations` usan CAS. Cancelar una reserva pagada libera fechas pero **no** emite reembolso.
12. **Multi-instancia**: toda la persistencia vive en filas JSON de `kv_store` (D1) o archivos locales (`readTable`/`writeTable`); no hay base relacional ni bloqueos SQL nativos.

---

## 5. Cumplimiento asociado

- **RNT**: obligatorio en alta y para activar un alojamiento (`legalPublishIssue`). Visible en micrositio, panel y admin. Base: Decreto 1836 de 2021.
- **Subarriendo**: declaración expresa + documento privado de autorización del propietario; el alojamiento nace pausado y se pausa si se elimina el documento. Base: Ley 820 de 2003, art. 17.
- **Habeas Data**: consentimiento obligatorio en registro y reserva sin cuenta; se guardan versión de política, fecha, IP y user agent en la reserva/usuario y en `consent-logs`. Bases: Ley 1581 de 2012, Decreto 1377 de 2013.
- **Pagos**: la política de privacidad declara el tratamiento de datos de pago (estado, referencia, método y monto, sin números de tarjeta) y a Wompi como pasarela. Los términos describen el pago en línea, la retención de 30 minutos y la coordinación manual cuando no hay pasarela.
- **Versiones legales**: `LEGAL_VERSION` (modelo de alojamiento) y `PRIVACY_VERSION` (textos y consentimientos). Los textos legales almacenados se reemplazan por los del código cuando su `version` no coincide (`mergeLegalVersioned` en `src/lib/site-settings.ts`). Versión vigente: `2026-10-31`.

---

## 6. Endpoints

| Método | Ruta | Auth | Uso |
|---|---|---|---|
| GET | `/api/availability` | pública | Calendario, validación, precio y alternativas de un alojamiento |
| GET | `/api/availability/search` | pública (rate limit) | Disponibilidad de todo el catálogo para unas fechas |
| POST | `/api/reservations` | pública (consentimiento) | Crear reserva atómica; hold si hay Wompi |
| GET | `/api/reservations` | sesión | Reservas propias y recibidas |
| PATCH | `/api/reservations` | sesión | Confirmar/cancelar con CAS |
| POST | `/api/payments/wompi` | firma Wompi | Webhook de transacciones |
| GET | `/reserva/[code]` | pública | Estado de la reserva (noindex) |
| GET | `/api/calendar/[id]` | pública | Feed iCal de bloqueos y retenciones |
| GET/POST/PATCH/DELETE | `/api/listing-channels` | sesión (dueño/admin) | Canales iCal y sincronización manual |
| POST | `/api/webhooks` | HMAC | Bloqueos empujados por integradores |
| POST/GET/DELETE | `/api/listings/sublease-doc` | sesión (dueño/admin) | Documento privado de subarriendo |

---

## 7. Configuración

Los valores se leen con `getEnvVar` (primero el binding de Cloudflare, luego `process.env`). En local van en `.dev.vars`; en producción, como secretos de Wrangler. **No se commitean valores reales.**

| Variable | Obligatoria | Uso |
|---|---|---|
| `WOMPI_PUBLIC_KEY` | para pago en línea | Llave pública del comercio |
| `WOMPI_INTEGRITY_SECRET` | para pago en línea | Firma de integridad del checkout |
| `WOMPI_EVENTS_SECRET` | para pago en línea | Checksum de eventos |
| `WOMPI_CHECKOUT_URL` | no | Override del checkout (sandbox/producción) |
| `SITE_URL` | no | Base de redirects y enlaces de estado (fallback `https://biohostels.com`) |
| `RESEND_API_KEY` | para correos | Envío transaccional |
| `MAIL_FROM` | no | Remitente; fallback `Biohostels <reservas@biohostels.com>` |
| `WEBHOOK_SECRET` | para `/api/webhooks` | HMAC de integradores |

Si falta cualquiera de las tres llaves de Wompi, `wompiConfig` devuelve `null` y el sistema opera en modo de pago manual.

---

## 8. Verificación rápida

```bash
npm run typecheck
npm run lint
npm run qa:payments

# Disponibilidad de un alojamiento (sin fechas)
curl "http://localhost:3000/api/availability?listingId=<id>"

# Búsqueda de disponibilidad en la landing
curl "http://localhost:3000/api/availability/search?checkIn=2026-12-01&checkOut=2026-12-03"

# Reserva (invitado, requiere consentimiento)
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"listingId":"<id>","checkIn":"2026-12-01","checkOut":"2026-12-03","guests":2,"nombre":"Prueba","email":"prueba@example.com","telefono":"3000000000","consent":true,"requestId":"qa-001"}'

# Feed iCal (incluye retenciones como TENTATIVE)
curl -i "http://localhost:3000/api/calendar/<id>"
```

`npm run qa:payments` valida sin red la firma de integridad, la URL de checkout, el mapeo de estados y la verificación/tamper de eventos Wompi con vectores calculados de forma independiente.
