export type RevenueScore = {
  estimatedValue: number;
  probability: number;
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

export function getRevenueScore(
  estado: string | null | undefined,
  monto?: number | null
): RevenueScore {
  const status = normalize(estado);

  if (status.includes("pag")) {
    return {
      estimatedValue: Number(monto || 0),
      probability: 100,
    };
  }

  if (status.includes("propuesta")) {
    return {
      estimatedValue: Number(monto || 300000),
      probability: 80,
    };
  }

  if (status.includes("interes")) {
    return {
      estimatedValue: Number(monto || 200000),
      probability: 60,
    };
  }

  if (status.includes("contact")) {
    return {
      estimatedValue: Number(monto || 100000),
      probability: 40,
    };
  }

  return {
    estimatedValue: Number(monto || 50000),
    probability: 20,
  };
}