type Relationship = {
  nombre: string;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
};

type Recommendation = {
  title: string;
  description: string;
  tone: "green" | "amber" | "red" | "blue";
};

export function buildWhatsAppDraft(
  relationship: Relationship,
  recommendation?: Recommendation
) {
  const nombre = relationship.nombre || "relación";
  const estado = (relationship.estado || "").toLowerCase();
  const notas = (relationship.notas || "").toLowerCase();
  const title = recommendation?.title || "";

  if (title.includes("Lead enfriándose")) {
    return `Hola ${nombre}, ¿cómo estás? Te escribo para hacer seguimiento y ver si todavía te interesa avanzar. Si te parece bien, podemos retomar por acá.`;
  }

  if (title.includes("Relación lista para cerrar")) {
    return `Hola ${nombre}, gracias por el interés. Creo que estamos en buen momento para avanzar. ¿Querés que te pase el siguiente paso para cerrar?`;
  }

  if (title.includes("Enviar prueba social")) {
    return `Hola ${nombre}, te comparto esto porque puede ayudarte a decidir. Ya estamos trabajando con relaciones que buscaban algo parecido y los resultados fueron muy positivos. ¿Querés que te cuente cómo sería en tu caso?`;
  }

  if (title.includes("Pedir comprobante")) {
    return `Hola ${nombre}, te escribo para confirmar si ya pudiste enviar el comprobante. Apenas lo tenga, avanzamos con el siguiente paso.`;
  }

  if (estado.includes("sin respuesta")) {
    return `Hola ${nombre}, solo paso a hacer seguimiento. Entiendo que capaz estás ocupado/a. ¿Querés que lo retomemos hoy o preferís que te escriba más adelante?`;
  }

  if (estado.includes("interes")) {
    return `Hola ${nombre}, gracias por tu interés. Te escribo para ver si querés avanzar con el siguiente paso o si tenés alguna duda que pueda aclararte.`;
  }

  if (notas.includes("precio")) {
    return `Hola ${nombre}, quería hacer seguimiento sobre el precio y resolver cualquier duda antes de avanzar. ¿Querés que lo revisemos juntos?`;
  }

  return (
    relationship.recordatorio ||
    `Hola ${nombre}, te escribo para hacer seguimiento. ¿Seguimos avanzando?`
  );
}