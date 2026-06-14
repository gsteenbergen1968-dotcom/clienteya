import crypto from "crypto";

export type BancardEnvironment = "staging" | "production";

export type BancardPlanType = "starter" | "pro" | "enterprise";

export type BancardCheckoutInput = {
  shopProcessId: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
};

export type BancardSingleBuyResponse = {
  status: "success" | "error";
  process_id?: string;
  messages?: unknown;
};

export type BancardConfirmOperation = {
  token?: string;
  shop_process_id?: string | number;
  response?: "S" | "N" | string;
  response_details?: string;
  amount?: string | number;
  currency?: string;
  authorization_number?: string;
  ticket_number?: string | number;
  response_code?: string;
  response_description?: string;
  extended_response_description?: string;
  security_information?: unknown;
};

const BANCARD_ENDPOINTS: Record<BancardEnvironment, string> = {
  staging: "https://vpos.infonet.com.py:8888",
  production: "https://vpos.infonet.com.py",
};

function getBancardConfig() {
  const publicKey = process.env.BANCARD_PUBLIC_KEY;
  const privateKey = process.env.BANCARD_PRIVATE_KEY;
  const environment =
    (process.env.BANCARD_ENV as BancardEnvironment | undefined) || "staging";

  if (!publicKey || !privateKey) {
    throw new Error("Missing Bancard credentials.");
  }

  return {
    publicKey,
    privateKey,
    environment,
    baseUrl: BANCARD_ENDPOINTS[environment],
  };
}

function md5(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}

export function formatBancardAmount(amount: number | string) {
  return Number(amount).toFixed(2);
}

export function getPlanAmount(plan: BancardPlanType) {
  if (plan === "starter") return 75000;
  if (plan === "pro") return 125000;

  throw new Error("Enterprise plan requires manual commercial agreement.");
}

export function getPlanDescription(plan: BancardPlanType) {
  if (plan === "starter") return "ClienteYA Plan Básico";
  if (plan === "pro") return "ClienteYA Plan Profesional";

  return "ClienteYA Plan Corporativo";
}

export function createSingleBuyToken({
  shopProcessId,
  amount,
  currency = "PYG",
}: {
  shopProcessId: number | string;
  amount: number | string;
  currency?: string;
}) {
  const { privateKey } = getBancardConfig();
  const formattedAmount = formatBancardAmount(amount);

  return md5(`${privateKey}${shopProcessId}${formattedAmount}${currency}`);
}

export function createSingleBuyConfirmToken({
  shopProcessId,
  amount,
  currency = "PYG",
}: {
  shopProcessId: number | string;
  amount: number | string;
  currency?: string;
}) {
  const { privateKey } = getBancardConfig();
  const formattedAmount = formatBancardAmount(amount);

  return md5(`${privateKey}${shopProcessId}confirm${formattedAmount}${currency}`);
}

export function isValidBancardConfirmOperation(operation: BancardConfirmOperation) {
  if (!operation.token || !operation.shop_process_id || !operation.amount) {
    return false;
  }

  const expectedToken = createSingleBuyConfirmToken({
    shopProcessId: operation.shop_process_id,
    amount: operation.amount,
    currency: operation.currency || "PYG",
  });

  return operation.token === expectedToken;
}

export function isApprovedBancardPayment(operation: BancardConfirmOperation) {
  return operation.response === "S" && operation.response_code === "00";
}

export async function createBancardSingleBuy({
  shopProcessId,
  amount,
  description,
  returnUrl,
  cancelUrl,
}: BancardCheckoutInput): Promise<BancardSingleBuyResponse> {
  const { publicKey, baseUrl } = getBancardConfig();
  const formattedAmount = formatBancardAmount(amount);

  const token = createSingleBuyToken({
    shopProcessId,
    amount,
    currency: "PYG",
  });

  const response = await fetch(`${baseUrl}/vpos/api/0.3/single_buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      public_key: publicKey,
      operation: {
        token,
        shop_process_id: shopProcessId,
        amount: formattedAmount,
        currency: "PYG",
        description,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  const data = (await response.json()) as BancardSingleBuyResponse;

  return data;
}

export function getBancardCheckoutUrl(processId: string) {
  const { baseUrl } = getBancardConfig();

  return `${baseUrl}/payment/single_buy?process_id=${processId}`;
}