// QA offline de la integración Wompi: firmas de integridad y checksum de eventos.
// Ejecuta con: npm run qa:payments (Node 22.18+ / 24 con type stripping).
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  amountInCents,
  buildCheckoutUrl,
  integritySignature,
  paymentOutcome,
  siteBaseUrl,
  verifyWompiEvent,
  wompiConfig,
} from "../src/lib/payments.ts";

const config = {
  publicKey: "pub_test_qa",
  integritySecret: "integrity_secret_qa",
  eventsSecret: "events_secret_qa",
  checkoutUrl: "https://checkout.wompi.co/p/",
};

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error });
  }
}

check("amountInCents redondea y multiplica por 100", () => {
  assert.equal(amountInCents(180000), 18000000);
  assert.equal(amountInCents(1234.5), 123500);
  assert.equal(amountInCents(-5), 0);
});

check("wompiConfig exige las tres llaves", () => {
  assert.equal(wompiConfig({}), null);
  assert.equal(wompiConfig({ WOMPI_PUBLIC_KEY: "pub" }), null);
  assert.equal(wompiConfig({ WOMPI_PUBLIC_KEY: "pub", WOMPI_INTEGRITY_SECRET: "i" }), null);
  assert.equal(wompiConfig({ WOMPI_PUBLIC_KEY: "pub", WOMPI_INTEGRITY_SECRET: "i", WOMPI_EVENTS_SECRET: "e" })?.eventsSecret, "e");
});

check("siteBaseUrl quita barras finales y usa el origen de respaldo", () => {
  assert.equal(siteBaseUrl("https://biohostels.com/", "http://localhost:3000"), "https://biohostels.com");
  assert.equal(siteBaseUrl(undefined, "http://localhost:3000/"), "http://localhost:3000");
});

check("paymentOutcome mapea estados de Wompi", () => {
  assert.equal(paymentOutcome("APPROVED"), "aprobado");
  assert.equal(paymentOutcome("DECLINED"), "rechazado");
  assert.equal(paymentOutcome("ERROR"), "rechazado");
  assert.equal(paymentOutcome("VOIDED"), "expirado");
  assert.equal(paymentOutcome("PENDING"), "pendiente");
});

const checkoutInput = {
  reference: "BIO-QA001",
  amountInCents: 18000000,
  redirectUrl: "https://biohostels.com/reserva/BIO-QA001",
  customerEmail: "qa@example.com",
  customerName: "Prueba QA",
};

const expectedIntegrity = crypto
  .createHash("sha256")
  .update(`${checkoutInput.reference}${checkoutInput.amountInCents}COP${config.integritySecret}`)
  .digest("hex");

await checkAsync("integritySignature coincide con SHA256(referencia+monto+moneda+secreto)", async () => {
  assert.equal(await integritySignature(config, checkoutInput), expectedIntegrity);
});

await checkAsync("buildCheckoutUrl incluye firma, monto y datos del cliente", async () => {
  const url = new URL(await buildCheckoutUrl(config, checkoutInput));
  assert.equal(url.origin + url.pathname, "https://checkout.wompi.co/p/");
  assert.equal(url.searchParams.get("public-key"), config.publicKey);
  assert.equal(url.searchParams.get("currency"), "COP");
  assert.equal(url.searchParams.get("amount-in-cents"), String(checkoutInput.amountInCents));
  assert.equal(url.searchParams.get("reference"), checkoutInput.reference);
  assert.equal(url.searchParams.get("signature:integrity"), expectedIntegrity);
  assert.equal(url.searchParams.get("redirect-url"), checkoutInput.redirectUrl);
  assert.equal(url.searchParams.get("customer-data:email"), checkoutInput.customerEmail);
  assert.equal(url.searchParams.get("customer-data:full-name"), checkoutInput.customerName);
});

const eventData = {
  transaction: {
    id: "tx-qa-1",
    status: "APPROVED",
    reference: checkoutInput.reference,
    amount_in_cents: checkoutInput.amountInCents,
    currency: "COP",
  },
};
const eventProperties = [
  "transaction.id",
  "transaction.status",
  "transaction.reference",
  "transaction.amount_in_cents",
  "transaction.currency",
];
const eventTimestamp = 1799999999;
const eventValues = eventProperties.map((path) => path.split(".").reduce((acc, key) => acc?.[key], eventData));
const eventChecksum = crypto
  .createHash("sha256")
  .update(eventValues.join("") + String(eventTimestamp) + config.eventsSecret)
  .digest("hex");
const eventPayload = {
  event: "transaction.updated",
  data: eventData,
  signature: { properties: eventProperties, checksum: eventChecksum },
  timestamp: eventTimestamp,
};

await checkAsync("verifyWompiEvent acepta un checksum válido", async () => {
  assert.equal(await verifyWompiEvent(config, eventPayload), true);
});

await checkAsync("verifyWompiEvent rechaza monto o checksum manipulados", async () => {
  const tamperedAmount = structuredClone(eventPayload);
  tamperedAmount.data.transaction.amount_in_cents = 1;
  assert.equal(await verifyWompiEvent(config, tamperedAmount), false);
  const tamperedChecksum = structuredClone(eventPayload);
  tamperedChecksum.signature.checksum = "0".repeat(64);
  assert.equal(await verifyWompiEvent(config, tamperedChecksum), false);
});

await checkAsync("verifyWompiEvent rechaza eventos sin propiedades", async () => {
  assert.equal(await verifyWompiEvent(config, { ...eventPayload, signature: { checksum: eventChecksum } }), false);
});

async function checkAsync(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error });
  }
}

for (const result of checks) {
  if (!result.ok) {
    console.error(`FALLO  ${result.name}`);
    console.error(result.error);
  } else {
    console.log(`OK     ${result.name}`);
  }
}

const failed = checks.filter((result) => !result.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} verificaciones OK`);
if (failed > 0) process.exit(1);
