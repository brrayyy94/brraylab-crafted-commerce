# Integración de Wompi + Contraentrega nacional

## Resumen

Integrar Wompi como pasarela principal y habilitar contraentrega para **toda Colombia**. La diferencia es qué se paga por adelantado: en Cali nada, fuera de Cali el domicilio anticipado con Wompi. Toda la configuración editable desde `/admin`.

## Métodos de pago resultantes

Según ciudad detectada:

**Cali (entrega local)** — 2 opciones:
1. **Pago total con Wompi** — paga producto + domicilio ahora.
2. **Contraentrega total** — no paga nada, paga producto + domicilio al recibir.

**Otras ciudades (envío nacional)** — 2 opciones:
1. **Pago total con Wompi** — paga producto + envío ahora.
2. **Contraentrega con anticipo de envío** — paga el envío con Wompi ahora, paga el producto al recibir. Banner: *"Para envíos fuera de Cali debes pagar el domicilio anticipado para garantizar el envío."*

## Base de datos

Migración `site_settings` clave `payments` con valores por defecto:
- `wompi_public_key`: ""
- `wompi_environment`: "sandbox" | "production"
- `whatsapp_notifications`: ""
- `cod_enabled`: true
- `local_city`: "Cali"
- `shipping_local`: 8000
- `shipping_national`: 18000

Nuevas columnas en `orders`:
- `payment_reference` (text) — referencia Wompi
- `payment_environment` (text) — sandbox/production
- `amount_paid_online` (numeric) — lo cobrado por Wompi (total o solo envío)
- `amount_due_on_delivery` (numeric) — lo que se cobra al entregar

Estados `payment_status` usados: `pending`, `paid`, `failed`, `cod_pending`, `partial_paid` (anticipo de envío + resto contraentrega).

## Edge Functions

1. **`wompi-create-transaction`** — recibe `orderId` y `amount_in_cents` (puede ser total o solo envío), genera `signature:integrity = SHA256(reference + amount + currency + integrity_secret)`, devuelve datos para abrir el Widget.

2. **`wompi-webhook`** (`verify_jwt = false`) — recibe `transaction.updated`, valida firma de eventos, actualiza `payment_status` y `status` por `reference = order_number`.

Secretos requeridos (los pediré tras aprobar):
- `WOMPI_INTEGRITY_SECRET`
- `WOMPI_EVENTS_SECRET`

La llave **pública** se pega desde el admin, no requiere secreto.

## Frontend

### Checkout (`src/pages/Checkout.tsx`) — 3 pasos

**Paso 1 — Datos + Envío** (combinado):
- Nombre, teléfono/WhatsApp, departamento, ciudad, dirección, notas.
- Al cambiar ciudad: normalizar (lowercase + sin tildes) y comparar con `local_city`. Detecta `isLocal`.

**Paso 2 — Método de pago**:
- Recalcular envío: `shipping_local` si Cali, `shipping_national` si no.
- Mostrar siempre 2 tarjetas:
  - **Pagar todo con Wompi** — total = subtotal + envío.
  - **Contraentrega**:
    - Si `isLocal`: "Pagas $X al recibir (producto + domicilio)".
    - Si nacional: "Anticipa el envío $Y con Wompi · Pagas $Z al recibir el producto" + banner de aviso.
- Si `cod_enabled === false` ocultar contraentrega.

**Paso 3 — Confirmar**:
- Resumen claro de qué se paga ahora vs al recibir.
- **Wompi total** → crea orden `payment_status=pending`, `amount_paid_online=total`, llama `wompi-create-transaction`, abre Widget.
- **Contraentrega Cali** → crea orden `payment_status=cod_pending`, `amount_due_on_delivery=total`, redirige a confirmación + WhatsApp.
- **Contraentrega nacional** → crea orden `payment_status=partial_paid` (queda `pending` hasta confirmar el anticipo), `amount_paid_online=shipping`, `amount_due_on_delivery=subtotal`, abre Widget de Wompi por el monto del envío.

### Confirmación (`OrderConfirmed.tsx`)
- Muestra número de pedido, qué se pagó, qué queda por pagar al recibir.
- Botón / auto-apertura `wa.me/<numero_admin>?text=<resumen>` con detalles de la orden.

### Admin — sección "Pagos & Envíos" en `AdminStub.tsx`
- Llave pública Wompi
- Toggle Sandbox/Producción
- WhatsApp notificaciones
- Toggle contraentrega habilitada
- Ciudad local (default Cali)
- Costo envío local
- Costo envío nacional
- Botón guardar (upsert `site_settings.payments`)

### Hooks/utilidades nuevas
- `src/hooks/usePaymentSettings.ts`
- `src/lib/wompi.ts` — carga script `https://checkout.wompi.co/widget.js` y abre widget
- `src/lib/whatsapp.ts` — formatea mensaje de pedido

## Archivos

**Crear:**
- `supabase/functions/wompi-create-transaction/index.ts`
- `supabase/functions/wompi-webhook/index.ts`
- `src/hooks/usePaymentSettings.ts`
- `src/lib/wompi.ts`
- `src/lib/whatsapp.ts`
- Migración SQL

**Modificar:**
- `src/pages/Checkout.tsx`
- `src/pages/OrderConfirmed.tsx`
- `src/pages/admin/AdminStub.tsx`

## Confirmación necesaria

Tras aprobar, te pediré por formulario seguro:
- `WOMPI_INTEGRITY_SECRET` (sandbox)
- `WOMPI_EVENTS_SECRET` (sandbox)

La URL del webhook que debes registrar en el dashboard de Wompi te la daré después del despliegue.
