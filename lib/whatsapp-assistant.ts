import { createAdminClient } from "./supabase/server";

type ClienteInput = {
  id?: string;
  nombre: string;
  telefono?: string | null;
  estado?: string | null;
  notas?: string | null;
  recordatorio?: string | null;
  proximo_contacto?: string | null;
  pagado?: boolean | null;
  monto?: number | null;
  fecha_pago?: string | null;
};

type UserSettings = {
  business_type?: string | null;
  business_tone?: string | null;
  brand_name?: string | null;
  ai_prompt?: string | null;
};

type StyleMemory = {
  prefersShort: boolean;
  usesEmojis: boolean;
  formalStyle: boolean;
};

type VariantItem = {
  id: string;
  label: string;
  tone: string;
  message: string;
};

type AssistantMessageResult = {
  key: string;
  businessType: string;
  businessTone: string;
  aiPrompt: string;
  message: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateEs(value?: string | null) {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatGs(value?: number | null) {
  if (!value) return "";
  return `Gs. ${Number(value).toLocaleString("es-ES")}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysBetween(date?: string | null) {
  if (!date) return 0;

  const today = new Date();
  const target = new Date(date);

  const todayClean = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const targetClean = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const diff = todayClean.getTime() - targetClean.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function normalize(value?: string | null) {
  return (value || "").trim();
}

function getFollowupKey(cliente: ClienteInput) {
  const today = todayISO();
  const next = cliente.proximo_contacto;
  const estado = normalize(cliente.estado).toLowerCase();

  if (cliente.pagado || estado === "pagó" || estado === "pagado") return "postventa";
  if (estado === "cerrado") return "closed";
  if (estado === "sin respuesta") return "no_response";
  if (estado === "contactado") return "contacted";
  if (next && next < today) return "overdue";
  if (next === today) return "today";
  if (next && next > today) return "upcoming";
  if (estado === "interesado") return "interested";
  if (estado === "nuevo") return "new";

  return "general";
}

function getFollowupIntensity(cliente: ClienteInput) {
  const days = daysBetween(cliente.proximo_contacto);

  if (days >= 7) return "final";
  if (days >= 3) return "push";
  if (days >= 1) return "soft";

  return "normal";
}

function getToneRules(tone?: string | null, style?: StyleMemory) {
  const usesEmojis = style?.usesEmojis ?? true;

  switch (normalize(tone).toLowerCase()) {
    case "formal":
      return {
        opener: "Buen día",
        closer: "Quedo a disposición.",
        emoji: "",
      };
    case "vendedor":
      return {
        opener: "Hola",
        closer: "Estoy atento para ayudarte a avanzar hoy.",
        emoji: usesEmojis ? "🔥" : "",
      };
    case "directo":
      return {
        opener: "Hola",
        closer: "Quedo atento.",
        emoji: "",
      };
    case "amable":
      return {
        opener: "Hola",
        closer: "Gracias por tu tiempo, quedo atenta.",
        emoji: usesEmojis ? "🙂" : "",
      };
    default:
      return {
        opener: "Hola",
        closer: usesEmojis ? "Quedo atento 😊" : "Quedo atento.",
        emoji: usesEmojis ? "👋" : "",
      };
  }
}

function buildContext(cliente: ClienteInput, style?: StyleMemory) {
  if (style?.prefersShort) {
    const lines: string[] = [];

    if (cliente.recordatorio) {
      lines.push(`Recordatorio: ${cliente.recordatorio}.`);
    }

    if (cliente.proximo_contacto) {
      lines.push(`Seguimiento: ${formatDateEs(cliente.proximo_contacto)}.`);
    }

    return lines;
  }

  const lines: string[] = [];
  const estado = normalize(cliente.estado) || "Sin estado";
  const notas = normalize(cliente.notas);
  const recordatorio = normalize(cliente.recordatorio);
  const fecha = formatDateEs(cliente.proximo_contacto);
  const monto = formatGs(cliente.monto);

  lines.push(`Estado actual: ${estado}.`);

  if (fecha) {
    lines.push(`Fecha de seguimiento: ${fecha}.`);
  }

  if (recordatorio) {
    lines.push(`Recordatorio: ${recordatorio}.`);
  }

  if (notas) {
    lines.push(`Contexto útil: ${notas}.`);
  }

  if (cliente.pagado) {
    lines.push(`Pago registrado${monto ? ` por ${monto}` : ""}.`);
  }

  return lines;
}

function getFollowLine(cliente: ClienteInput, style?: StyleMemory) {
  const intensity = getFollowupIntensity(cliente);

  if (intensity === "final") {
    return pickRandom([
      "No quiero insistir de más, así que dejo este último mensaje y quedo disponible si quieres retomarlo.",
      "Cierro este seguimiento por ahora, pero si todavía te interesa puedo ayudarte sin problema.",
    ]);
  }

  if (intensity === "push") {
    return pickRandom([
      "Si todavía te interesa, podemos avanzar hoy con el siguiente paso.",
      "Podemos dejar esto encaminado hoy si te viene bien.",
    ]);
  }

  if (intensity === "soft") {
    return pickRandom([
      "Quería hacer un pequeño seguimiento.",
      "Solo paso a recordarte este punto.",
    ]);
  }

  if (style?.prefersShort) {
    return pickRandom(["¿Avanzamos?", "¿Lo vemos?", "Quedo atento."]);
  }

  return pickRandom([
    "Si quieres, lo vemos juntos y avanzamos.",
    "Puedo ayudarte a dejar esto listo ahora mismo.",
    "Avanzamos con el siguiente paso cuando quieras.",
  ]);
}

function buildOpening(
  nombre: string,
  tone: ReturnType<typeof getToneRules>,
  style?: StyleMemory
) {
  if (style?.formalStyle) {
    return `${tone.opener} ${nombre}`.trim();
  }

  return `${pickRandom([
    `${tone.opener} ${nombre}`,
    `${tone.opener} ${nombre}, ¿cómo estás?`,
    `${tone.opener} ${nombre}, te escribo rápido`,
  ])} ${tone.emoji}`.trim();
}

function buildMessage(
  key: string,
  cliente: ClienteInput,
  settings: UserSettings,
  style: StyleMemory,
  forcedTone?: string
) {
  const tone = getToneRules(forcedTone || settings.business_tone, style);
  const nombre = normalize(cliente.nombre) || "cliente";
  const businessType = normalize(settings.business_type) || "ventas generales";
  const aiPrompt = normalize(settings.ai_prompt);
  const context = buildContext(cliente, style);
  const followLine = getFollowLine(cliente, style);
  const opening = buildOpening(nombre, tone, style);

  const contextBlock =
    context.length > 0 && !style.prefersShort
      ? ["", "Para contexto:", ...context.map((line) => `- ${line}`)]
      : context.length > 0
      ? ["", ...context]
      : [];

  const promptHint =
    aiPrompt && !style.prefersShort
      ? ["", `Estilo solicitado: ${aiPrompt}`]
      : [];

  if (key === "postventa") {
    return [
      opening,
      "",
      "Gracias nuevamente por tu pago. Quería asegurarme de que todo siga bien de tu lado.",
      style.prefersShort
        ? ""
        : "Si necesitas soporte, una aclaración o el siguiente paso, estoy para ayudarte.",
      ...contextBlock,
      ...promptHint,
      "",
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (key === "closed") {
    return [
      opening,
      "",
      "Te escribo solo para cerrar correctamente este seguimiento.",
      "Si más adelante quieres retomarlo, puedes escribirme sin problema.",
      ...contextBlock,
      "",
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (key === "no_response") {
    return [
      opening,
      "",
      "Te escribo para hacer un nuevo intento de seguimiento.",
      style.prefersShort
        ? ""
        : "Si ahora no es buen momento, no hay problema; puedo retomarlo más adelante.",
      ...contextBlock,
      "",
      followLine,
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (key === "contacted") {
    return [
      opening,
      "",
      "Quería dar continuidad al contacto anterior y ayudarte con el siguiente paso.",
      ...contextBlock,
      "",
      followLine,
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (key === "overdue") {
    return [
      opening,
      "",
      "Te escribo porque quedó pendiente nuestro seguimiento.",
      businessType === "inmobiliaria"
        ? "Podemos retomar la consulta sobre la propiedad y ver si todavía te interesa avanzar."
        : "Podemos retomar este punto y ver si todavía te interesa avanzar.",
      ...contextBlock,
      "",
      followLine,
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (key === "today") {
    return [
      opening,
      "",
      "Hoy quería retomar contigo el siguiente paso.",
      businessType === "inmobiliaria"
        ? "Si quieres, revisamos la propiedad y vemos cómo avanzar."
        : "Si quieres, revisamos esto juntos y avanzamos.",
      ...contextBlock,
      "",
      followLine,
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (key === "upcoming") {
    return [
      opening,
      "",
      "Te escribo para dejar preparado el siguiente paso.",
      businessType === "inmobiliaria"
        ? "Así podemos avanzar con la visita, la consulta o la información pendiente."
        : "Así podemos avanzar sin dejar el seguimiento para último momento.",
      ...contextBlock,
      "",
      followLine,
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (key === "interested") {
    return [
      opening,
      "",
      "Quería retomar tu interés y ayudarte a avanzar.",
      businessType === "inmobiliaria"
        ? "Si todavía estás buscando, puedo ayudarte a revisar opciones o coordinar el siguiente paso."
        : "Si todavía te interesa, puedo ayudarte a resolver dudas y avanzar.",
      ...contextBlock,
      "",
      followLine,
      tone.closer,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    opening,
    "",
    "Te escribo para dar seguimiento.",
    ...contextBlock,
    "",
    followLine,
    tone.closer,
  ]
    .filter(Boolean)
    .join("\n");
}

async function getSettings(userId: string): Promise<UserSettings> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("user_settings")
    .select("business_type, business_tone, brand_name, ai_prompt")
    .eq("user_id", userId)
    .maybeSingle();

  return (data || {}) as UserSettings;
}

async function getStyleMemory(userId: string): Promise<StyleMemory> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("whatsapp_logs")
    .select("message")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  const messages = (data || []).map((item) => String(item.message || ""));

  if (messages.length === 0) {
    return {
      prefersShort: false,
      usesEmojis: true,
      formalStyle: false,
    };
  }

  const totalLength = messages.reduce((sum, msg) => sum + msg.length, 0);
  const avgLength = totalLength / messages.length;

  const emojiCount = messages.filter((msg) =>
    /[\u{1F300}-\u{1FAFF}]/u.test(msg)
  ).length;

  const formalCount = messages.filter((msg) => {
    const text = msg.toLowerCase();

    return (
      text.includes("buen día") ||
      text.includes("quedo a disposición") ||
      text.includes("estimado")
    );
  }).length;

  return {
    prefersShort: avgLength < 220,
    usesEmojis: emojiCount >= Math.ceil(messages.length / 3),
    formalStyle: formalCount >= Math.ceil(messages.length / 3),
  };
}

export async function buildAssistantMessage({
  userId,
  cliente,
}: {
  userId: string;
  cliente: ClienteInput;
}): Promise<AssistantMessageResult> {
  const settings = await getSettings(userId);
  const style = await getStyleMemory(userId);
  const key = getFollowupKey(cliente);

  return {
    key,
    businessType: settings.business_type || "ventas_generales",
    businessTone: settings.business_tone || "cercano",
    aiPrompt:
      settings.ai_prompt ||
      "Escribe mensajes claros, útiles y breves. Mantén un tono humano y orientado a convertir sin sonar agresivo.",
    message: buildMessage(key, cliente, settings, style),
  };
}

export async function buildAssistantVariants({
  userId,
  cliente,
}: {
  userId: string;
  cliente: ClienteInput;
}): Promise<VariantItem[]> {
  const settings = await getSettings(userId);
  const style = await getStyleMemory(userId);
  const key = getFollowupKey(cliente);

  const tones = [
    { id: "base", label: "Base", tone: settings.business_tone || "cercano" },
    { id: "formal", label: "Formal", tone: "formal" },
    { id: "vendedor", label: "Vendedor", tone: "vendedor" },
  ];

  return tones.map((t) => ({
    id: t.id,
    label: t.label,
    tone: t.tone,
    message: buildMessage(key, cliente, settings, style, t.tone),
  }));
}