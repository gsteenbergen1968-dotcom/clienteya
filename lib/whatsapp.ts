export function createWhatsAppUrl(phone: string, message: string) {
  const clean = String(phone || "").replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export const defaultTemplates = {
  nuevo() {
    return `Hola {{nombre}} 👋

Gracias por tu interés. Te escribo para darte seguimiento y ayudarte con el siguiente paso.

Quedo atento 😊`;
  },

  hoy() {
    return `Hola {{nombre}} 👋

Te escribo porque hoy tenía pendiente hacer seguimiento.

Nota: {{nota}}

Quedo atento 😊`;
  },

  pendiente() {
    return `Hola {{nombre}} 👋

Te contacto nuevamente porque quedó pendiente el seguimiento.
Si todavía te interesa, puedo ayudarte a avanzar con el siguiente paso.

Nota previa: {{nota}}

Quedo atento 😊`;
  },

  proximo() {
    return `Hola {{nombre}} 👋

Te escribo para dejarte preparado el próximo paso.
Tengo como seguimiento la fecha {{fecha}} y puedo ayudarte a avanzar cuando quieras.

Quedo atento 😊`;
  },

  postventa() {
    return `Hola {{nombre}} 👋

Gracias nuevamente por tu compra. Solo quería saber si todo va bien y si necesitas algo más de mi parte.

Quedo atento 😊`;
  },
};